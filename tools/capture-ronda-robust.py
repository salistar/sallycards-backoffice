# -*- coding: utf-8 -*-
"""
Robust Ronda screenshot capture v2.
- Verifies the app is in foreground before each capture (dumpsys window)
- Uses UI dump to find real button positions
- If the app gets dismissed to system home, relaunches
- Longer waits + safe tap coordinates
"""
import subprocess
import time
import xml.etree.ElementTree as ET
import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DEVICE = "R83L20HWJTE"
PKG = "com.sallycards.ronda"
DEST = Path(r"C:\Users\21266\Desktop\screenshots\ronda")
TMP_UI = Path(r"C:\Users\21266\AppData\Local\Temp\ui-ronda2.xml")
DEST.mkdir(parents=True, exist_ok=True)

counter = 1  # continue from existing 01-05


def adb(args, capture=True):
    try:
        return subprocess.run(["adb", "-s", DEVICE] + args,
                              capture_output=capture, text=True, timeout=30)
    except Exception as e:
        print(f"  adb error: {e}")
        return None


def is_app_foreground():
    """Check if Sally Ronda is in foreground."""
    r = adb(["shell", "dumpsys", "window"])
    if r and r.stdout:
        # Look for mCurrentFocus or focusedWindow
        return PKG in r.stdout and ("mCurrentFocus" in r.stdout or "focusedWindow" in r.stdout)
    return False


def get_current_activity():
    r = adb(["shell", "dumpsys", "activity", "activities"])
    if r and r.stdout:
        for line in r.stdout.split('\n'):
            if 'topResumedActivity' in line or 'mResumedActivity' in line:
                return line.strip()[:120]
    return "?"


def ensure_app():
    """Bring Ronda to foreground if not already."""
    if PKG in (get_current_activity() or ""):
        return True
    print(f"  app not in foreground, relaunching...")
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(5)
    return PKG in (get_current_activity() or "")


def dump_ui():
    adb(["shell", "uiautomator", "dump", "/sdcard/Download/ui.xml"])
    adb(["pull", "/sdcard/Download/ui.xml", str(TMP_UI)])


