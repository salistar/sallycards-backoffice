# -*- coding: utf-8 -*-
"""
Deep screenshot capture — iterates through every clickable on the home screen.
Better than capture-app-full.py for apps with non-standard button labels.
Usage: python capture-app-deep.py <app-slug>
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
    print("Usage: capture-app-deep.py <app-slug>")
    sys.exit(1)

APP = sys.argv[1]
DEVICE = "R83L20HWJTE"
PKG = f"com.sallycards.{APP}"
DEST = Path(rf"C:\Users\21266\Desktop\screenshots\{APP}")
TMP_UI = Path(rf"C:\Users\21266\AppData\Local\Temp\ui-{APP}-deep.xml")
DEST.mkdir(parents=True, exist_ok=True)

# Clear old screenshots before deep recapture
for f in DEST.glob("*.png"):
    f.unlink()

counter = 1


def adb(args):
    try:
        return subprocess.run(["adb", "-s", DEVICE] + args,
                              capture_output=True, text=True, timeout=30)
    except Exception:
        return None


def get_act():
    r = adb(["shell", "dumpsys", "activity", "activities"])
    if r and r.stdout:
        for line in r.stdout.split('\n'):
            if 'topResumedActivity' in line or 'mResumedActivity' in line:
                return line.strip()[:120]
    return ""


def in_app():
    return PKG in (get_act() or "")


def relaunch():
    adb(["shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(6)


def ensure():
    if in_app(): return True
    relaunch()
    return in_app()


def dump():
    adb(["shell", "uiautomator", "dump", "/sdcard/Download/ui.xml"])
    adb(["pull", "/sdcard/Download/ui.xml", str(TMP_UI)])


def find(text_pattern, prefer="first"):
    if not TMP_UI.exists(): return None
    try: tree = ET.parse(str(TMP_UI))
    except: return None
    pat = re.compile(text_pattern, re.IGNORECASE)
    results = []
    for n in tree.iter('node'):
        t = (n.get('text') or '').strip()
        d = (n.get('content-desc') or '').strip()
        if n.get('clickable') == 'true' and (pat.search(t) or pat.search(d)):
            m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', n.get('bounds', ''))
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                results.append(((x1+x2)//2, (y1+y2)//2, t or d))
    if not results: return None
    if prefer == "lowest":
        results.sort(key=lambda x: -x[1])
    return results[0][:2]


def find_all_clickable_in_area(min_y, max_y, min_x=0, max_x=720):
    """Return list of (cx, cy, text) for all clickables in screen area."""
    if not TMP_UI.exists(): return []
    try: tree = ET.parse(str(TMP_UI))
    except: return []
    seen = set()
    results = []
    for n in tree.iter('node'):
        t = (n.get('text') or '').strip()
        d = (n.get('content-desc') or '').strip()
        if n.get('clickable') != 'true': continue
        label = (t or d).strip()
        if not label or len(label) > 80: continue
        if label.lower() in ('options supplémentairesbouton', 'plus d\'options'): continue
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', n.get('bounds', ''))
        if not m: continue
        x1, y1, x2, y2 = map(int, m.groups())
        cx, cy = (x1+x2)//2, (y1+y2)//2
        if not (min_y <= cy <= max_y and min_x <= cx <= max_x): continue
        key = (cx//50, cy//50)
        if key in seen: continue
        seen.add(key)
        results.append((cx, cy, label[:40]))
    return results


def tap(x, y, wait=3):
    adb(["shell", "input", "tap", str(x), str(y)])
    time.sleep(wait)


def back():
    adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
    time.sleep(2)


def cap(name, expect_app=True):
    global counter
    fname = f"{counter:02d}-{name}.png"
    out = DEST / fname
    if expect_app and not ensure():
        print(f"  ! {fname} skipped (app not foreground)")
        return False
    r = subprocess.run(["adb", "-s", DEVICE, "exec-out", "screencap", "-p"],
                       capture_output=True, timeout=15)
    if r.returncode == 0 and r.stdout:
        out.write_bytes(r.stdout)
        sz = out.stat().st_size // 1024
        mark = "✓" if in_app() else "✗"
        print(f"  {fname} ({sz} KB) {mark}")
        counter += 1
        return True
    return False


def reset():
    adb(["shell", "am", "force-stop", PKG])
    adb(["shell", "pm", "clear", PKG])
    time.sleep(2)
    relaunch()


def main():
    print(f"=== Deep capture {APP} ===")
    print(f"Output: {DEST}\n")
    reset()
    cap("welcome-lang", expect_app=False)

    # French
    dump()
    coord = find(r"Fran(ç|c)ais|French")
    if coord: tap(*coord, wait=4)

    # Onboarding
    for i in range(4):
        cap(f"onboarding-slide{i+1}")
        dump()
        coord = find(r"Commencer|Get Started|Démarrer") or find(r"Suivant|^Next$|التالي")
        if not coord: break
        tap(*coord, wait=4)

    cap("login")

    # Guest
    dump()
    coord = find(r"Mode invité|Continuer.*invit|invité|Guest|^Demo|demo@")
    if coord:
        tap(*coord, wait=6)
        cap("home")
    else:
        print("  ! No Guest button found, screen may not be login")
        return

    # ============ TABS (bottom navigation) ============
    # On 720x1600, tabs are usually y=1500-1550
    dump()
    bottom_tabs = find_all_clickable_in_area(min_y=1400, max_y=1600)
    print(f"\n  Bottom tabs found: {len(bottom_tabs)}")
    for cx, cy, label in bottom_tabs:
        print(f"  → Tap tab '{label}' at ({cx},{cy})")
        tap(cx, cy, wait=4)
        cap(f"tab-{label.lower().replace(' ', '-')[:20]}")

    # Back to "Play" tab
    dump()
    play_tab = find(r"Jouer|^Play")
    if play_tab: tap(*play_tab, wait=3)

    # ============ HEADER ICONS (top right) ============
    # y=0..200 area, x>500 typically (settings/shop/theme/lang)
    dump()
    header_btns = find_all_clickable_in_area(min_y=50, max_y=250, min_x=400, max_x=720)
    print(f"\n  Header buttons found: {len(header_btns)}")
    for cx, cy, label in header_btns[:5]:
        print(f"  → Tap header '{label}' at ({cx},{cy})")
        tap(cx, cy, wait=3)
        cap(f"header-{label.lower().replace(' ', '-')[:20]}")
        back()
        ensure()

    # ============ ACTION BUTTONS (middle of home) ============
    # y=300..1300 area on home tab
    dump()
    # First go to Play tab again
    play_tab = find(r"Jouer|^Play")
    if play_tab: tap(*play_tab, wait=3)
    dump()
    actions = find_all_clickable_in_area(min_y=300, max_y=1300)
    # Filter out tabs/headers (re-extract from middle area only)
    print(f"\n  Action buttons found: {len(actions)}")
    for cx, cy, label in actions[:8]:
        print(f"  → Tap action '{label}' at ({cx},{cy})")
        tap(cx, cy, wait=6)
        cap(f"action-{label.lower().replace(' ', '-')[:25]}")
        # Capture second state (game might still be loading)
        time.sleep(3)
        if in_app():
            cap(f"action-{label.lower().replace(' ', '-')[:25]}-state2")
        back()
        time.sleep(1)
        back()
        ensure()
        dump()
        # Re-go to Play
        play_tab = find(r"Jouer|^Play")
        if play_tab: tap(*play_tab, wait=2)
        dump()

    print(f"\n=== {APP} DONE: {counter-1} screenshots ===")
    print(f"Saved to: {DEST}")


if __name__ == "__main__":
    main()
