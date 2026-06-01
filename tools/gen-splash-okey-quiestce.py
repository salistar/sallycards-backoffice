"""Generate splash v5 for Okey + Quiestce, same style as Belote v5."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

# Import the helpers from the tarot-scopa generator
exec(open(Path(__file__).parent / 'gen-splash-tarot-scopa.py', encoding='utf-8').read().replace("for app in APPS:\n    make_splash(*app)", ""))

# Now we have make_splash + helpers in scope
APPS_NEW = [
    ('okey',     '#2A1A05', '#FCD34D', 'OKEY',         'Tiles · Sets · Runs'),
    ('quiestce', '#0A2A3A', '#FCD34D', 'QUI EST-CE?',  'Deduction · 1v1'),
]
for app in APPS_NEW:
    make_splash(*app)
print("DONE okey + quiestce")