def find_clickable(text_pattern, prefer_lowest=False):
    if not TMP_UI.exists():
        return None
    try:
        tree = ET.parse(str(TMP_UI))
    except Exception:
        return None
    pattern = re.compile(text_pattern, re.IGNORECASE)
    results = []
    for node in tree.iter('node'):
        t = (node.get('text') or '').strip()
        d = (node.get('content-desc') or '').strip()
        if node.get('clickable') == 'true' and (pattern.search(t) or pattern.search(d)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                results.append(((x1 + x2) // 2, (y1 + y2) // 2, t or d))
    if not results:
        return None
    if prefer_lowest:
        results.sort(key=lambda x: -x[1])
    return (results[0][0], results[0][1])


def tap(x, y, wait=3):
    adb(["shell", "input", "tap", str(x), str(y)])
    time.sleep(wait)


def cap(name, expect_app=True):
    global counter
    fname = f"{counter:02d}-{name}.png"
    out = DEST / fname

    if expect_app:
        # Verify app in foreground; if not, retry once
        if not ensure_app():
            print(f"  ! {fname} — app not foreground, skipping")
            return False

    r = subprocess.run(["adb", "-s", DEVICE, "exec-out", "screencap", "-p"],
                       capture_output=True, timeout=15)
    if r.returncode == 0 and r.stdout:
        out.write_bytes(r.stdout)
        sz = out.stat().st_size // 1024
        act = get_current_activity()
        in_app = PKG in act
        marker = "✓" if in_app else "✗ (NOT in app!)"
        print(f"  {fname} ({sz} KB) {marker}")
        counter += 1
        return in_app
    print(f"  {fname} FAILED")
    return False


def reset_to_home():
    """Fresh launch from scratch."""
    adb(["shell", "am", "force-stop", PKG])
    adb(["shell", "pm", "clear", PKG])
    time.sleep(2)
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(8)


def main():
    print("=== Robust Ronda capture ===")
    print(f"Output: {DEST}")
    print()
    reset_to_home()

    print(f"Activity: {get_current_activity()[:100]}")

    # Skip welcome+onboarding: tap French then 4×Suivant then Commencer
    dump_ui()
    coord = find_clickable(r"Fran(ç|c)ais|French")
    if coord:
        print(f"  Tap French at {coord}")
        tap(*coord, wait=4)

    # Advance through onboarding using UI-dump driven taps
    for i in range(4):
        dump_ui()
        # Last slide has "Commencer" not Suivant
        coord = find_clickable(r"Commencer|Get Started") or find_clickable(r"Suivant|^Next$")
        if not coord:
            break
        print(f"  Tap next at {coord}")
        tap(*coord, wait=4)

    # Now at LOGIN screen — capture
    if not cap("login-real"):
        print("  Login capture failed, re-launching...")
        reset_to_home()
        return

    # Find Guest button — must be inside Ronda
    dump_ui()
    # Try many patterns
    coord = (find_clickable(r"Mode invité|Continuer.*invit|invité|Guest")
             or find_clickable(r"Demo|demo@"))
    if coord:
        print(f"  Tap Guest at {coord}")
        tap(*coord, wait=6)
        cap("home-after-guest")
    else:
        # Try demo creds login by filling email + password
        print("  No Guest button found, trying default credentials...")
        # Find login button
        login_btn = find_clickable(r"Login|Se connecter|تسجيل")
        if login_btn:
            tap(*login_btn, wait=6)
            cap("home-via-login")

    # Cycle through tabs
    dump_ui()
    for tab_label in ["Jouer", "Classement", "Profil", "Map", "Carte"]:
        coord = find_clickable(rf"^{tab_label}")
        if coord:
            print(f"  Tap tab '{tab_label}' at {coord}")
            tap(*coord, wait=3)
            cap(f"tab-{tab_label.lower()}")
            dump_ui()

    # Open Rules (likely from header chip or button on home)
    dump_ui()
    coord = find_clickable(r"Règles|Rules")
    if coord:
        tap(*coord, wait=3)
        cap("rules")
        # Try variant chips
        dump_ui()
        variant_chips_text = ["Chkobba", "Escoba", "Classique", "Ronda 50"]
        for v in variant_chips_text:
            chip = find_clickable(rf"^{v}")
            if chip:
                tap(*chip, wait=2)
                cap(f"rules-{v.lower().replace(' ','-')}")
        adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
        time.sleep(2)

    # Action buttons on home
    for action_pattern, action_name in [
        (r"Créer|Create",         "create-game"),
        (r"Rejoindre|Join",       "join-game"),
        (r"Bot|IA",               "game-vs-bot"),
        (r"Défi|Challenge|Daily", "daily-challenge"),
    ]:
        dump_ui()
        coord = find_clickable(action_pattern)
        if coord:
            print(f"  Tap action '{action_name}' at {coord}")
            tap(*coord, wait=6)
            cap(action_name)
            # If game started, capture a couple more
            time.sleep(2)
            cap(f"{action_name}-state2")
            # Back
            adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
            time.sleep(2)
            adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
            time.sleep(2)
            ensure_app()

    # Shop modal
    dump_ui()
    coord = find_clickable(r"shop|boutique|wallet|coin")
    if not coord:
        # Try header-right (settings icon area)
        # Find rightmost clickable in top 200px
        try:
            tree = ET.parse(str(TMP_UI))
            top_btns = []
            for node in tree.iter('node'):
                if node.get('clickable') == 'true':
                    m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
                    if m:
                        x1, y1, x2, y2 = map(int, m.groups())
                        if y1 < 200 and x1 > 400:  # right side of top
                            top_btns.append(((x1+x2)//2, (y1+y2)//2))
            if top_btns:
                top_btns.sort(key=lambda x: -x[0])
                coord = top_btns[0]
        except Exception:
            pass
    if coord:
        tap(*coord, wait=3)
        cap("shop-or-settings")

    print(f"\n=== DONE — captured {counter-6} new shots ===")
    print(f"Saved to {DEST}")


if __name__ == "__main__":
    main()
