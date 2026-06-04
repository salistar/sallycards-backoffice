# -*- coding: utf-8 -*-
"""Propage metro.config.js (durci anti-crash watcher) aux 11 apps en
substituant le slug dans la regex d'exclusion."""
import os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "apps", "mobile", "ronda", "metro.config.js")
APPS_DIR = os.path.join(ROOT, "apps", "mobile")
TARGETS = ["kdoub", "belote", "tarot", "scopa", "okey", "quiestce",
           "poker", "concentration", "kantcopy", "solitaire"]

base = open(SRC, encoding="utf-8").read()

for app in TARGETS:
    dst = os.path.join(APPS_DIR, app, "metro.config.js")
    if not os.path.isfile(dst):
        print(app, "skip (no metro.config.js)")
        continue
    # substitute the "ronda" sentinel in the blockList exception regex
    new = base.replace("(?!ronda\\/)", f"(?!{app}\\/)")
    open(dst, "w", encoding="utf-8", newline="\n").write(new)
    print(app, "OK")
