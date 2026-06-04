# -*- coding: utf-8 -*-
"""Smart screenshot tool — uses UI dump to find real button coords."""
import subprocess
import time
import xml.etree.ElementTree as ET
import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DEVICE = "R83L20HWJTE"
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
TMP_UI = Path(r"C:\Users\21266\AppData\Local\Temp\ui-current.xml")


def adb(args, capture=True):
    cmd = ["adb", "-s", DEVICE] + args
    try:
        if capture:
            return subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return subprocess.run(cmd, timeout=30)
    except Exception as e:
        print(f"  adb error: {e}")
        return None


def dump_ui():
    adb(["shell", "uiautomator", "dump", "/sdcard/Download/ui.xml"])
    adb(["pull", "/sdcard/Download/ui.xml", str(TMP_UI)])


def find_clickable(text_match):
    """Return (cx, cy) of first clickable node whose text/desc matches `text_match` regex."""
    if not TMP_UI.exists():
        return None
    try:
        tree = ET.parse(str(TMP_UI))
    except Exception:
        return None
    pattern = re.compile(text_match, re.IGNORECASE)
    for node in tree.iter('node'):
        text = (node.get('text') or '').strip()
        desc = (node.get('content-desc') or '').strip()
        if node.get('clickable') == 'true' and (pattern.search(text) or pattern.search(desc)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                return ((x1 + x2) // 2, (y1 + y2) // 2)
    return None


def tap(x, y):
    adb(["shell", "input", "tap", str(x), str(y)])


def back():
    adb(["shell", "input", "keyevent", "KEYCODE_BACK"])


def screencap(app, name):
    out = ROOT / "playstore" / app / "screenshots" / "v6" / f"{name}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["adb", "-s", DEVICE, "exec-out", "screencap", "-p"],
        capture_output=True, timeout=15
    )
    if r.returncode == 0 and r.stdout:
        out.write_bytes(r.stdout)
        sz = out.stat().st_size // 1024
        print(f"  {name}.png ({sz} KB)")
        return out
    print(f"  {name}.png FAILED")
    return None


def force_launch(app):
    pkg = f"com.sallycards.{app}"
    adb(["shell", "am", "force-stop", pkg])
    time.sleep(1)
    adb(["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(6)


def main(app):
    pkg = f"com.sallycards.{app}"
    print(f"\n=== {app} ===")
    force_launch(app)

    # 1. Welcome lang picker
    screencap(app, "01-welcome-lang")

    # Find + tap French
    dump_ui()
    coord = find_clickable(r"Fran|French")
    if coord:
        print(f"  Tap French at {coord}")
        tap(*coord)
        time.sleep(3)
    else:
        print("  ! French button not found, fallback tap 360,878")
        tap(360, 878)
        time.sleep(3)

    # 2. Onboarding slide 1
    screencap(app, "02-onboarding-slide1")

    # Find + tap "Suivant" / "Next" / "Commencer" (last slide button)
    for slide_idx in range(4):  # advance up to 4 slides
        dump_ui()
        # Last slide uses "Commencer" / "Get Started"
        coord = find_clickable(r"Commencer|Get Started|ابدأ|Comenzar")
        if coord:
            tap(*coord)
            time.sleep(4)
            break
        coord = find_clickable(r"Suivant|^Next$|التالي|Siguiente")
        if coord:
            tap(*coord)
            time.sleep(2)
        else:
            break

    # 3. Login screen
    screencap(app, "03-login")

    # Find + tap "Continuer comme invité" / "Guest" — many variants
    dump_ui()
    coord = find_clickable(r"invité|invite|guest|ضيف|Continuar como")
    if coord:
        print(f"  Tap Guest at {coord}")
        tap(*coord)
        time.sleep(5)
    else:
        print("  ! Guest button not found, try 360,1180")
        tap(360, 1180)
        time.sleep(5)

    # 4. Home (after guest login)
    screencap(app, "04-home")

    # Try to navigate to Rules via menu
    dump_ui()
    coord = find_clickable(r"règles|rules|قواعد")
    if coord:
        print(f"  Tap Rules at {coord}")
        tap(*coord)
        time.sleep(3)
        screencap(app, "05-rules")
        back()
        time.sleep(2)
    else:
        # Try going to a tab — leaderboard usually has trophy
        dump_ui()
        coord = find_clickable(r"classement|leaderboard|trophy|trophée")
        if coord:
            tap(*coord)
            time.sleep(3)
            screencap(app, "05-leaderboard")
            back()
            time.sleep(2)

    # 5. Game table via vs Bot
    dump_ui()
    coord = find_clickable(r"Bot|IA|robot")
    if coord:
        print(f"  Tap vs Bot at {coord}")
        tap(*coord)
        time.sleep(7)
        screencap(app, "06-game-table")
        # In case of dialog, capture and back
        time.sleep(2)
        screencap(app, "07-gameplay")
        back()
        time.sleep(2)
        back()
        time.sleep(2)

    # 6. Shop modal (look for shop/coin/boutique)
    dump_ui()
    coord = find_clickable(r"shop|boutique|coin|monnaie")
    if coord:
        print(f"  Tap Shop at {coord}")
        tap(*coord)
        time.sleep(4)
        screencap(app, "08-shop")
        # Scroll down to see VIP block
        adb(["shell", "input", "swipe", "360", "1000", "360", "300", "500"])
        time.sleep(2)
        screencap(app, "09-shop-vip")
        back()


if __name__ == "__main__":
    apps = sys.argv[1:] if len(sys.argv) > 1 else ['belote', 'okey', 'quiestce', 'scopa', 'tarot']
    for app in apps:
        main(app)
