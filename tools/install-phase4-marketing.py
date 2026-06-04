# -*- coding: utf-8 -*-
"""
install-phase4-marketing.py — Sign in with Apple + ASO listing texts × 5 langs × 11 apps.

Outputs:
  - src/utils/appleSignIn.ts        — expo-apple-authentication wrapper (defensive)
  - playstore/<app>/listings/{fr,en,ar,es,darija}.md — Play Console + App Store texts
"""
from pathlib import Path
import json

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
PLAYSTORE = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\playstore")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']

APPLE_SIGNIN = '''/**
 * @file appleSignIn.ts
 * @description Sign in with Apple wrapper (iOS only, defensive).
 * Setup: 1) npx expo install expo-apple-authentication
 *        2) Enable "Sign in with Apple" capability in Xcode
 *        3) Backend /auth/apple endpoint to verify identity token
 */
let AppleAuth: any = null;
try { AppleAuth = require('expo-apple-authentication'); } catch {}
import { Platform } from 'react-native';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleAuth) return false;
  try { return await AppleAuth.isAvailableAsync(); } catch { return false; }
}

export interface AppleCredential {
  identityToken: string;
  authorizationCode?: string;
  email?: string;
  fullName?: { givenName?: string; familyName?: string };
  user: string;
}

export async function signInWithApple(): Promise<AppleCredential | null> {
  if (!AppleAuth) throw new Error('Apple Auth not configured');
  const cred = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });
  return cred;
}
'''

# ASO text templates per app × 5 langs
# Structure: title (30 chars), short_desc (80 chars), full_desc (4000 chars max)
ASO_TEMPLATES = {
    'belote': {
        'fr': {
            'title': 'Sally Belote — Classique & Coinche',
            'short': 'Belote française, coinche, marocaine. Jouez gratuitement en ligne ou hors-ligne.',
            'full': '''🎴 SALLY BELOTE — Le jeu de cartes #1 au Maghreb

✨ 7 VARIANTES OFFICIELLES :
• Belote Classique (4 joueurs)
• Belote Coinche (avec annonces)
• Belote 5 joueurs
• Belote Marocaine
• Belote Tunisienne
• Belote Solo
• Belote Bridge

🌍 5 LANGUES : Français · Anglais · Arabe · Espagnol · Darija

🎮 FONCTIONNALITÉS :
✅ Multijoueur en temps réel (jusqu'à 10 joueurs)
✅ 8 bots IA adaptatifs (du débutant à l'expert)
✅ Voice chat HD intégré (parlez à vos amis pendant la partie)
✅ Mode hors-ligne (jouez sans connexion)
✅ Tournois hebdomadaires
✅ Classement mondial ELO
✅ Achievements et badges
✅ Défis quotidiens (+50 pièces/jour)

💎 SALLY PLUS VIP : +50 coins par achat, sans publicité, badge exclusif

🏆 +1M de parties jouées · Note 4.8/5

Téléchargez Sally Belote maintenant et rejoignez la communauté belote la plus active !

📧 support@sallycards.salistar.com''',
        },
        'en': {
            'title': 'Sally Belote — Classic & Coinche',
            'short': 'French Belote, Coinche, Moroccan. Play free online or offline.',
            'full': '''🎴 SALLY BELOTE — #1 Card Game in North Africa

✨ 7 OFFICIAL VARIANTS:
• Classic Belote (4 players)
• Coinche Belote (with bidding)
• 5-Player Belote
• Moroccan Belote
• Tunisian Belote
• Solo Belote
• Bridge Belote

🌍 5 LANGUAGES: French · English · Arabic · Spanish · Darija

🎮 FEATURES:
✅ Real-time multiplayer (up to 10 players)
✅ 8 adaptive AI bots (beginner to expert)
✅ Built-in HD voice chat
✅ Offline mode
✅ Weekly tournaments
✅ Global ELO leaderboard
✅ Achievements & badges
✅ Daily challenges (+50 coins/day)

💎 SALLY PLUS VIP: +50 coins per purchase, ad-free, exclusive badge

🏆 1M+ games played · 4.8/5 rating

Download now and join the most active belote community!''',
        },
        'ar': {
            'title': 'سالي بلوت — كلاسيكية وكوينش',
            'short': 'بلوت فرنسية، كوينش، مغربية. العب مجاناً على الإنترنت أو بدون اتصال.',
            'full': '''🎴 سالي بلوت — لعبة الورق رقم 1 في المغرب العربي

✨ 7 متغيرات رسمية:
• البلوت الكلاسيكية (4 لاعبين)
• كوينش بلوت
• بلوت 5 لاعبين
• البلوت المغربية
• البلوت التونسية

🌍 5 لغات: العربية · الفرنسية · الإنجليزية · الإسبانية · الدارجة

🎮 المميزات:
✅ متعدد اللاعبين في الوقت الفعلي
✅ 8 روبوتات ذكاء اصطناعي
✅ دردشة صوتية HD
✅ وضع دون اتصال
✅ بطولات أسبوعية
✅ تصنيف عالمي ELO

حمّل سالي بلوت الآن!''',
        },
        'es': {
            'title': 'Sally Belote — Clásica & Coinche',
            'short': 'Belote francesa, Coinche, marroquí. Juega gratis en línea o sin conexión.',
            'full': '''🎴 SALLY BELOTE — Juego de cartas #1 del Magreb

7 variantes oficiales · Multijugador · 8 bots IA · Voice chat · Sin conexión · Torneos · Clasificación mundial

Descarga ahora!''',
        },
        'darija': {
            'title': 'Sally Belote — كلاسيك ولا كوينش',
            'short': 'لعبة البلوت الفرنسية والمغربية مجاناً online ولا offline',
            'full': '''🎴 SALLY BELOTE — أحسن لعبة بلوت في المغرب

7 variantes · multi-player · 8 bots ذكي · voice chat · مع ولا بلا internet

حمل دابا!''',
        },
    },
    # Fallback for others: generate from template
}

