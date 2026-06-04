#!/bin/bash
# rebuild-all-11.sh — Sequential rebuild of all 11 apps with disk-cleanup between each.
# For each app:
#   npm install -> prebuild --clean -> bundle JS -> gradle assembleRelease+bundleRelease
#   -> copy to playstore/ -> upload GH Release -> cleanup intermediates + previous app's node_modules

set -e

KS_DIR="C:/Users/21266/Desktop/sdk52/SallyCards/private/keystores-rotated-2026-06-02"
NEW_PASS="SallyCards2027"
ROOT="C:/Users/21266/Desktop/sdk52/SallyCards"

APPS=(belote okey quiestce scopa tarot solitaire kdoub poker ronda concentration kantcopy)
PREV_APP=""

for APP in "${APPS[@]}"; do
  echo ""
  echo "============================================================"
  echo "=== sally-$APP rebuild — $(date +%H:%M:%S) ==="
  echo "============================================================"
  df -h /c | tail -1 | awk '{print "  DISK: " $4 " free (" $5 " used)"}'

  cd "$ROOT/apps-deploy/sally-$APP"

  # 1. npm install (gets new deps: expo-av, expo-haptics, expo-apple-authentication, react-native-purchases, google-signin)
  echo "  → npm install..."
  npm install --legacy-peer-deps --no-audit --no-fund --silent 2>&1 | tail -2
  rm -rf node_modules/jest-expo/node_modules/react node_modules/jest-expo/node_modules/react-dom node_modules/jest-expo/node_modules/react-server-dom-webpack node_modules/jest-expo/node_modules/react-test-renderer node_modules/jest-expo/node_modules/@types/react 2>/dev/null

  # 2. Disable new arch
  node -e "const j=JSON.parse(require('fs').readFileSync('app.json'));j.expo.newArchEnabled=false;require('fs').writeFileSync('app.json',JSON.stringify(j,null,2));"

  # 3. Prebuild
  echo "  → expo prebuild --clean..."
  CI=1 npx expo prebuild --platform android --clean 2>&1 | tail -2

  # 4. Stage keystore
  cp "$KS_DIR/sallycards-$APP.jks" "android/app/sallycards-$APP.jks"

  # 5. Patch build.gradle
  node -e "
    const fs=require('fs');
    let c=fs.readFileSync('android/app/build.gradle','utf-8');
    if(!c.includes('sallycards-$APP.jks')){
      c=c.replace(
        /signingConfigs \{\s*debug \{[\\s\\S]*?\}\s*\}\s*buildTypes \{\s*debug \{\s*signingConfig signingConfigs\.debug\s*\}\s*release \{\s*\/\/ Caution[\\s\\S]*?signingConfig signingConfigs\.debug/,
        \`signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('sallycards-$APP.jks')
            storePassword '$NEW_PASS'
            keyAlias 'sallycards-$APP'
            keyPassword '$NEW_PASS'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release\`);
      fs.writeFileSync('android/app/build.gradle',c);
    }
  "

  # 6. Stage .env
  cp .env.production .env 2>/dev/null

  # 7. Bundle JS
  echo "  → Bundle JS..."
  NODE_ENV=production npx expo export:embed \
    --platform android --dev false \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --reset-cache 2>&1 | tail -2

  # 8. Gradle build
  echo "  → Gradle assembleRelease + bundleRelease..."
  cd android
  ./gradlew assembleRelease bundleRelease --no-daemon --quiet 2>&1 | tail -5

  apk="app/build/outputs/apk/release/app-release.apk"
  aab="app/build/outputs/bundle/release/app-release.aab"
  if [ -f "$apk" ] && [ -f "$aab" ]; then
    APK_DEST="$ROOT/playstore/$APP/apk"
    mkdir -p "$APK_DEST"
    cp "$apk" "$APK_DEST/sallycards-$APP-v1.0.0-signed.apk"
    cp "$aab" "$APK_DEST/sallycards-$APP-v1.0.0-signed.aab"
    apk_size=$(stat -c %s "$apk" | awk '{printf "%.1fMB", $1/1048576}')
    aab_size=$(stat -c %s "$aab" | awk '{printf "%.1fMB", $1/1048576}')
    echo "  ✓ $APP: APK=$apk_size AAB=$aab_size"

    # 9. Upload GH Release
    cd ..
    echo "  → Upload GH..."
    gh release delete-asset v1.0.0-signed "sallycards-$APP-v1.0.0-signed.apk" --yes 2>&1 | tail -1
    gh release delete-asset v1.0.0-signed "sallycards-$APP-v1.0.0-signed.aab" --yes 2>&1 | tail -1
    gh release upload v1.0.0-signed \
      "$APK_DEST/sallycards-$APP-v1.0.0-signed.apk" \
      "$APK_DEST/sallycards-$APP-v1.0.0-signed.aab" \
      --clobber 2>&1 | tail -2

    # 10. Cleanup intermediates for next build
    rm -rf android/.gradle android/build android/app/build/intermediates android/app/build/tmp android/app/build/generated 2>/dev/null

    # 11. Drop previous app's node_modules
    if [ -n "$PREV_APP" ] && [ "$PREV_APP" != "$APP" ]; then
      rm -rf "$ROOT/apps-deploy/sally-$PREV_APP/node_modules" 2>/dev/null
    fi
    PREV_APP="$APP"
  else
    echo "  ✗ $APP: BUILD FAILED — apk or aab missing"
  fi

  cd "$ROOT/apps-deploy"
done

echo ""
echo "============================================================"
echo "=== ALL 11 REBUILDS DONE — $(date +%H:%M:%S) ==="
echo "============================================================"
df -h /c | tail -1
echo ""
echo "=== Final inventory ==="
for app in "${APPS[@]}"; do
  apk="$ROOT/playstore/$app/apk/sallycards-$app-v1.0.0-signed.apk"
  if [ -f "$apk" ]; then
    sz=$(stat -c %s "$apk" | awk '{printf "%.0fMB", $1/1048576}')
    echo "  ✓ $app: $sz"
  else
    echo "  ✗ $app: missing"
  fi
done
