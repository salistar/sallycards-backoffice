# Add `guestDisplayName` key to all 11 apps + 5 langs.
# Pretty label shown wherever user.username starts with "Guest_" so the user
# doesn't see ugly machine IDs like "Guest_f7070657".
import json
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ["belote","ronda","kdoub","scopa","poker","tarot","okey",
        "concentration","quiestce","kantcopy","solitaire"]

TX = {
    "fr":     "Invité",
    "en":     "Guest",
    "es":     "Invitado",
    "ar":     "ضيف",
    "darija": "ضيف",
}

count = 0
for app in APPS:
    for lang in ("fr", "en", "es", "ar", "darija"):
        p = ROOT / "apps" / "mobile" / app / "i18n" / "locales" / f"{lang}.json"
        if not p.exists(): continue
        d = json.load(open(p, encoding="utf-8"))
        if d.get("guestDisplayName") != TX[lang]:
            d["guestDisplayName"] = TX[lang]
            json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            count += 1

print(f"+ added guestDisplayName to {count} locale files")
