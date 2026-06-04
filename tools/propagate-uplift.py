# -*- coding: utf-8 -*-
"""Propage les changements 'uplift Google + onboarding + splash' aux 11 apps :
  - shared/googleAuth.ts : copie verbatim depuis ronda
  - app/auth/welcome.tsx : copie verbatim depuis ronda
  - app/auth/login.tsx : edits cibles (Google button -> logo G, +missingNative)

Usage : python tools/propagate-uplift.py
"""
import os, shutil, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "apps", "mobile", "ronda")
APPS_DIR = os.path.join(ROOT, "apps", "mobile")
TARGETS = ["kdoub", "belote", "tarot", "scopa", "okey", "quiestce",
           "poker", "concentration", "kantcopy", "solitaire"]

OLD_G_BLOCK = re.compile(
    r"<TouchableOpacity\s+style=\{s\.googleButton\}[\s\S]*?<Text style=\{s\.googleG\}>G</Text>\s*<Text style=\{s\.googleText\}>([^<]+)</Text>\s*</TouchableOpacity>",
    re.M,
)


def patch_login(path):
    txt = open(path, encoding="utf-8").read()
    changed = False

    # 1) destructure missingNative
    new_dest = "const { promptAsync, ready: googleReady, missingClientId, missingNative } = useGoogleSignIn("
    if "missingClientId, missingNative" not in txt:
        txt = txt.replace(
            "const { promptAsync, ready: googleReady, missingClientId } = useGoogleSignIn(",
            new_dest,
        )
        changed = True

    # 2) Insert missingNative alert in handleGoogle before setLoading(true)
    if "missingNative" not in txt or "Dev build requis" not in txt:
        block = (
            "    if (missingNative) {\n"
            "      Alert.alert(\n"
            "        'Dev build requis',\n"
            "        \"La connexion Google necessite un dev build : lancez `npx expo run:android` depuis le dossier de l'app, ce qui installe le module natif Google. Expo Go ne le supporte pas.\"\n"
            "      );\n"
            "      return;\n"
            "    }\n"
        )
        # Insert just before "setLoading(true);" inside handleGoogle
        new_txt, n = re.subn(
            r"(\)\;\s*\n\s*\}\s*\n\s*setLoading\(true\);\s*\n\s*try\s*\{\s*\n\s*await promptAsync\(\);)",
            block.rstrip("\n") + r"\n    setLoading(true);\n    try {\n      await promptAsync();",
            txt,
            count=1,
        )
        # Simpler: replace the line "setLoading(true);\n    try {\n      await promptAsync();"
        # only if it follows handleGoogle missingClientId block. Use a direct pattern:
        marker = "    if (missingClientId) {"
        if marker in txt:
            # find end of missingClientId block (closing }) then insert
            # robust split-by-anchor approach:
            anchor = "      );\n      return;\n    }\n    setLoading(true);\n    try {\n      await promptAsync();"
            if anchor in txt and "Dev build requis" not in txt:
                txt = txt.replace(
                    "      );\n      return;\n    }\n    setLoading(true);\n    try {\n      await promptAsync();",
                    "      );\n      return;\n    }\n" + block +
                    "    setLoading(true);\n    try {\n      await promptAsync();",
                    1,
                )
                changed = True

    # 3) Replace the Google button block: Text G -> Image google-g.png + dynamic label
    new_btn = (
        "<TouchableOpacity\n"
        "            style={s.googleButton}\n"
        "            onPress={handleGoogle}\n"
        "            disabled={loading}\n"
        "            activeOpacity={0.85}\n"
        "          >\n"
        "            <Image\n"
        "              source={require('../../assets/google-g.png')}\n"
        "              style={s.googleLogo}\n"
        "              resizeMode=\"contain\"\n"
        "            />\n"
        "            <Text style={s.googleText}>\n"
        "              {missingNative\n"
        "                ? 'Google (dev build requis)'\n"
        "                : 'Continuer avec Google'}\n"
        "            </Text>\n"
        "          </TouchableOpacity>"
    )
    txt2, n = OLD_G_BLOCK.subn(new_btn, txt, count=1)
    if n:
        txt = txt2
        changed = True

    # 4) Replace style googleG with googleLogo
    txt2 = re.sub(
        r"googleG:\s*\{\s*color:\s*'#4285F4'[^}]+\}\,",
        "googleLogo: { width: 22, height: 22 },",
        txt,
        count=1,
    )
    if txt2 != txt:
        txt = txt2
        changed = True

    if changed:
        open(path, "w", encoding="utf-8", newline="\n").write(txt)
    return changed


def copy_verbatim(src, dst):
    if not os.path.isfile(src):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)
    return True


def main():
    g_src = os.path.join(SRC, "shared", "googleAuth.ts")
    w_src = os.path.join(SRC, "app", "auth", "welcome.tsx")
    for app in TARGETS:
        app_dir = os.path.join(APPS_DIR, app)
        if not os.path.isdir(app_dir):
            print(app, "skip (no dir)")
            continue
        ga = copy_verbatim(g_src, os.path.join(app_dir, "shared", "googleAuth.ts"))
        we = copy_verbatim(w_src, os.path.join(app_dir, "app", "auth", "welcome.tsx"))
        lp = patch_login(os.path.join(app_dir, "app", "auth", "login.tsx"))
        print(f"{app:14s} googleAuth={'OK' if ga else '-'}  welcome={'OK' if we else '-'}  loginPatched={'OK' if lp else 'skip'}")


if __name__ == "__main__":
    main()
