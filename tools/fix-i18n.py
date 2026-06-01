# Fix les vraies traductions manquantes (untranslated EN/ES/Darija)
# dans les 11 apps mobiles. Idempotent: ne touche pas une valeur deja traduite.
import json
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ["belote","ronda","kdoub","scopa","poker","tarot","okey",
        "concentration","quiestce","kantcopy","solitaire"]

# Mapping: key -> {en, es, ar, darija}  (only set when value == fr)
TRANSLATIONS = {
    "diffEasy":       {"en":"Easy",    "es":"Fácil",   "ar":"سهل",      "darija":"ساهل"},
    "diffMedium":     {"en":"Medium",  "es":"Medio",   "ar":"متوسط",     "darija":"متوسط"},
    "diffHard":       {"en":"Hard",    "es":"Difícil", "ar":"صعب",      "darija":"صعيب"},
    "localPlay":      {"en":"Local play","es":"Juego local","ar":"لعب محلي","darija":"لعب محلي"},
    "lossesShort":    {"en":"L",       "es":"P",       "ar":"خ",        "darija":"خ"},
    "winsShort":      {"en":"W",       "es":"G",       "ar":"ر",        "darija":"ر"},
    "drawsShort":     {"en":"D",       "es":"E",       "ar":"ت",        "darija":"ت"},
    "defaultCity":    {"en":"Casablanca","es":"Casablanca","ar":"الدار البيضاء","darija":"كازا"},
    "elo":            {"en":"ELO",     "es":"ELO",     "ar":"إيلو",     "darija":"إيلو"},
    "bluetooth":      {"en":"Bluetooth","es":"Bluetooth","ar":"بلوتوث","darija":"بلوتوث"},
    "email":          {"en":"Email",   "es":"Correo",  "ar":"البريد",   "darija":"إيمايل"},
    "yourMove":       {"en":"Your move","es":"Tu turno","ar":"دورك",   "darija":"دورك"},
    "loading":        {"en":"Loading...","es":"Cargando...","ar":"جار التحميل...","darija":"كنحملو..."},
    "loginError":     {"en":"Login failed","es":"Error de inicio","ar":"فشل تسجيل الدخول","darija":"فشل الدخول"},
    "guestError":     {"en":"Guest mode failed","es":"Modo invitado falló","ar":"فشل وضع الضيف","darija":"فشل وضع الضيف"},
    "error":          {"en":"Error",   "es":"Error",   "ar":"خطأ",     "darija":"خطأ"},
    "fillAllFields":  {"en":"Please fill all fields","es":"Rellena todos los campos","ar":"املأ كل الحقول","darija":"عمر كاع الخانات"},
    "loginButton":    {"en":"Sign in", "es":"Entrar",  "ar":"تسجيل الدخول","darija":"دخل"},
    "loginSubtitle":  {"en":"Sign in to play","es":"Inicia sesión para jugar","ar":"سجل الدخول للعب","darija":"دخل باش تلعب"},
    "guest":          {"en":"Guest mode","es":"Modo invitado","ar":"وضع الضيف","darija":"وضع الضيف"},
    "demoAccount":    {"en":"Demo account","es":"Cuenta demo","ar":"حساب تجريبي","darija":"كومت تجريبية"},
    "password":       {"en":"Password","es":"Contraseña","ar":"كلمة المرور","darija":"الباسوور"},
    "play":           {"en":"Play",    "es":"Jugar",   "ar":"العب",    "darija":"العب"},
    "settings":       {"en":"Settings","es":"Ajustes", "ar":"إعدادات",   "darija":"الإعدادات"},
    "profile":        {"en":"Profile", "es":"Perfil",  "ar":"الملف الشخصي","darija":"البروفيل"},
    "leaderboard":    {"en":"Leaderboard","es":"Clasificación","ar":"المتصدرين","darija":"الترتيب"},
    "friends":        {"en":"Friends", "es":"Amigos",  "ar":"الأصدقاء", "darija":"الصحاب"},
    "lobby":          {"en":"Lobby",   "es":"Sala",    "ar":"الردهة",  "darija":"السالة"},
    "createRoom":     {"en":"Create room","es":"Crear sala","ar":"إنشاء غرفة","darija":"دير بيت"},
    "joinRoom":       {"en":"Join room","es":"Unirse","ar":"الانضمام","darija":"دخل بيت"},
    "startGame":      {"en":"Start",   "es":"Empezar", "ar":"ابدأ",    "darija":"بدا"},
    "yourTurn":       {"en":"Your turn","es":"Tu turno","ar":"دورك",   "darija":"دورك"},
    "score":          {"en":"Score",   "es":"Puntuación","ar":"النتيجة","darija":"النقط"},
    "winner":         {"en":"Winner",  "es":"Ganador", "ar":"الفائز",  "darija":"الرابح"},
    "draw":           {"en":"Draw",    "es":"Empate",  "ar":"تعادل",   "darija":"تعادل"},
    "rematch":        {"en":"Rematch", "es":"Revancha","ar":"إعادة",   "darija":"عاودها"},
    "quit":           {"en":"Quit",    "es":"Salir",   "ar":"خروج",    "darija":"خرج"},
    "language":       {"en":"Language","es":"Idioma",  "ar":"اللغة",   "darija":"اللغة"},
    "sound":          {"en":"Sound",   "es":"Sonido",  "ar":"الصوت",   "darija":"الصوت"},
    "haptics":        {"en":"Haptics", "es":"Vibración","ar":"الاهتزاز","darija":"الاهتزاز"},
    "theme":          {"en":"Theme",   "es":"Tema",    "ar":"الموضوع", "darija":"الستيل"},
    "shop":           {"en":"Shop",    "es":"Tienda",  "ar":"المتجر",  "darija":"الحانوت"},
    "wallet":         {"en":"Wallet",  "es":"Cartera", "ar":"المحفظة", "darija":"البورس"},
    "minShort":       {"en":"min",     "es":"min",     "ar":"د",       "darija":"د"},
}

patched = 0
for app in APPS:
    base = ROOT / "apps" / "mobile" / app / "i18n" / "locales"
    if not base.exists():
        continue
    fr_path = base / "fr.json"
    if not fr_path.exists():
        continue
    fr = json.load(open(fr_path, encoding="utf-8"))
    for lang in ("en", "es", "ar", "darija"):
        path = base / f"{lang}.json"
        if not path.exists():
            continue
        data = json.load(open(path, encoding="utf-8"))
        changed = 0
        for key, tx in TRANSLATIONS.items():
            if lang not in tx:
                continue
            if key in data and data[key] == fr.get(key):
                # same as FR -> probably untranslated, replace
                data[key] = tx[lang]
                changed += 1
            elif key not in data:
                data[key] = tx[lang]
                changed += 1
        if changed:
            json.dump(data, open(path, "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
            print(f"  + {app}/{lang}.json: {changed} keys patched")
            patched += changed
print(f"\nDONE: {patched} keys total patched across all apps")
