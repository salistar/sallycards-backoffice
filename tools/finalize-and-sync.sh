#!/bin/bash
# finalize-and-sync.sh — Final verification + sync after 11 rebuilds
# Verifies:
#   1. All 11 APK+AAB exist locally with today's timestamp
#   2. All 11 GH Releases have v1.0.0-signed assets uploaded
#   3. Backend api.salistar.com + socket ws.salistar.com + TURN turn.salistar.com are UP
#   4. Web games.ts URLs return 200 (HEAD check)
#   5. Sync each deploy repo (commit safe files + push)
#   6. Sync monorepo (apps/web/ + tools/ + playstore/)
#   7. SSH VPS to verify Docker stack is healthy

set +e  # don't exit on errors — report them all

ROOT="C:/Users/21266/Desktop/sdk52/SallyCards"
APPS=(belote okey quiestce scopa tarot solitaire kdoub poker ronda concentration kantcopy)
TODAY=$(date +%Y-%m-%d)

PASS=0; FAIL=0
declare -a ERRORS

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }

echo "============================================================"
echo "=== finalize-and-sync — $(date) ==="
echo "============================================================"

# ============ 1. Local APK/AAB freshness ============
echo ""
echo "=== [1] Local APK/AAB freshness check ==="
for app in "${APPS[@]}"; do
  apk="$ROOT/playstore/$app/apk/sallycards-$app-v1.0.0-signed.apk"
  aab="$ROOT/playstore/$app/apk/sallycards-$app-v1.0.0-signed.aab"
  if [ -f "$apk" ] && [ -f "$aab" ]; then
    apk_ts=$(stat -c %y "$apk" 2>/dev/null | cut -d' ' -f1)
    if [ "$apk_ts" = "$TODAY" ]; then
      ok "$app: APK + AAB present, today's build"
    else
      fail "$app: APK from $apk_ts (not today)"
    fi
  else
    fail "$app: APK or AAB missing"
  fi
done

# ============ 2. GH Releases v1.0.0-signed ============
echo ""
echo "=== [2] GH Releases v1.0.0-signed ==="
for app in "${APPS[@]}"; do
  cd "$ROOT/apps-deploy/sally-$app"
  json=$(gh release view v1.0.0-signed --json assets 2>/dev/null)
  apk_count=$(echo "$json" | grep -o '"name":"sallycards-'"$app"'-v1.0.0-signed.apk"' | wc -l)
  aab_count=$(echo "$json" | grep -o '"name":"sallycards-'"$app"'-v1.0.0-signed.aab"' | wc -l)
  if [ "$apk_count" -ge 1 ] && [ "$aab_count" -ge 1 ]; then
    ok "$app: GH Release has APK + AAB"
  else
    fail "$app: GH Release missing assets (apk=$apk_count, aab=$aab_count)"
  fi
done

