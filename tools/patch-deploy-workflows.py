# Patch les workflows android-build.yml des 10 autres apps-deploy
# pour : 1) stager .env depuis .env.production avant bundle
#        2) bundle JS avec NODE_ENV=production
import os, re
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
APPS = ["ronda", "kdoub", "scopa", "poker", "tarot", "okey",
        "concentration", "quiestce", "kantcopy", "solitaire"]

INJECT = """      - name: Stage .env from .env.production (so EXPO_PUBLIC_* are inlined)
        run: |
          if [ -f .env.production ]; then
            cp .env.production .env
            echo "Staged .env from .env.production (keys only):"
            grep -v '^#' .env | grep -v '^$' | sed 's/=.*/=***/'
          else
            echo "WARNING: no .env.production present; EXPO_PUBLIC_* may be empty"
          fi

"""

OLD_BUNDLE = """      - name: Bundle JS (embedded, no Metro)
        run: |
          npx expo export:embed"""

NEW_BUNDLE = """      - name: Bundle JS (embedded, no Metro)
        env:
          NODE_ENV: production
        run: |
          npx expo export:embed"""

patched = 0
skipped = 0
for app in APPS:
    wf = ROOT / f"sally-{app}" / ".github" / "workflows" / "android-build.yml"
    if not wf.exists():
        print(f"  [skip] {app}: no workflow")
        skipped += 1
        continue
    s = wf.read_text(encoding="utf-8")
    if "Stage .env from" in s:
        print(f"  [skip] {app}: already patched")
        skipped += 1
        continue
    if OLD_BUNDLE not in s:
        print(f"  [WARN] {app}: bundle step pattern not found")
        continue
    new = s.replace(OLD_BUNDLE, INJECT + NEW_BUNDLE, 1)
    wf.write_text(new, encoding="utf-8")
    print(f"  + {app} patched")
    patched += 1

print(f"\nDONE: {patched} patched, {skipped} skipped/already-done")
