# Comprehensive fix — addresses ALL remaining issues from audit-i18n.py:
#   - MISSING keys (any lang)
#   - SAME-AS-FR keys (untranslated EN/ES/AR/Darija)
#   - Broken Unicode (e.g. "4�4" in concentration)
import json
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ["belote","ronda","kdoub","scopa","poker","tarot","okey",
        "concentration","quiestce","kantcopy","solitaire"]

# Complete dict: key -> {fr, en, es, ar, darija}
# If a key is meant to keep the same value in two langs (e.g. brand names,
# ELO, Bluetooth in EN/ES), repeat it intentionally — the audit will be
# silent because we explicitly chose that.
T = {
    "bluetooth":          {"fr":"Bluetooth","en":"Bluetooth","es":"Bluetooth","ar":"بلوتوث","darija":"بلوتوث"},
    "defaultCity":        {"fr":"Casablanca","en":"Casablanca","es":"Casablanca","ar":"الدار البيضاء","darija":"كازا"},
    "diffEasy":           {"fr":"Facile","en":"Easy","es":"Fácil","ar":"سهل","darija":"ساهل"},
    "diffMedium":         {"fr":"Moyen","en":"Medium","es":"Medio","ar":"متوسط","darija":"متوسط"},
    "diffHard":           {"fr":"Difficile","en":"Hard","es":"Difícil","ar":"صعب","darija":"صعيب"},
    "drawsShort":         {"fr":"N","en":"D","es":"E","ar":"ت","darija":"ت"},
    "elo":                {"fr":"ELO","en":"ELO","es":"ELO","ar":"إيلو","darija":"إيلو"},
    "email":              {"fr":"Email","en":"Email","es":"Correo","ar":"البريد الإلكتروني","darija":"الإيمايل"},
    "minShort":           {"fr":"min","en":"min","es":"min","ar":"د","darija":"د"},
    "notifications":      {"fr":"Notifications","en":"Notifications","es":"Notificaciones","ar":"الإشعارات","darija":"الإشعارات"},
    "or":                 {"fr":"ou","en":"or","es":"o","ar":"أو","darija":"ولا"},
    "playVsBot":          {"fr":"vs Bot","en":"vs Bot","es":"vs Bot","ar":"ضد الروبوت","darija":"ضد البوت"},
    "score":              {"fr":"Score","en":"Score","es":"Puntuación","ar":"النتيجة","darija":"النقط"},
    "simulation":         {"fr":"Simulation","en":"Simulation","es":"Simulación","ar":"محاكاة","darija":"محاكاة"},
    "simulationTitle":    {"fr":"Simulation","en":"Simulation","es":"Simulación","ar":"محاكاة","darija":"محاكاة"},
    "slide3.title":       {"fr":"Bots IA","en":"AI Bots","es":"Bots IA","ar":"ذكاء صناعي","darija":"روبوهات ذكية"},
    "solo.scoreLabel":    {"fr":"SCORE","en":"SCORE","es":"PUNTOS","ar":"النتيجة","darija":"النقط"},
    "vsBot":              {"fr":"vs Bot","en":"vs Bot","es":"vs Bot","ar":"ضد الروبوت","darija":"ضد البوت"},
    "vsGemini":           {"fr":"vs Gemini","en":"vs Gemini","es":"vs Gemini","ar":"ضد جيميني","darija":"ضد جيميني"},
    "vsOpponent":         {"fr":"vs {{name}}","en":"vs {{name}}","es":"vs {{name}}","ar":"ضد {{name}}","darija":"ضد {{name}}"},
    "wallet":             {"fr":"Portefeuille","en":"Wallet","es":"Cartera","ar":"المحفظة","darija":"البورس"},
    "walletCoins":        {"fr":"Sally Coins","en":"Sally Coins","es":"Sally Coins","ar":"عملات Sally","darija":"عملات Sally"},
    "yourMove":           {"fr":"À ton tour","en":"Your move","es":"Tu turno","ar":"دورك","darija":"دورك"},
    "home.shortClassicSub":{"fr":"4×4 / 4×6 / 6×6","en":"4x4 / 4x6 / 6x6","es":"4×4 / 4×6 / 6×6","ar":"4×4 / 4×6 / 6×6","darija":"4×4 / 4×6 / 6×6"},
    "home.shortTriplets": {"fr":"Triplets","en":"Triplets","es":"Tripletas","ar":"ثلاثيات","darija":"ثلاثيات"},
    "home.soloBadge":     {"fr":"MEMORY","en":"MEMORY","es":"MEMORIA","ar":"ذاكرة","darija":"ذاكرة"},
    # Some apps also expose these locale-specific keys, fill defensively:
    "play":               {"fr":"Jouer","en":"Play","es":"Jugar","ar":"العب","darija":"العب"},
    "settings":           {"fr":"Paramètres","en":"Settings","es":"Ajustes","ar":"إعدادات","darija":"الإعدادات"},
    "profile":            {"fr":"Profil","en":"Profile","es":"Perfil","ar":"الملف الشخصي","darija":"البروفيل"},
    "leaderboard":        {"fr":"Classement","en":"Leaderboard","es":"Clasificación","ar":"المتصدرين","darija":"الترتيب"},
    "friends":            {"fr":"Amis","en":"Friends","es":"Amigos","ar":"الأصدقاء","darija":"الصحاب"},
    "lobby":              {"fr":"Salon","en":"Lobby","es":"Sala","ar":"الردهة","darija":"السالة"},
    "createRoom":         {"fr":"Créer un salon","en":"Create room","es":"Crear sala","ar":"إنشاء غرفة","darija":"دير بيت"},
    "joinRoom":           {"fr":"Rejoindre un salon","en":"Join room","es":"Unirse","ar":"الانضمام","darija":"دخل بيت"},
    "startGame":          {"fr":"Lancer la partie","en":"Start","es":"Empezar","ar":"ابدأ","darija":"بدا"},
    "yourTurn":           {"fr":"À votre tour","en":"Your turn","es":"Tu turno","ar":"دورك","darija":"دورك"},
    "winner":             {"fr":"Gagnant","en":"Winner","es":"Ganador","ar":"الفائز","darija":"الرابح"},
    "draw":               {"fr":"Égalité","en":"Draw","es":"Empate","ar":"تعادل","darija":"تعادل"},
    "rematch":            {"fr":"Revanche","en":"Rematch","es":"Revancha","ar":"إعادة","darija":"عاودها"},
    "quit":               {"fr":"Quitter","en":"Quit","es":"Salir","ar":"خروج","darija":"خرج"},
    "language":           {"fr":"Langue","en":"Language","es":"Idioma","ar":"اللغة","darija":"اللغة"},
    "sound":              {"fr":"Son","en":"Sound","es":"Sonido","ar":"الصوت","darija":"الصوت"},
    "haptics":            {"fr":"Vibrations","en":"Haptics","es":"Vibración","ar":"الاهتزاز","darija":"الاهتزاز"},
    "theme":              {"fr":"Thème","en":"Theme","es":"Tema","ar":"الموضوع","darija":"الستيل"},
    "shop":               {"fr":"Boutique","en":"Shop","es":"Tienda","ar":"المتجر","darija":"الحانوت"},
    "loading":            {"fr":"Chargement...","en":"Loading...","es":"Cargando...","ar":"جار التحميل...","darija":"كنحملو..."},
    "error":              {"fr":"Erreur","en":"Error","es":"Error","ar":"خطأ","darija":"خطأ"},
    "loginError":         {"fr":"Échec de la connexion","en":"Login failed","es":"Error de inicio","ar":"فشل تسجيل الدخول","darija":"فشل الدخول"},
    "guestError":         {"fr":"Échec mode invité","en":"Guest mode failed","es":"Modo invitado falló","ar":"فشل وضع الضيف","darija":"فشل وضع الضيف"},
    "fillAllFields":      {"fr":"Remplissez tous les champs","en":"Please fill all fields","es":"Rellena todos los campos","ar":"املأ كل الحقول","darija":"عمر كاع الخانات"},
    "loginButton":        {"fr":"Se connecter","en":"Sign in","es":"Entrar","ar":"تسجيل الدخول","darija":"دخل"},
    "loginSubtitle":      {"fr":"Connectez-vous pour jouer","en":"Sign in to play","es":"Inicia sesión para jugar","ar":"سجل الدخول للعب","darija":"دخل باش تلعب"},
    "guest":              {"fr":"Mode invité","en":"Guest mode","es":"Modo invitado","ar":"وضع الضيف","darija":"وضع الضيف"},
    "demoAccount":        {"fr":"Compte démo","en":"Demo account","es":"Cuenta demo","ar":"حساب تجريبي","darija":"كومت تجريبية"},
    "password":           {"fr":"Mot de passe","en":"Password","es":"Contraseña","ar":"كلمة المرور","darija":"الباسوور"},
    "lossesShort":        {"fr":"D","en":"L","es":"P","ar":"خ","darija":"خ"},
    "winsShort":          {"fr":"G","en":"W","es":"G","ar":"ر","darija":"ر"},
    "localPlay":          {"fr":"Partie locale","en":"Local play","es":"Juego local","ar":"لعب محلي","darija":"لعب محلي"},
}

