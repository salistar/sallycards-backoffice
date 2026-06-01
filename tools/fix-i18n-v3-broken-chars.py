# Fix all broken-unicode replacement characters (U+FFFD = "�") across all locale files.
# Replaces "TriPeaks � combo" -> "TriPeaks · combo", "4�4" -> "4×4", etc.
# Also auto-replaces standalone � with a context-appropriate character.
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ["belote","ronda","kdoub","scopa","poker","tarot","okey",
        "concentration","quiestce","kantcopy","solitaire"]
LANGS = ["fr","en","es","ar","darija"]

# Heuristic replacement: "4�4" → "4×4", "TriPeaks � combo" → "TriPeaks · combo", "1�2" → "1×2"
REPL = "�"  # Unicode REPLACEMENT CHARACTER

def clean(value: str) -> str:
    if not isinstance(value, str): return value
    if REPL not in value: return value
    # digit + REPL + digit -> digit × digit
    value = re.sub(r"(\d)" + REPL + r"(\d)", r"\1×\2", value)
    # " REPL " -> " · "
    value = value.replace(" " + REPL + " ", " · ")
    # any remaining -> middle dot
    value = value.replace(REPL, "·")
    return value

def walk(obj):
    if isinstance(obj, dict):
        changed = False
        for k, v in obj.items():
            if isinstance(v, str):
                new = clean(v)
                if new != v:
                    obj[k] = new
                    changed = True
            else:
                if walk(v): changed = True
        return changed
    elif isinstance(obj, list):
        changed = False
        for i, v in enumerate(obj):
            if isinstance(v, str):
                new = clean(v)
                if new != v:
                    obj[i] = new
                    changed = True
            else:
                if walk(v): changed = True
        return changed
    return False

total_fixed = 0
for app in APPS:
    base = ROOT / "apps" / "mobile" / app / "i18n" / "locales"
    if not base.exists():
        continue
    app_fixed = 0
    for lang in LANGS:
        path = base / f"{lang}.json"
        if not path.exists(): continue
        data = json.load(open(path, encoding="utf-8"))
        if walk(data):
            json.dump(data, open(path, "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
            app_fixed += 1
    if app_fixed:
        print(f"  + {app}: {app_fixed} lang files cleaned")
        total_fixed += app_fixed
print(f"\nDONE: {total_fixed} files cleaned of broken-unicode chars")
