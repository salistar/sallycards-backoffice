# -*- coding: utf-8 -*-
"""Comprehensive screenshot capture for Ronda — all reachable screens."""
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
ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
DEST_DESKTOP = Path(r"C:\Users\21266\Desktop\screenshots\ronda")
DEST_PLAYSTORE = ROOT / "playstore" / "ronda" / "screenshots" / "v6"
TMP_UI = Path(r"C:\Users\21266\AppData\Local\Temp\ui-ronda.xml")

DEST_DESKTOP.mkdir(parents=True, exist_ok=True)
DEST_PLAYSTORE.mkdir(parents=True, exist_ok=True)

counter = 0


def adb(args, capture=True, timeout=30):
    try:
        return subprocess.run(["adb", "-s", DEVICE] + args,
                              capture_output=capture, text=True, timeout=timeout)
    except Exception as e:
        print(f"  adb error: {e}")
        return None


def dump_ui():
    adb(["shell", "uiautomator", "dump", "/sdcard/Download/ui.xml"])
    adb(["pull", "/sdcard/Download/ui.xml", str(TMP_UI)])


def find_clickable(text_pattern):
    """Return (cx, cy) of first clickable node matching `text_pattern` regex."""
    if not TMP_UI.exists():
        return None
    try:
        tree = ET.parse(str(TMP_UI))
    except Exception:
        return None
    pattern = re.compile(text_pattern, re.IGNORECASE)
    for node in tree.iter('node'):
        text = (node.get('text') or '').strip()
        desc = (node.get('content-desc') or '').strip()
        if node.get('clickable') == 'true' and (pattern.search(text) or pattern.search(desc)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                return ((x1 + x2) // 2, (y1 + y2) // 2)
    return None


def find_clickable_all(text_pattern):
    """Return list of (cx, cy, text) of all clickable nodes matching."""
    if not TMP_UI.exists():
        return []
    try:
        tree = ET.parse(str(TMP_UI))
    except Exception:
        return []
    pattern = re.compile(text_pattern, re.IGNORECASE)
    results = []
    for node in tree.iter('node'):
        text = (node.get('text') or '').strip()
        desc = (node.get('content-desc') or '').strip()
        if node.get('clickable') == 'true' and (pattern.search(text) or pattern.search(desc)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                results.append(((x1 + x2) // 2, (y1 + y2) // 2, text or desc))
    return results


def tap(x, y):
    adb(["shell", "input", "tap", str(x), str(y)])


def back():
    adb(["shell", "input", "keyevent", "KEYCODE_BACK"])


def swipe(x1, y1, x2, y2, duration=500):
    adb(["shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)])


def cap(name):
    global counter
    counter += 1
    fname = f"{counter:02d}-{name}.png"
    r = subprocess.run(
        ["adb", "-s", DEVICE, "exec-out", "screencap", "-p"],
        capture_output=True, timeout=15
    )
    if r.returncode == 0 and r.stdout:
        for dest in (DEST_PLAYSTORE, DEST_DESKTOP):
            (dest / fname).write_bytes(r.stdout)
        sz = (DEST_PLAYSTORE / fname).stat().st_size // 1024
        print(f"  {fname} ({sz} KB)")
    else:
        print(f"  {fname} FAILED")


def launch_fresh():
    adb(["shell", "am", "force-stop", PKG])
    adb(["shell", "pm", "clear", PKG])  # WIPE state for clean onboarding flow
    time.sleep(1)
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(6)


def main():
    print(f"=== Comprehensive Ronda screenshot capture ===")
    print(f"Output: {DEST_DESKTOP}")
    print()

    launch_fresh()
    cap("welcome-lang-picker")

    # Tap French
    dump_ui()
    coord = find_clickable(r"Fran(ç|c)ais|French")
    if coord:
        print(f"  → tap Français at {coord}")
        tap(*coord)
        time.sleep(3)
    cap("onboarding-slide1")

    # Navigate through all 4 slides
    for i in range(3):
        dump_ui()
        coord = find_clickable(r"Suivant|^Next$") or find_clickable(r"Commencer|Get Started")
        if not coord:
            break
        tap(*coord)
        time.sleep(2)
        cap(f"onboarding-slide{i+2}")

    # Click Commencer/Get Started on last slide
    dump_ui()
    coord = find_clickable(r"Commencer|Get Started|Ouvrir|Suivant|^Next$")
    if coord:
        tap(*coord)
        time.sleep(3)
    cap("login-screen")

    # Try Guest button (look for various texts + button positions)
    dump_ui()
    coord = (find_clickable(r"invit[ée]|guest|jouer sans|Continuer en")
             or find_clickable(r"Demo|demo@"))
    if not coord:
        # Find buttons at the bottom of screen
        all_buttons = find_clickable_all(r"^[A-ZÀ-Üa-zà-ü].*")
        # Pick lowest button (highest y)
        if all_buttons:
            all_buttons.sort(key=lambda x: -x[1])
            for cx, cy, txt in all_buttons[:5]:
                print(f"    button candidate: '{txt}' @ ({cx},{cy})")
            coord = (all_buttons[0][0], all_buttons[0][1])
    if coord:
        print(f"  → tap Guest at {coord}")
        tap(*coord)
        time.sleep(6)
    cap("home")

    # Snap each tab in (tabs)
    dump_ui()
    tabs = find_clickable_all(r"Classement|Leaderboard|Map|Carte|Profil|Profile|Jouer|Play")
    for cx, cy, txt in tabs:
        print(f"  → tap tab '{txt}' at ({cx},{cy})")
        tap(cx, cy)
        time.sleep(3)
        cap(f"tab-{txt.lower().replace(' ', '-')[:20]}")

    # Go back to home tab
    coord = find_clickable(r"Jouer|Play")
    if coord:
        tap(*coord)
        time.sleep(2)

    # Try opening Rules (if accessible from header or button)
    dump_ui()
    coord = find_clickable(r"Règles|Rules|قواعد")
    if coord:
        print(f"  → tap Rules")
        tap(*coord)
        time.sleep(3)
        cap("rules")
        # Try switching variants
        dump_ui()
        variant_chips = find_clickable_all(r"Chkobba|Escoba|Classique|Ronda")
        for i, (cx, cy, txt) in enumerate(variant_chips[:3]):
            tap(cx, cy)
            time.sleep(2)
            cap(f"rules-variant-{txt.lower().replace(' ','-')[:15]}")
        back()
        time.sleep(2)

    # Open Shop (look for shop/wallet icon)
    dump_ui()
    coord = find_clickable(r"shop|boutique|coin|wallet")
    if not coord:
        # Tap header right (settings/shop area) — common at ~640, 100 for 720w device
        tap(640, 100)
        time.sleep(2)
    cap("settings-or-shop-modal")

    # Look for shop link
    dump_ui()
    coord = find_clickable(r"shop|boutique|coin")
    if coord:
        tap(*coord)
        time.sleep(3)
        cap("shop")
        # Scroll to see VIP block at bottom
        swipe(360, 1200, 360, 400, 600)
        time.sleep(2)
        cap("shop-vip-bottom")
        back()
        time.sleep(2)
    back()
    time.sleep(2)

    # Now Try Create Game flow
    dump_ui()
    coord = find_clickable(r"Cr[ée]er|Create")
    if coord:
        print(f"  → Create game")
        tap(*coord)
        time.sleep(4)
        cap("create-game")
        back()
        time.sleep(2)

    # Join game flow
    dump_ui()
    coord = find_clickable(r"Rejoindre|Join")
    if coord:
        print(f"  → Join game")
        tap(*coord)
        time.sleep(4)
        cap("join-game")
        back()
        time.sleep(2)

    # Daily challenge
    dump_ui()
    coord = find_clickable(r"D[ée]fi|Challenge|Daily")
    if coord:
        print(f"  → Daily challenge")
        tap(*coord)
        time.sleep(6)
        cap("daily-challenge")
        # Game might start — capture
        time.sleep(3)
        cap("daily-game-table")
        back()
        time.sleep(2)
        back()
        time.sleep(2)

    # vs Bot game
    dump_ui()
    coord = find_clickable(r"Bot|IA|robot|vs")
    if coord:
        print(f"  → vs Bot")
        tap(*coord)
        time.sleep(7)
        cap("game-table-bot")
        # Capture multiple gameplay moments
        time.sleep(3)
        cap("game-table-mid")
        # Try tapping a card
        swipe(360, 1200, 360, 700, 400)
        time.sleep(2)
        cap("game-action")

    print(f"\n=== DONE — {counter} screenshots captured ===")
    print(f"Saved to: {DEST_DESKTOP}")


if __name__ == "__main__":
    main()
