# -*- coding: utf-8 -*-
"""
Reusable comprehensive screenshot capture — works for any sally-* app.
Usage: python capture-app-full.py <app-slug>
"""
import subprocess
import time
import xml.etree.ElementTree as ET
import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

if len(sys.argv) < 2:
    print("Usage: capture-app-full.py <app-slug>")
    sys.exit(1)

APP = sys.argv[1]
DEVICE = "R83L20HWJTE"
PKG = f"com.sallycards.{APP}"
DEST = Path(rf"C:\Users\21266\Desktop\screenshots\{APP}")
TMP_UI = Path(rf"C:\Users\21266\AppData\Local\Temp\ui-{APP}.xml")
DEST.mkdir(parents=True, exist_ok=True)

# Clear old screenshots
for f in DEST.glob("*.png"):
    f.unlink()

counter = 1


def adb(args, capture=True):
    try:
        return subprocess.run(["adb", "-s", DEVICE] + args,
                              capture_output=capture, text=True, timeout=30)
    except Exception:
        return None


def get_current_activity():
    r = adb(["shell", "dumpsys", "activity", "activities"])
    if r and r.stdout:
        for line in r.stdout.split('\n'):
            if 'topResumedActivity' in line or 'mResumedActivity' in line:
                return line.strip()[:120]
    return "?"


def ensure_app():
    act = get_current_activity() or ""
    if PKG in act:
        return True
    print(f"  ! app not foreground, relaunching...")
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(6)
    return PKG in (get_current_activity() or "")


def dump_ui():
    adb(["shell", "uiautomator", "dump", "/sdcard/Download/ui.xml"])
    adb(["pull", "/sdcard/Download/ui.xml", str(TMP_UI)])


def find_clickable(text_pattern):
    if not TMP_UI.exists():
        return None
    try:
        tree = ET.parse(str(TMP_UI))
    except Exception:
        return None
    pattern = re.compile(text_pattern, re.IGNORECASE)
    for node in tree.iter('node'):
        t = (node.get('text') or '').strip()
        d = (node.get('content-desc') or '').strip()
        if node.get('clickable') == 'true' and (pattern.search(t) or pattern.search(d)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                return ((x1 + x2) // 2, (y1 + y2) // 2)
    return None


def tap(x, y, wait=3):
    adb(["shell", "input", "tap", str(x), str(y)])
    time.sleep(wait)


def cap(name, expect_app=True):
    global counter
    fname = f"{counter:02d}-{name}.png"
    out = DEST / fname
    if expect_app and not ensure_app():
        print(f"  ! {fname} skipped (app not foreground)")
        return False
    r = subprocess.run(["adb", "-s", DEVICE, "exec-out", "screencap", "-p"],
                       capture_output=True, timeout=15)
    if r.returncode == 0 and r.stdout:
        out.write_bytes(r.stdout)
        sz = out.stat().st_size // 1024
        in_app = PKG in (get_current_activity() or "")
        print(f"  {fname} ({sz} KB) {'✓' if in_app else '✗'}")
        counter += 1
        return in_app
    return False


def reset():
    adb(["shell", "am", "force-stop", PKG])
    adb(["shell", "pm", "clear", PKG])
    time.sleep(2)
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(8)


def main():
    print(f"=== Capturing {APP} ===")
    print(f"Output: {DEST}\n")

    reset()
    cap("welcome-lang", expect_app=False)

    # Tap French
    dump_ui()
    coord = find_clickable(r"Fran(ç|c)ais|French")
    if coord:
        print(f"  Tap French at {coord}")
        tap(*coord, wait=4)

    # Onboarding slides
    for i in range(4):
        cap(f"onboarding-slide{i+1}")
        dump_ui()
        coord = find_clickable(r"Commencer|Get Started|Démarrer") or find_clickable(r"Suivant|^Next$|التالي")
        if not coord:
            break
        print(f"  Tap next at {coord}")
        tap(*coord, wait=4)

    # Login screen
    cap("login")

    # Guest login
    dump_ui()
    coord = (find_clickable(r"Mode invité|Continuer.*invit|invité|Guest")
             or find_clickable(r"Demo|demo@"))
    if coord:
        print(f"  Tap Guest at {coord}")
        tap(*coord, wait=6)
        cap("home")

        # Tabs
        for tab in ["Classement", "Profil", "Map", "Carte"]:
            dump_ui()
            coord = find_clickable(rf"^{tab}")
            if coord:
                print(f"  Tap tab {tab}")
                tap(*coord, wait=3)
                cap(f"tab-{tab.lower()}")
        # Back to Jouer
        dump_ui()
        coord = find_clickable(r"^Jouer")
        if coord:
            tap(*coord, wait=2)

        # Action buttons
        for pat, name in [
            (r"^Créer|^Create",           "create-game"),
            (r"^Rejoindre|^Join",         "join-game"),
            (r"^vs Bot|^Bot|IA experte",  "vs-bot-game"),
            (r"^Défi du jour|Daily",      "daily-challenge"),
            (r"Simulation",               "simulation"),
        ]:
            dump_ui()
            coord = find_clickable(pat)
            if coord:
                print(f"  Tap action '{name}' at {coord}")
                tap(*coord, wait=7)
                cap(name)
                time.sleep(2)
                cap(f"{name}-state2")
                # back twice (game/modal → home)
                adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
                time.sleep(2)
                adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
                time.sleep(2)
                ensure_app()

        # Rules (typically opened via header or specific button)
        dump_ui()
        coord = find_clickable(r"Règles|Rules")
        if coord:
            tap(*coord, wait=3)
            cap("rules")
            adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
            time.sleep(2)

        # Shop
        dump_ui()
        coord = find_clickable(r"shop|boutique|coin|wallet|💰")
        if coord:
            tap(*coord, wait=4)
            cap("shop")
            # Scroll to see VIP block
            adb(["shell", "input", "swipe", "360", "1200", "360", "300", "600"])
            time.sleep(2)
            cap("shop-vip-scrolled")
            adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
            time.sleep(2)

        # Settings (header icon top-right)
        adb(["shell", "input", "tap", "640", "100"])
        time.sleep(3)
        cap("settings-or-overflow")

    print(f"\n=== {APP} DONE: {counter-1} screenshots ===")
    print(f"Saved to: {DEST}")


if __name__ == "__main__":
    main()