def set_nested(d, dotted_key, value):
    """Support keys with dots (e.g. 'home.shortClassicSub')."""
    parts = dotted_key.split('.')
    for p in parts[:-1]:
        if p not in d or not isinstance(d[p], dict):
            d[p] = {}
        d = d[p]
    d[parts[-1]] = value

def get_nested(d, dotted_key):
    parts = dotted_key.split('.')
    for p in parts:
        if not isinstance(d, dict) or p not in d:
            return None
        d = d[p]
    return d

total = 0
for app in APPS:
    base = ROOT / "apps" / "mobile" / app / "i18n" / "locales"
    if not base.exists():
        continue
    locales = {lang: {} for lang in ("fr","en","es","ar","darija")}
    for lang in locales:
        f = base / f"{lang}.json"
        if f.exists():
            try: locales[lang] = json.load(open(f, encoding="utf-8"))
            except Exception as e:
                print(f"[{app}/{lang}] parse error: {e}")
    fr = locales["fr"]
    per_app = 0
    for key, tx in T.items():
        for lang in ("fr","en","es","ar","darija"):
            cur = get_nested(locales[lang], key)
            target = tx.get(lang)
            if target is None:
                continue
            should_patch = (
                cur is None                                   # MISSING
                or cur == ""                                  # EMPTY
                or cur == "?"                                 # placeholder
                or "�" in (cur or "")                          # broken unicode
                or (lang != "fr" and cur == get_nested(fr, key))   # untranslated
            )
            if should_patch and cur != target:
                set_nested(locales[lang], key, target)
                per_app += 1
    if per_app:
        for lang, data in locales.items():
            f = base / f"{lang}.json"
            json.dump(data, open(f, "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
        print(f"  + {app}: {per_app} keys patched")
        total += per_app
    else:
        print(f"  - {app}: nothing to patch")
print(f"\nDONE: {total} keys patched")