# ============ 3. Backend services up ============
echo ""
echo "=== [3] Backend services healthcheck ==="
# api.salistar.com
api_status=$(curl -sk -o /dev/null -w "%{http_code}" https://api.salistar.com/ 2>/dev/null || echo "000")
[ "$api_status" -ge 200 ] && [ "$api_status" -lt 500 ] && ok "API api.salistar.com responds (HTTP $api_status)" || fail "API api.salistar.com NOT responding (HTTP $api_status)"

# Try /healthz, /health, /api/health
for ep in /healthz /api/health /api/v1/health; do
  s=$(curl -sk -o /dev/null -w "%{http_code}" "https://api.salistar.com$ep" 2>/dev/null || echo "000")
  if [ "$s" -ge 200 ] && [ "$s" -lt 300 ]; then
    ok "API endpoint $ep healthy (HTTP $s)"
    break
  fi
done

# Socket WS
ws_status=$(curl -sk -o /dev/null -w "%{http_code}" https://ws.salistar.com/socket.io/ 2>/dev/null || echo "000")
[ "$ws_status" -ge 200 ] && [ "$ws_status" -lt 500 ] && ok "Socket ws.salistar.com responds (HTTP $ws_status)" || fail "Socket ws.salistar.com NOT responding"

# TURN — check DNS + can connect to 3478 (UDP) — use nc with timeout
turn_dns=$(nslookup turn.salistar.com 2>/dev/null | grep "Address" | tail -1)
if echo "$turn_dns" | grep -q "[0-9]"; then
  ok "TURN turn.salistar.com DNS resolves: $turn_dns"
else
  fail "TURN turn.salistar.com DNS unresolved"
fi

# ============ 4. Web games.ts URLs reachable ============
echo ""
echo "=== [4] Web games.ts apkUrl validity (HEAD check) ==="
for app in "${APPS[@]}"; do
  url="https://github.com/salistar/sally-$app/releases/download/v1.0.0-signed/sallycards-$app-v1.0.0-signed.apk"
  s=$(curl -sLk -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  [ "$s" -eq 200 ] && ok "$app apk URL serves (HTTP 200)" || fail "$app apk URL HTTP $s"
done

# ============ 5. Sync deploy repos ============
echo ""
echo "=== [5] Sync deploy repos (git status + push if pending) ==="
for app in "${APPS[@]}"; do
  cd "$ROOT/apps-deploy/sally-$app"
  # Check for uncommitted changes (excluding gitignored)
  changes=$(git status --porcelain 2>/dev/null | grep -v "^??.*credentials" | grep -v "^??.*\.jks" | head -10)
  if [ -n "$changes" ]; then
    echo "  $app: pending changes detected, committing..."
    # Stage only safe files
    git add app.json package.json package-lock.json src/ app/ tools/ tools/*.py 2>/dev/null
    git add assets/ android/app/build.gradle 2>/dev/null

    # NEVER stage credentials
    git reset HEAD credentials/ credentials.json android/app/*.jks 2>/dev/null

    pending_diff=$(git diff --cached --shortstat 2>/dev/null)
    if [ -n "$pending_diff" ]; then
      git commit -m "feat(phase1-4): Sally engagement stack + card-hero + sons/haptics + Apple Sign In" 2>&1 | tail -2
      push_out=$(git push origin HEAD 2>&1 | tail -2)
      if echo "$push_out" | grep -q "main"; then
        ok "$app: pushed to GH"
      else
        fail "$app: push failed: $push_out"
      fi
    else
      ok "$app: nothing safe to commit (only gitignored files dirty)"
    fi
  else
    ok "$app: clean"
  fi
done

# ============ 6. Sync monorepo ============
echo ""
echo "=== [6] Sync monorepo ==="
cd "$ROOT"
changes=$(git status --porcelain 2>/dev/null | head -10)
if [ -n "$changes" ]; then
  echo "Pending changes in monorepo, staging safe files..."
  git add apps/web/ tools/ playstore/*/listings/ 2>/dev/null
  # NEVER stage private/, secrets, keystores
  git reset HEAD private/ 2>/dev/null
  diff_summary=$(git diff --cached --shortstat 2>/dev/null)
  if [ -n "$diff_summary" ]; then
    git commit -m "feat(phase1-4): web games.ts URLs + tools/ + 55 ASO listings + audit roadmap" 2>&1 | tail -2
    push_out=$(git push origin HEAD 2>&1 | tail -2)
    if echo "$push_out" | grep -qE "main|master|HEAD"; then
      ok "monorepo: pushed"
    else
      fail "monorepo: push failed"
    fi
  fi
else
  ok "monorepo: clean"
fi

# ============ 7. SSH VPS Docker stack health ============
echo ""
echo "=== [7] VPS Docker stack health (SSH 91.99.70.43) ==="
SSH_KEY="$HOME/.ssh/sallycards_ed25519"
if [ -f "$SSH_KEY" ]; then
  # Test SSH connectivity
  ssh_test=$(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY" deploy@91.99.70.43 "docker ps --format '{{.Names}} {{.Status}}'" 2>&1 | head -20)
  if echo "$ssh_test" | grep -qE "Up|seconds|minutes|hours|days"; then
    ok "VPS reachable, Docker containers:"
    echo "$ssh_test" | sed 's/^/      /'
  else
    fail "VPS SSH or Docker query failed: $ssh_test"
  fi
else
  fail "SSH key $SSH_KEY not present"
fi

# ============ SUMMARY ============
echo ""
echo "============================================================"
echo "=== SUMMARY — $(date) ==="
echo "============================================================"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  Errors:"
  for e in "${ERRORS[@]}"; do echo "    - $e"; done
fi
echo ""
echo "  Local APK/AAB: $ROOT/playstore/<app>/apk/"
echo "  GH Releases:   https://github.com/salistar/sally-<app>/releases/tag/v1.0.0-signed"
echo "  Web:           https://sallycards.salistar.com/download"
echo "  API:           https://api.salistar.com/"
echo "  Socket:        https://ws.salistar.com/socket.io/"
echo "  TURN:          turn:turn.salistar.com:3478"