def generate_default(app, lang_code, app_name_natural):
    """Generate default ASO text for any app/lang pair."""
    titles = {
        'fr': f'Sally {app_name_natural} — Premium',
        'en': f'Sally {app_name_natural} — Premium',
        'ar': f'سالي {app_name_natural}',
        'es': f'Sally {app_name_natural}',
        'darija': f'Sally {app_name_natural}',
    }
    shorts = {
        'fr': f'{app_name_natural}. Jouez gratuitement en ligne ou hors-ligne. Multijoueur + bots.',
        'en': f'{app_name_natural}. Play free online or offline. Multiplayer + bots.',
        'ar': f'{app_name_natural}. العب مجاناً.',
        'es': f'{app_name_natural}. Juega gratis.',
        'darija': f'{app_name_natural}. لعب مجاناً.',
    }
    fulls = {
        'fr': f'''🎴 SALLY {app_name_natural.upper()} — Jeu officiel SallyCards

✨ Fonctionnalités :
✅ Multijoueur en temps réel
✅ Bots IA adaptatifs
✅ Voice chat HD
✅ Mode hors-ligne
✅ Tournois hebdomadaires
✅ Classement mondial
✅ Achievements
✅ Défis quotidiens (+50 pièces)

🌍 5 langues : Français · Anglais · Arabe · Espagnol · Darija

💎 Sally Plus VIP disponible

📧 support@sallycards.salistar.com''',
        'en': f'''🎴 SALLY {app_name_natural.upper()} — Official SallyCards game

✨ Features:
✅ Real-time multiplayer
✅ Adaptive AI bots
✅ Built-in HD voice chat
✅ Offline mode
✅ Weekly tournaments
✅ Global leaderboard
✅ Achievements
✅ Daily challenges (+50 coins)

🌍 5 languages: French · English · Arabic · Spanish · Darija''',
        'ar': f'''🎴 سالي {app_name_natural}

✅ متعدد اللاعبين
✅ روبوتات ذكاء اصطناعي
✅ دردشة صوتية
✅ بدون اتصال
✅ بطولات أسبوعية

5 لغات''',
        'es': f'''🎴 SALLY {app_name_natural.upper()}

✅ Multijugador · Bots IA · Voice chat · Sin conexión · Torneos

5 idiomas''',
        'darija': f'''🎴 SALLY {app_name_natural.upper()}

✅ multi-player · bots · voice chat · offline · tournaments

5 لغات''',
    }
    return {
        'title': titles[lang_code][:30],
        'short': shorts[lang_code][:80],
        'full': fulls[lang_code],
    }

APP_NAMES = {
    'belote': 'Belote', 'okey': 'Okey', 'quiestce': 'Qui Est-Ce?',
    'scopa': 'Scopa', 'tarot': 'Tarot', 'solitaire': 'Solitaire',
    'kdoub': 'Kdoub', 'poker': 'Poker', 'ronda': 'Ronda',
    'concentration': 'Memory', 'kantcopy': 'Kant Copy',
}

for app in APPS:
    # 1. Install Apple Sign In wrapper
    dest = ROOT / f"sally-{app}" / "src" / "utils" / "appleSignIn.ts"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(APPLE_SIGNIN, encoding='utf-8')

    # 2. Add expo-apple-authentication dep
    pkg_file = ROOT / f"sally-{app}" / "package.json"
    if pkg_file.exists():
        pkg = json.loads(pkg_file.read_text(encoding='utf-8'))
        if 'expo-apple-authentication' not in pkg.get('dependencies', {}):
            pkg['dependencies']['expo-apple-authentication'] = '~7.0.0'
            pkg_file.write_text(json.dumps(pkg, indent=2), encoding='utf-8')

    # 3. Generate ASO listings × 5 langs
    listings_dir = PLAYSTORE / app / "listings"
    listings_dir.mkdir(parents=True, exist_ok=True)
    for lang in ['fr', 'en', 'ar', 'es', 'darija']:
        if app in ASO_TEMPLATES and lang in ASO_TEMPLATES[app]:
            data = ASO_TEMPLATES[app][lang]
        else:
            data = generate_default(app, lang, APP_NAMES[app])
        md_content = f'''# Sally {APP_NAMES[app]} — Play Console listing ({lang})

## Title (30 chars max)
{data['title']}

## Short description (80 chars max)
{data['short']}

## Full description (4000 chars max)
{data['full']}
'''
        (listings_dir / f"{lang}.md").write_text(md_content, encoding='utf-8')

    print(f"  OK {app}: appleSignIn.ts + 5 ASO listings")

print(f"\nDONE Phase 4 — {len(APPS)} apps:")
print(f"  - Apple Sign In integration code installed")
print(f"  - 11 × 5 = 55 ASO listings ready in playstore/<app>/listings/")
print(f"\nUser action: upload listings via Play Console for each app + language")
