# Audit i18n: for each app, find keys whose translation is missing/empty/equals key
# in any of the 5 locale files.
import json, os
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ["belote","ronda","kdoub","scopa","poker","tarot","okey",
        "concentration","quiestce","kantcopy","solitaire"]
LANGS = ["fr","en","ar","es","darija"]

def flatten(prefix, d, out):
    if isinstance(d, dict):
        for k, v in d.items():
            flatten(f"{prefix}.{k}" if prefix else k, v, out)
    else:
        out[prefix] = str(d)

problems_total = 0
for app in APPS:
    d = ROOT / "apps" / "mobile" / app / "i18n" / "locales"
    if not d.exists():
        continue
    locales = {}
    for lang in LANGS:
        f = d / f"{lang}.json"
        if f.exists():
            try:
                locales[lang] = json.load(open(f, encoding="utf-8"))
            except Exception as e:
                print(f"[{app}/{lang}] PARSE ERROR: {e}")
                continue
        else:
            locales[lang] = {}
    # Flatten all
    flat = {lang: {} for lang in locales}
    for lang, data in locales.items():
        flatten("", data, flat[lang])
    # All keys union (from FR as canonical, then add any from others)
    all_keys = set(flat.get("fr", {}).keys())
    for lang, data in flat.items():
        all_keys.update(data.keys())
    # Check each key per lang
    issues = []
    for key in sorted(all_keys):
        for lang in LANGS:
            v = flat.get(lang, {}).get(key)
            if v is None:
                issues.append((key, lang, "MISSING"))
            elif v == "":
                issues.append((key, lang, "EMPTY"))
            elif v == key:
                issues.append((key, lang, "= KEY"))
            elif lang != "fr" and v == flat.get("fr", {}).get(key):
                # same as French — likely untranslated
                issues.append((key, lang, "SAME AS FR"))
    if issues:
        # group by key (lang list) to give canonical list of untranslated keys
        by_key = {}
        for (k, lang, kind) in issues:
            by_key.setdefault(k, []).append((lang, kind))
        print(f"\n[{app}] {len(issues)} issues over {len(by_key)} distinct keys:")
        for k in sorted(by_key):
            langs = ','.join(f"{l}:{kind}" for l, kind in by_key[k])
            fr_val = flat.get('fr', {}).get(k, '?')
            # truncate fr value to 60 chars
            if len(fr_val) > 60: fr_val = fr_val[:57] + '...'
            print(f"   {k:40} FR=\"{fr_val}\"  ({langs})")
    else:
        print(f"[{app}] OK")
    problems_total += len(issues)

print(f"\n=== TOTAL: {problems_total} translation issues across 11 apps ===")
