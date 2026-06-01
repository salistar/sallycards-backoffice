# -*- coding: utf-8 -*-
"""
adb-capture-belote.py - Capture REAL screenshots of Belote Sally from the
connected Android device (com.sallycards.belote).

Output: C:\\Users\\21266\\Desktop\\screenshots\\belote\\NN-screen.png

Strategy
--------
1. Cold-start the app -> capture splash (sc 01)
2. Wait for the home screen, capture (sc 02)
3. Use `adb shell uiautomator dump` to read on-screen elements
4. For each labeled tab/button we want, find its center, tap it,
   wait a beat, capture, then back out as needed.

Per-screen behaviour is best-effort - if a button is not found we skip and
continue. Designed to NEVER crash; missing screens print a WARN and the
script moves on.
"""
import os, subprocess, time, re, sys, shutil
from pathlib import Path

PKG    = "com.sallycards.belote"
OUTDIR = Path(r"C:\Users\21266\Desktop\screenshots\belote")
OUTDIR.mkdir(parents=True, exist_ok=True)

# Disable MSYS path translation when this script is run from Git Bash
os.environ["MSYS_NO_PATHCONV"] = "1"

# ----- low-level helpers -----

def sh(*args, check=False, capture=True, timeout=30):
    """Run a subprocess command; return (rc, stdout)."""
    res = subprocess.run(args, capture_output=capture, text=True,
                         timeout=timeout, encoding="utf-8", errors="replace")
    if check and res.returncode != 0:
        raise RuntimeError(f"{' '.join(args)} -> rc={res.returncode}\n{res.stderr}")
    return res.returncode, (res.stdout or "") + (res.stderr or "")


def adb(*args, **kw):
    return sh("adb", *args, **kw)


def adb_shell(cmd, **kw):
    return sh("adb", "shell", cmd, **kw)


def screencap(name):
    """Capture, pull to OUTDIR/name, delete remote tmp."""
    remote = "/sdcard/__cap.png"
    adb_shell(f"screencap -p {remote}")
    out = OUTDIR / name
    adb("pull", remote, str(out))
    adb_shell(f"rm {remote}")
    if out.exists():
        size = out.stat().st_size
        print(f"  [OK] {name:38s}  {size//1024} KB")
    else:
        print(f"  [WARN] {name} - pull failed")
    return out


def tap(x, y, settle=1.5):
    adb_shell(f"input tap {int(x)} {int(y)}")
    time.sleep(settle)


def back(settle=1.0):
    adb_shell("input keyevent 4")
    time.sleep(settle)


def home():
    adb_shell("input keyevent 3")


def force_stop():
    adb_shell(f"am force-stop {PKG}")


def start():
    adb_shell(f"monkey -p {PKG} -c android.intent.category.LAUNCHER 1",
              capture=True, timeout=20)


# ----- UI inspection -----

def ui_dump():
    """Return the raw uiautomator XML for the current screen."""
    adb_shell("uiautomator dump /sdcard/window_dump.xml", timeout=20)
    rc, out = adb_shell("cat /sdcard/window_dump.xml", timeout=20)
    return out


