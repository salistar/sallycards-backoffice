#!/bin/bash
# Fix + build a single app (add google-signin + prebuild + bundle + gradle + copy)
# Usage: fix-and-build-app.sh <app-slug>
set -e

APP=$1
KS_DIR="C:/Users/21266/Desktop/sdk52/SallyCards/private/keystores-rotated-2026-06-02"
NEW_PASS="SallyCards2027"
APK_DEST="C:/Users/21266/Desktop/sdk52/SallyCards/playstore/$APP/apk"

cd "C:/Users/21266/Desktop/sdk52/SallyCards/apps-deploy/sally-$APP"
echo ""
echo "============================================================"
echo "=== sally-$APP fix+build — $(date +%H:%M:%S) ==="
echo "============================================================"

# 1. Add google-signin
node -e "
  const fs=require('fs');
  const p=JSON.parse(fs.readFileSync('package.json'));
  if(!p.dependencies['@react-native-google-signin/google-signin']){
    p.dependencies['@react-native-google-signin/google-signin']='^13.1.0';
    fs.writeFileSync('package.json', JSON.stringify(p,null,2));
    console.log('  google-signin added');
  } else { console.log('  already present'); }
"

# 2. npm install
echo "  npm install..."
npm install --legacy-peer-deps --no-audit --no-fund --silent 2>&1 | tail -2
rm -rf node_modules/jest-expo/node_modules/react node_modules/jest-expo/node_modules/react-dom node_modules/jest-expo/node_modules/react-server-dom-webpack node_modules/jest-expo/node_modules/react-test-renderer node_modules/jest-expo/node_modules/@types/react 2>/dev/null

# 3. Disable new arch
node -e "const j=JSON.parse(require('fs').readFileSync('app.json'));j.expo.newArchEnabled=false;require('fs').writeFileSync('app.json',JSON.stringify(j,null,2));"

# 4. Prebuild
echo "  expo prebuild..."
CI=1 npx expo prebuild --platform android --clean 2>&1 | tail -2

# 5. Stage keystore
cp "$KS_DIR/sallycards-$APP.jks" "android/app/sallycards-$APP.jks"

# 6. Patch build.gradle
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
    console.log('  build.gradle patched');
  }
"

# 7. Stage .env
cp .env.production .env 2>/dev/null

# 8. Bundle JS
echo "  Bundle JS..."
NODE_ENV=production npx expo export:embed \
  --platform android --dev false \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --reset-cache 2>&1 | tail -2

# 9. Gradle build
echo "  Gradle assembleRelease + bundleRelease..."
cd android
./gradlew assembleRelease bundleRelease --no-daemon --quiet 2>&1 | tail -5

# 10. Copy artifacts
apk="app/build/outputs/apk/release/app-release.apk"
aab="app/build/outputs/bundle/release/app-release.aab"
if [ -f "$apk" ] && [ -f "$aab" ]; then
  mkdir -p "$APK_DEST"
  cp "$apk" "$APK_DEST/sallycards-$APP-v1.0.0-signed.apk"
  cp "$aab" "$APK_DEST/sallycards-$APP-v1.0.0-signed.aab"
  apk_size=$(stat -c %s "$apk" | awk '{printf "%.1fMB", $1/1048576}')
  aab_size=$(stat -c %s "$aab" | awk '{printf "%.1fMB", $1/1048576}')
  echo "  ✓ $APP: APK=$apk_size AAB=$aab_size"
else
  echo "  ✗ $APP build FAILED"
  exit 1
fi

# 11. Cleanup intermediates to save space for next build
rm -rf build app/build/intermediates app/build/tmp app/build/generated 2>/dev/null

# 12. Upload to GH Release v1.0.0-signed (replace existing)
cd ..
echo "  Upload to GH..."
gh release delete-asset v1.0.0-signed "sallycards-$APP-v1.0.0-signed.apk" --yes 2>&1 | tail -1
gh release delete-asset v1.0.0-signed "sallycards-$APP-v1.0.0-signed.aab" --yes 2>&1 | tail -1
gh release upload v1.0.0-signed \
  "$APK_DEST/sallycards-$APP-v1.0.0-signed.apk" \
  "$APK_DEST/sallycards-$APP-v1.0.0-signed.aab" \
  --clobber 2>&1 | tail -2

echo "  ✓ $APP DONE — $(date +%H:%M:%S)"