def find_by_text(xml, *needles, ci=True):
    """Find first node whose text/content-desc contains any needle.
    Returns (cx, cy) screen center, or None.
    """
    if not xml:
        return None
    if ci:
        needles = [n.lower() for n in needles]
    # Find all node entries with bounds
    pattern = re.compile(
        r'<node[^/>]*?'
        r'(?:text="([^"]*)"|content-desc="([^"]*)")[^/>]*?'
        r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        re.DOTALL)
    # simpler: iterate all <node ...> lines
    for m in re.finditer(r'<node([^>]*)/?>', xml):
        attrs = m.group(1)
        # extract attributes
        text_m  = re.search(r'\btext="([^"]*)"', attrs)
        desc_m  = re.search(r'\bcontent-desc="([^"]*)"', attrs)
        bnds_m  = re.search(r'\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', attrs)
        if not bnds_m:
            continue
        labels = []
        if text_m:  labels.append(text_m.group(1))
        if desc_m:  labels.append(desc_m.group(1))
        if not labels:
            continue
        joined = " | ".join(labels)
        hay = joined.lower() if ci else joined
        if any(n in hay for n in needles):
            x1, y1, x2, y2 = map(int, bnds_m.groups())
            return ((x1 + x2) // 2, (y1 + y2) // 2)
    return None


def tap_text(xml, *needles, settle=1.6):
    """Find a node by text and tap its center. Returns True on success."""
    pt = find_by_text(xml, *needles)
    if pt is None:
        print(f"  [skip] no button matching {needles}")
        return False
    tap(pt[0], pt[1], settle=settle)
    return True


# ----- High-level capture script -----

def main():
    print(f"-> output: {OUTDIR}")
    print(f"-> package: {PKG}")
    print()

    # 0. clean slate
    force_stop()
    time.sleep(0.5)

    # 1. cold-start, splash
    start()
    time.sleep(1.0)
    screencap("01-splash.png")

    # 2. wait for home / welcome to render
    time.sleep(4.0)
    screencap("02-welcome.png")

    # 3. dump and look for common entry buttons
    xml = ui_dump()

    # Try: a "Continuer en invite" / "Continue as guest" / "Jouer" / "Play"
    for needles in (("continuer", "continue", "guest", "invit"),
                    ("jouer", "play", "start", "commencer"),
                    ("entrer", "enter")):
        if tap_text(xml, *needles, settle=3.0):
            screencap("03-home.png")
            break
    else:
        # Maybe already on home - capture anyway
        screencap("03-home.png")

    xml = ui_dump()

    # 4. Try multiplayer / lobby entry
    for needles in (("multi", "multijoueur", "online", "ligne", "salon", "room"),
                    ("ami", "friend", "duel", "match")):
        if tap_text(xml, *needles, settle=2.5):
            screencap("04-multiplayer-lobby.png")
            xml = ui_dump()
            break

    # 5. Try create / rejoindre
    for needles in (("crer", "creer", "create", "nouveau", "new room"),
                    ("code", "rejoindre", "join")):
        if tap_text(xml, *needles, settle=2.5):
            screencap("05-create-room.png")
            xml = ui_dump()
            break

    # back to home
    for _ in range(3):
        back()
    time.sleep(1.0)
    xml = ui_dump()

    # 6. Solo / vs IA
    for needles in (("solo", "ia", "ai", "ordinateur", "vs"),
                    ("rapide", "quick")):
        if tap_text(xml, *needles, settle=3.5):
            screencap("06-solo-game.png")
            xml = ui_dump()
            break

    # back
    for _ in range(2):
        back()
    time.sleep(1.0)
    xml = ui_dump()

    # 7. Leaderboard / classement
    for needles in (("classement", "leaderboard", "rank", "score top"),
                    ("trophe", "trophy")):
        if tap_text(xml, *needles, settle=2.0):
            screencap("07-leaderboard.png")
            back()
            time.sleep(1.0)
            xml = ui_dump()
            break

    # 8. Profile / Profil
    for needles in (("profil", "profile", "compte", "account", "moi"),):
        if tap_text(xml, *needles, settle=2.0):
            screencap("08-profile.png")
            back()
            time.sleep(1.0)
            xml = ui_dump()
            break

    # 9. Settings / paramtres
    for needles in (("param", "settings", "rglages", "reglages", "options"),):
        if tap_text(xml, *needles, settle=2.0):
            screencap("09-settings.png")
            back()
            time.sleep(1.0)
            xml = ui_dump()
            break

    # 10. Rules / Rgles
    for needles in (("rgles", "rules", "comment jouer", "how to play", "aide"),):
        if tap_text(xml, *needles, settle=2.0):
            screencap("10-rules.png")
            back()
            time.sleep(1.0)
            xml = ui_dump()
            break

    # 11. Shop / boutique
    for needles in (("boutique", "shop", "store", "coin", "pices"),):
        if tap_text(xml, *needles, settle=2.0):
            screencap("11-shop.png")
            back()
            time.sleep(1.0)
            xml = ui_dump()
            break

    # 12. Final home reset capture
    while True:
        rc, _ = adb_shell(f"dumpsys activity activities | grep -E 'topResumedActivity|mResumedActivity' | head -1")
        break
    for _ in range(3):
        back()
    time.sleep(1.0)
    screencap("12-home-final.png")

    print()
    print("Done. Files in", OUTDIR)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAborted by user")
        sys.exit(1)
