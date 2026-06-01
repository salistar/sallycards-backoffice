# -*- coding: utf-8 -*-
"""
gen-playstore.py - Generate Google Play Store submission packages for the
11 SallyCards mobile apps, mirroring playstore/sudoku/ EXCEPT screenshots.

Output: C:\\Users\\21266\\Desktop\\playstore\\<slug>\\
   README.md
   APK-vs-AAB.md
   apk/README.txt                (note + GitHub Release URL for latest APK)
   assets/icon-512.png           (resized from apps/mobile/<slug>/assets/icon.png)
   assets/feature-graphic-1024x500.png  (PIL gradient + app name)
   text/title.txt
   text/short-description.txt
   text/full-description.txt
   text/category.txt
   text/contact.txt
   text/privacy-policy-url.txt
   forms/content-rating-answers.md
   forms/data-safety-form.md
   forms/target-audience.md

NO screenshots/ subfolder - user said: "sauf screenshots, on le fera apres".
"""
import os, sys, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT      = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
MOBILE    = ROOT / "apps" / "mobile"
OUT_ROOT  = Path(r"C:\Users\21266\Desktop\playstore")

# ---------- Per-app data ----------
# slug, full_name, short_title (<=30 chars), short_desc (<=80 chars),
# gradient_from, gradient_to, category, family ("Cards" / "Board" / etc),
# rules_paragraph (used inside full description), multiplayer (bool)
APPS = [
    dict(
        slug="belote",
        name="Belote Sally",
        short_title="Belote Sally",
        short_desc="Classic Belote with real-time 4-player games, chat & video calls.",
        gradient_from=(20, 60, 50), gradient_to=(8, 28, 22),
        category="Games → Card",
        family="Cards",
        rules="Belote is the most popular trick-taking card game in France, Morocco and the Maghreb. Played 2v2 with the 32-card piquet deck, bid your trump, take tricks, count Belote/Rebelote (King + Queen of trump), capot, and 162-point rounds. Sally implements all standard rules: contree, surcontree, dix de der, last-trick bonus.",
        multiplayer=True,
        domain="belote",
    ),
    dict(
        slug="ronda",
        name="Ronda Sally",
        short_title="Ronda Sally",
        short_desc="Ronda Marocaine 2v2 - capture pairs, live duels with chat & calls.",
        gradient_from=(120, 28, 28), gradient_to=(38, 8, 8),
        category="Games → Card",
        family="Cards",
        rules="Ronda is the Moroccan classic - a fast 2v2 capture game using the 40-card Spanish deck. Match cards by rank to capture, chain Ronda (two same rank in your hand), Tringla (three), and the killer Mesa (sweep). Sally handles all variants: bonus for last capture, hidden vs open hand, custom point targets.",
        multiplayer=True,
        domain="ronda",
    ),
    dict(
        slug="kdoub",
        name="Kdoub Sally",
        short_title="Kdoub Sally",
        short_desc="Kdoub - the Moroccan whist - 4-player live with chat & video.",
        gradient_from=(50, 20, 90), gradient_to=(18, 8, 36),
        category="Games → Card",
        family="Cards",
        rules="Kdoub (or K’doub) is a Moroccan trick-taking card game in the whist family - 4 players, no partners, predict the exact number of tricks you'll win each round, bonuses for getting it right, penalties for missing. Sally enforces the call-and-take rules, scoring with positives, negatives, and the round-leader privilege.",
        multiplayer=True,
        domain="kdoub",
    ),
    dict(
        slug="scopa",
        name="Scopa Sally",
        short_title="Scopa Sally",
        short_desc="Italian Scopa & Scopone - capture cards live with friends.",
        gradient_from=(28, 90, 50), gradient_to=(6, 30, 16),
        category="Games → Card",
        family="Cards",
        rules="Scopa is Italy's beloved capture card game. Match table cards by value, chase the sweep (scopa), and at round end score on cards-taken, denari-taken, settebello (7 of coins), and primiera. Sally supports classic 1v1, 2v2 Scopone, and custom point targets.",
        multiplayer=True,
        domain="scopa",
    ),
    dict(
        slug="poker",
        name="Poker Sally",
        short_title="Poker Sally",
        short_desc="Texas Hold'em - live tables with chat, voice & video calls.",
        gradient_from=(20, 80, 40), gradient_to=(6, 22, 12),
        category="Games → Card",
        family="Cards",
        rules="Texas Hold'em No Limit - the gold standard of poker. Sally runs full-rules cash and tournament tables: blinds, antes, pre-flop / flop / turn / river, side pots, all-in protection, hand history. Play money only - this is a SOCIAL game, no real-money wagering.",
        multiplayer=True,
        domain="poker",
    ),
    dict(
        slug="tarot",
        name="Tarot Sally",
        short_title="Tarot Sally",
        short_desc="French Tarot 4 players - bids, oudlers, chiens & live calls.",
        gradient_from=(120, 32, 60), gradient_to=(40, 10, 24),
        category="Games → Card",
        family="Cards",
        rules="French Tarot - the king of trick-taking games. Played 4 (or 5) players with the 78-card tarot deck, full bidding (Petite, Garde, Garde Sans, Garde Contre), chien handling, oudlers (Petit, Excuse, 21), point cards, slam bonus. Sally implements official FFT rules end-to-end.",
        multiplayer=True,
        domain="tarot",
    ),
    dict(
        slug="okey",
        name="Okey Sally",
        short_title="Okey Sally",
        short_desc="Turkish Okey - live 4-player tiles, runs, sets, chat & calls.",
        gradient_from=(80, 36, 18), gradient_to=(26, 12, 6),
        category="Games → Board",
        family="Tiles",
        rules="Okey is Turkey's national tile game - 4 players, 106 numbered tiles, draw and discard to build runs and sets, racing to lock your hand with the bonus Okey tile. Sally implements joker handling, double-tile bonus, and the strict end-game declaration rules.",
        multiplayer=True,
        domain="okey",
    ),
    dict(
        slug="concentration",
        name="Memory Sally",
        short_title="Memory Sally",
        short_desc="Memory match - solo puzzles + 1v1 duels with chat & video.",
        gradient_from=(40, 60, 120), gradient_to=(10, 18, 40),
        category="Games → Puzzle",
        family="Memory",
        rules="The timeless memory card game (Concentration) - flip pairs and remember the board. Sally adds 6 grid sizes, themed decks, daily puzzles, AND a fully live 1v1 mode where both players see each other's flips in real-time.",
        multiplayer=True,
        domain="memory",
    ),
    dict(
        slug="quiestce",
        name="Who is it? Sally",
        short_title="Who is it? Sally",
        short_desc="Guess Who? live - 1v1 questions, chat, voice & video calls.",
        gradient_from=(20, 90, 110), gradient_to=(6, 26, 32),
        category="Games → Trivia",
        family="Guessing",
        rules="A modern take on the classic deduction game. Each player gets a secret character; ask yes/no questions through chat or voice to narrow down the opponent's identity. Sally bundles 8 character themes (animals, sports, history, anime, and more) plus custom decks.",
        multiplayer=True,
        domain="whois",
    ),
    dict(
        slug="kantcopy",
        name="Carbon Sally",
        short_title="Carbon Sally",
        short_desc="Spot the difference - solo + live 1v1 with chat & video.",
        gradient_from=(80, 40, 110), gradient_to=(22, 10, 32),
        category="Games → Puzzle",
        family="Spot the Difference",
        rules="Compare two near-identical images and tap every difference before the timer runs out. Sally ships 80+ original puzzle pairs in 6 themes, daily challenge, AND a 1v1 race mode where both players see the same pair and race to find the differences first.",
        multiplayer=True,
        domain="carbon",
    ),
    dict(
        slug="solitaire",
        name="Solitaire Sally",
        short_title="Solitaire Sally",
        short_desc="Klondike, Spider, FreeCell + daily challenges. Beautiful & free.",
        gradient_from=(20, 70, 120), gradient_to=(6, 22, 40),
        category="Games → Card",
        family="Solo cards",
        rules="The three most-loved solitaire variants in one app. Klondike (draw-1 and draw-3), Spider (1, 2, 4 suits), and FreeCell - all with unlimited undo, smart auto-move, hint system, daily seeded puzzles, and a global high-score leaderboard.",
        multiplayer=False,
        domain="solitaire",
    ),
]

# ---------- Templates ----------

README_TEMPLATE = """# Google Play Store submission pack - {name}

Everything you need to upload **{name}** to the Play Console, in one place.
This pack is generated from the SallyCards monorepo and mirrors the layout
used for Sudoku Sally.

```
playstore/{slug}/
├── README.md                       ← you are here (overview + checklist)
├── APK-vs-AAB.md                   ← full explainer: which one to upload where
├── apk/
│   └── README.txt                  ← where to download the latest signed APK
├── assets/
│   ├── icon-512.png                ← Play Store app icon (REQUIRED)
│   └── feature-graphic-1024x500.png ← marketing banner (REQUIRED)
├── text/
│   ├── title.txt                   ← "{short_title}"
│   ├── short-description.txt       ← <= 80 chars
│   ├── full-description.txt        ← <= 4 000 chars
│   ├── privacy-policy-url.txt
│   ├── category.txt                ← {category}
│   └── contact.txt                 ← Salistar Company contact info
└── forms/
    ├── content-rating-answers.md   ← IARC questionnaire
    ├── data-safety-form.md         ← Data safety form
    └── target-audience.md          ← Target audience & content
```

> Screenshots are **not** included here on purpose - they will be added
> manually after the first capture pass on a real device.

---

## Step-by-step Play Console submission

### 1. Pay the one-time developer fee
- https://play.google.com/console/signup
- **$25 one-time** (not annual). Use a credit card.
- Choose **Personal** account (faster) or **Organization** (publisher name
  becomes "Salistar Company" - needs a D-U-N-S number, ~3-5 days).

### 2. Create the app
- Play Console -> **Create app**
- Default language: **English (United States)**
- App name: paste `text/title.txt`
- App or game: **Game**
- Free or paid: **Free**
- Accept the declarations.

### 3. Set up the store listing
| Field | File to copy from |
|---|---|
| App name | `text/title.txt` |
| Short description | `text/short-description.txt` |
| Full description | `text/full-description.txt` |
| App icon | `assets/icon-512.png` |
| Feature graphic | `assets/feature-graphic-1024x500.png` |
| Phone screenshots | **TODO** - capture later on device, then drop here |
| Video (YouTube link) | optional, leave blank |

### 4. Fill the policy questionnaires
| Section in Play Console | File to follow |
|---|---|
| App content -> Privacy Policy | URL from `text/privacy-policy-url.txt` |
| App content -> App access | "All functionality is available without special access" |
| App content -> Ads | **No** ads |
| App content -> Content rating | answers in `forms/content-rating-answers.md` |
| App content -> Target audience & content | answers in `forms/target-audience.md` |
| App content -> News app | **No** |
| App content -> COVID-19 contact tracing | **No** |
| App content -> Data safety | answers in `forms/data-safety-form.md` |
| App content -> Government apps | **No** |
| App content -> Financial features | **No** |
| App content -> Health features | **No** |
| Store settings -> App category | `text/category.txt` |
| Store settings -> Contact details | `text/contact.txt` |

### 5. Upload the AAB (NOT the APK)
- Left menu -> **Release -> Production -> Create new release**
- App bundles -> **Upload** -> drop the `.aab` produced by EAS Build / CI
- The APK referenced in `apk/README.txt` is the **debug** artifact built by
  GitHub Actions for sideload only. For Play, build the signed **AAB** with:
  ```
  cd apps-deploy/sally-{slug}
  eas build -p android --profile production
  ```
  EAS will sign with your release keystore and emit a `.aab` you upload here.

### 6. Pre-launch checklist (Play does it automatically)
- Play installs the bundle on emulators and pings the main screens.
- Reports come back in ~30 min: crashes, security, accessibility, performance.

### 7. Submit for review
- **Production track** -> review takes **3-7 days** (first submission).
- Subsequent updates: usually **same-day to 24h**.

---

## Where the artifacts come from

This pack assumes the standard SallyCards pipeline:

- **Source**: `apps/mobile/{slug}/` in the monorepo.
- **Standalone deploy repo**: `apps-deploy/sally-{slug}/` (mirrored to
  `github.com/salistar/sally-{slug}`).
- **CI/CD**: `.github/workflows/android-build.yml` builds an unsigned debug
  APK on every push and publishes it to the GitHub Release tagged
  `latest`. URL: `https://github.com/salistar/sally-{slug}/releases/download/latest/app-debug.apk`.
- **Production AAB**: produced via `eas build -p android --profile production`
  in the deploy repo (uses your EAS account's release keystore).

See the project-level rapport PDFs on the desktop for the full architecture.

---

## After submission

- The day after publication, your app is searchable in the Play Store.
- Update `apps-deploy/sally-{slug}/utils/googleAuth.ts` if you enrolled in
  Play App Signing (add the new SHA-1 to the Android OAuth client).
- Update `https://sallycards.salistar.com/download` to add a "Get it on
  Google Play" badge alongside the direct APK link.

Good luck with the launch.
"""

APK_VS_AAB_TEMPLATE = """# APK vs AAB - which one to upload, and where

This document explains the difference between the two artifacts you'll
produce for **{name}**.

## TL;DR in 30 seconds

| | **APK** (.apk) | **AAB** (.aab) |
|---|---|---|
| Year introduced | 2008 (day 1 of Android) | 2018 |
| What it's for | Installing the app | **Generating** per-device APKs |
| Contains | EVERY resource (all langs, densities, ABIs) | An intermediate format Play splits per device |
| Can you double-click to install? | YES (sideload) | NO (Play Store only, or bundletool) |
| User download size | the full file (~55 MB) | **-30 to -50 %**: ~25-35 MB per user |
| Accepted on Play Store? | NO since Aug 2021 for new apps | YES (mandatory) |
| Accepted off-Play (sideload, sallycards.salistar.com/download) | YES | NO |
| Must be signed? | YES (local key) | YES at upload + Play re-signs with Play App Signing key |

**What to remember:**
- The **.aab** is **Play Store only**.
- The **.apk** is for **everything else**: direct download from the landing
  page, WhatsApp share, sideload, BlueStacks, etc.
- The CI in `apps-deploy/sally-{slug}` produces an **unsigned debug APK**
  attached to the GitHub Release tagged `latest`. That APK is great for
  sideload but NOT acceptable for Play.
- For Play, you build a **signed AAB** with EAS:
  ```
  cd apps-deploy/sally-{slug}
  eas build -p android --profile production
  ```

---

## Why Google invented the AAB

An APK contains **everything for everyone**:
- Images in `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` (5 screen densities)
- All supported languages (`en/`, `fr/`, `ar/`, etc.)
- All enabled CPU ABIs (`arm64-v8a`, `armeabi-v7a`, and - if not trimmed -
  `x86_64`, `x86`)

On an arm64 phone with `xxhdpi` configured in French, **80 % of the APK is
dead weight** - it downloads hdpi images it'll never show, Arabic text it'll
never read, x86 code it can't run.

AAB fixes that:

```
       +----------------------------------+
       |  You upload 1 .aab file          |
       |  (contains everything, like APK) |
       +----------------+-----------------+
                        |
                        v Google Play processes
       +----------------------------------+
       |  Play GENERATES per-device split |
       |  APKs:                           |
       |   * base.apk        (code & UI)  |
       |   * config.fr.apk   (French only)|
       |   * config.arm64-v8a.apk (cpu)   |
       |   * config.xxhdpi.apk (drawables)|
       +----------------+-----------------+
                        |
                        v Download
       The user only receives the splits
       that apply -> 25-35 MB instead of 55.
```

Totally transparent for the developer. You upload 1 `.aab`, Play handles
the rest.

---

## What does the {name} AAB contain?

Built by `eas build -p android --profile production` from the
`apps-deploy/sally-{slug}` repo:

- **JS bundle (Hermes)**: precompiled bytecode, embedded.
- **Native modules**:
  - libhermes.so, libreactnative.so
  - libreact-native-webrtc.so (~25 MB per ABI) - for live calls
  - libavif.so, libexpo-image-loader.so, etc.
- **Resources**: icon, splash, images, fonts for `en/fr/ar`.
- **Permissions**: CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, INTERNET,
  ACCESS_NETWORK_STATE, BLUETOOTH.
- **Signing key**: your EAS-managed release keystore (Play App Signing
  enabled).

-> A user on a Pixel 9 (arm64, xxxhdpi, English) gets ~30 MB. A Samsung
A05s (armeabi-v7a, xhdpi, French) gets ~28 MB.

---

## For sideload (direct download from sallycards.salistar.com)

You want the **APK**. AAB does not install directly. If a user opens it,
Android says "Package invalid".

-> The landing page
(`https://sallycards.salistar.com/download` -> `sally-{slug}` row) keeps
serving the APK that CI publishes. CI keeps producing an APK for GitHub
Releases. You don't touch any of that.

---

## Signing - important for Google Sign-In

When you upload the AAB on Play Console **for the first time**, Play
proposes enrolling in **Play App Signing**.

| | **With Play App Signing** (Google-recommended) | **Without** (legacy) |
|---|---|---|
| Who holds the final signing key | Google (HSM in their datacenter) | You |
| You sign with | An "upload key" (your release keystore) | Your real release key |
| If you lose your key | Google re-issues an upload key | App dead, start over |
| SHA-1 visible to Google APIs (Sign-In, etc.) | **The Play SHA-1, NOT your upload key's** | Your key's SHA-1 |
| Can be turned on later? | YES (but with friction) | Recommended to enable from v1 |

### Consequence for Google Sign-In

When you enable Play App Signing, Google generates a **new keypair** and
gives you a **new signing SHA-1**. Users installing via Play receive APKs
signed by that new key, **not** by your local keystore.

-> **You must add this new SHA-1 to your Android OAuth client** at
`https://console.cloud.google.com/apis/credentials`, otherwise Google
Sign-In fails with `DEVELOPER_ERROR (code 10)` for Play users.

**How to find this SHA-1:**
1. Play Console -> your app -> **Setup** (left menu) -> **App signing**
2. Section "App signing key certificate" -> copy the SHA-1
3. Google Cloud Console -> Credentials -> your Android client ->
   **Add a SHA-1 fingerprint** -> paste.

Both SHA-1 values (your local keystore + Play's) must be registered on the
Android OAuth client so Sign-In works on sideload **and** Play installs.

---

## TL;DR for your next action

| You want... | You use... |
|---|---|
| Test on your phone via `adb install` | `apk/` link (GitHub Release `latest`) |
| Share with a friend by WhatsApp / Telegram | same APK |
| Serve from https://sallycards.salistar.com/download | same APK (CI does it) |
| **Upload to Play Console** | the `.aab` from `eas build --profile production` |
| Test locally how Play splits the AAB | `bundletool build-apks --bundle=...aab --output=splits.apks` |

For Play, it's the AAB. For everything else, it's the APK.
"""

APK_README_TEMPLATE = """{name} - APK / AAB

CI builds an unsigned DEBUG apk on every push and attaches it to the
GitHub Release tagged `latest`:

    https://github.com/salistar/sally-{slug}/releases/download/latest/app-debug.apk

This is the file served by the SallyCards landing page:

    https://sallycards.salistar.com/download

For PLAY STORE you need a SIGNED AAB (NOT the debug apk above).
Produce it with EAS:

    cd apps-deploy/sally-{slug}
    eas build -p android --profile production

EAS will sign with the release keystore tied to your Expo account and
output a downloadable `.aab` - that's the file you upload in
Play Console -> Release -> Production -> Create new release.

See ../APK-vs-AAB.md for the full explainer.
"""

FULL_DESC_TEMPLATE_MULTIPLAYER = """{emoji} {name} - the modern, social {family_lower} game you'll actually keep open

{name} is a beautifully-designed {family_lower} game that goes way beyond the classic single-player experience. Play solo, join live tables, and - for the first time on Android - duel friends in REAL-TIME with chat, voice & video calls, and screen recording.

{rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ WHY {name_upper}?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• REAL-TIME LIVE GAMES - pick a friend, create a room with a 4-letter code, and play side-by-side. The board updates instantly for everyone, no refresh needed.

• AUDIO + VIDEO CALLS during a game - talk smack, celebrate together, or just keep each other company while you play. Built on WebRTC with our own TURN server, works on any network.

• IN-GAME CHAT - send messages without leaving the table.

• SCREEN RECORDING of your matches - capture your best moves and share them on TikTok, Instagram, or YouTube directly from the app.

• SOLO MODE with smart AI - practice anytime, no internet needed.

• GLOBAL LEADERBOARD - see how you rank against everyone, weekly and all-time.

• 3 LANGUAGES - English, Français, العربية (with full right-to-left layout).

• OFFLINE MODE - play the single-player content without any internet connection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F3AF FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Full official rules, fast & responsive
✓ Cross-play with the web version on sallycards.salistar.com
✓ Room codes - invite a friend in 5 seconds
✓ Cloud-saved profile - sign in with Google to play across devices
✓ Coin economy, achievements, daily missions
✓ Custom themes & avatars
✓ Beautiful dark UI with smooth animations
✓ No ads, no popup, no nonsense

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F512 PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We collect only what's needed to make the social features work:
• Your email (for account login)
• Your Google profile name + picture (only if you sign in with Google)
• Game stats (scores, wins, losses) for the leaderboard

We DO NOT sell your data, share it with advertisers, or track you across other apps. Read our full privacy policy at https://sallycards.salistar.com/legal/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F4EC CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions, feedback, bug reports? Email: salistarcompany@gmail.com
Web: https://sallycards.salistar.com

Made with ❤️ by Salistar Company.
"""

FULL_DESC_TEMPLATE_SOLO = """{emoji} {name} - the modern {family_lower} app you'll actually keep open

{name} is a beautifully-designed {family_lower} app with everything you need to spend a coffee break or a long flight on great puzzles.

{rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ WHY {name_upper}?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• DAILY CHALLENGE - one fresh puzzle every day, ranked against the world. Build a streak.

• SMART HINTS, unlimited UNDO and auto-move - never get stuck.

• GLOBAL LEADERBOARD - see how you rank against everyone, weekly and all-time.

• 3 LANGUAGES - English, Français, العربية (with full right-to-left layout).

• OFFLINE MODE - play anywhere, no internet needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F3AF FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Full official rules, fast & responsive
✓ Cloud-saved progress - sign in with Google to play across devices
✓ Coin economy, achievements, daily missions
✓ Custom themes & card backs
✓ Beautiful dark UI with smooth animations
✓ No ads, no popup, no nonsense

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F512 PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We collect only what's needed to save your progress and the leaderboard:
• Your email (for account login)
• Your Google profile name + picture (only if you sign in with Google)
• Game stats (best times, win streak) for the leaderboard

We DO NOT sell your data, share it with advertisers, or track you across other apps. Read our full privacy policy at https://sallycards.salistar.com/legal/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\U0001F4EC CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions, feedback, bug reports? Email: salistarcompany@gmail.com
Web: https://sallycards.salistar.com

Made with ❤️ by Salistar Company.
"""

CONTACT_TXT = """Developer name : Salistar Company
Contact email  : salistarcompany@gmail.com
Website        : https://sallycards.salistar.com
Phone          : (optional - leave blank unless you want it public)
Address        : (optional - only required if publishing as a company)
"""

PRIVACY_URL_TXT = "https://sallycards.salistar.com/legal/privacy\n"

# ---------- Forms (per-app fill) ----------

def content_rating_md(app):
    chat_yes = "**YES**" if app["multiplayer"] else "**No**"
    chat_detail = ("Live games have a private text chat between players in the room."
                   if app["multiplayer"] else
                   "The app has no chat or user-generated content.")
    q9_answer = ('**YES** (anyone with the room code can join, and the leaderboard '
                 'exposes usernames)') if app["multiplayer"] else '**No**'
    pegi = ('**PEGI 3** (then "+12" because of un-moderated chat - common for any '
            'game with chat)') if app["multiplayer"] else '**PEGI 3**'
    return f"""# Content Rating Questionnaire - Pre-filled answers - {app['name']}

Google Play uses the **IARC** (International Age Rating Coalition) questionnaire.
It generates ratings for 7 different boards (PEGI, ESRB, USK, etc.) from one set
of answers.

URL: Play Console -> Policy -> App content -> Content rating -> **Start questionnaire**

## Category to pick
**Game** (NOT "Reference, News, or Educational")

## Email for rating certificates
salistarcompany@gmail.com

## Answers

| # | Question (paraphrased) | Answer | Why |
|---|---|---|---|
| 1 | Violence | **No** | Card/board game - zero violence |
| 2 | Sexuality / nudity | **No** | None |
| 3 | Profanity | **No** | UI has no profanity. {chat_detail} |
| 4 | Drugs, alcohol, tobacco | **No** | None |
| 5 | Gambling - does the app contain gambling? | **No** | The in-app coin economy is **non-monetary** (coins are earned by winning games, NOT bought with real money). Therefore NOT gambling. |
| 6 | Simulated gambling (slot machines, etc.) | **No** | None |
| 7 | User-generated content (chat, posts, etc.) | {chat_yes} | {chat_detail} |
| 7a | If yes: is it moderated? | **No filter / not moderated** | Honest answer. Add a profanity filter in a future release to lower the age rating. |
| 7b | If yes: is it broadcast/public? | **No** | Chat is private between players in the same room only. |
| 7c | If yes: can users share location / personal info? | **No** | No location sharing. |
| 8 | Shares user's location | **No** | We don't request location permission |
| 9 | Allows users to interact / play with other users they don't know | {q9_answer} | Honest answer |
| 10 | Digital purchases | **No** | The app has a coin shop but no real-money IAP yet. **Update this answer** when Play Billing is added. |
| 11 | Shares personal info with third parties | **No** | We don't share data with ad networks |

## Expected ratings (output)

| Board | Rating |
|---|---|
| ESRB (US) | **Everyone (E)** |
| PEGI (Europe) | {pegi} |
| USK (Germany) | **0** or **6** |
| Australia | **G** (General) |
| Brazil | **Livre** (L) |

> Turning on a profanity filter or disabling chat for under-13 accounts later
> drops the PEGI rating back to 3 across the board.

## Generates a certificate

After submitting, Google emails you a **rating certificate**. It auto-applies
to your store listing - you don't need to upload anything else.
"""


def data_safety_md(app):
    chat_collected = "YES" if app["multiplayer"] else "NO"
    chat_purpose   = "Required" if app["multiplayer"] else "-"
    chat_reason    = "App functionality (real-time chat in a live room)" if app["multiplayer"] else "-"
    audio_note = ("*Audio during a live call goes peer-to-peer via WebRTC. The audio "
                  "stream is NEVER stored on our servers. Mic-only recording is saved "
                  "locally on the user's device only." if app["multiplayer"] else
                  "*The app does not request microphone access.")
    return f"""# Data Safety Form - Pre-filled answers - {app['name']}

Google Play requires every developer to declare what data the app collects,
shares, and why. The form is at:

  Play Console -> Policy -> App content -> **Data safety** -> Start

This document mirrors exactly what **{app['name']}** does so you can copy
the answers verbatim.

## 1) Does your app collect or share any of the required user data types?
**YES**

## 2) Is all of the user data collected by your app encrypted in transit?
**YES** - all API calls go over HTTPS (api.salistar.com is fronted by
Caddy + Let's Encrypt). WebSocket upgrades inherit the TLS connection.

## 3) Do you provide a way for users to request that their data be deleted?
**YES** - they can email salistarcompany@gmail.com and we delete their
record from MongoDB on request. A future release will add an in-app
"Delete my account" button to make this self-service.

---

## 4) Data types collected - declare each row

### Personal info

| Data type | Collected? | Shared with 3rd parties? | Required vs Optional | Purpose |
|---|---|---|---|---|
| Name | YES (only via Google sign-in) | NO | Optional (only Google sign-in users have it) | Account management |
| Email address | YES | NO | Required for non-guest accounts | Account management |
| User ID | YES | NO | Required | Account management |
| Address, phone, race, ... | NO | - | - | - |

### Photos and videos
| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Photos | NO | - | - |
| Videos | NO* | - | *Screen recording is generated and stored ONLY on the user's device. The app never uploads it. |

### Audio
| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Voice / sound recordings | NO* | - | {audio_note} |
| Music files | NO | - | - |

### App activity
| Data type | Collected? | Shared? | Required vs Optional | Purpose |
|---|---|---|---|---|
| App interactions (game progress) | YES | NO | Required | App functionality (save level progress, leaderboard) |
| In-app search history | NO | - | - | - |
| Other user-generated content (chat messages) | {chat_collected} | NO | {chat_purpose} | {chat_reason} |

### Location
| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Approximate location | NO | - | - |
| Precise location | NO | - | - |

### Contacts
**Not collected**

### Health and fitness
**Not collected**

### Financial info
**Not collected** (no in-app purchases yet)

### Device or other IDs
| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Device or other IDs | NO* | - | *We do not collect Android Advertising ID, IMEI, or similar device identifiers |

---

## 5) Security practices - recap shown to users

The Play Store will display these badges automatically:
- Data is encrypted in transit
- You can request that data be deleted
- Independent security review (optional - leave blank for now)

---

## 6) Data shared with third parties - IMPORTANT

**NONE.** We do not use any analytics SDK, ad SDK, or third-party crash
reporter. The only third parties in the data flow are:

| Third party | Why | Data sent |
|---|---|---|
| Google (via Sign-In) | OAuth authentication | The user CHOOSES to give us their Google profile info |
| Hetzner (VPS provider) | Hosts the database | Standard cloud-hosting - they don't read user data |
| Cloudflare | DNS + CDN for the landing page | Cloudflare sees the user's IP, like any CDN |

-> **None of these count as "data sharing"** in the Play Store sense
  (sharing = sending data to advertisers, analytics providers, etc.).

---

## After submitting

Google reviews the form (usually instant). The "Data safety" section will
appear on your store listing once approved.

Re-open this form and update it every time you add:
- a new third-party SDK (analytics, Sentry, etc.)
- an in-app purchase
- a new data type
"""


def target_audience_md(app):
    age_block = (
        "- [ ] Ages 5 and under\n"
        "- [ ] Ages 6-8\n"
        "- [ ] Ages 9-12\n"
        "- [x] **Ages 13-15**\n"
        "- [x] **Ages 16-17**\n"
        "- [x] **Ages 18 and over**\n"
    )
    reason = (
        "The app has free-form text chat between players in a live room. "
        "There is no profanity filter, no moderation, and no \"child accounts\" "
        "mode. Targeting 13+ keeps you on the safe side of COPPA (US), "
        "GDPR-K (EU) and Play Families policy."
        if app["multiplayer"] else
        "The single-player experience itself is fine for all ages, but until "
        "we ship a dedicated kids mode (parental gate + no analytics) we keep "
        "the target at 13+ to stay on the safe side of COPPA / GDPR-K."
    )
    return f"""# Target Audience & Content - Pre-filled answers - {app['name']}

Play Console -> Policy -> App content -> **Target audience and content**

This declares who your app is FOR (different from the content rating which
describes what's IN the app).

## 1) Select the age groups your app is targeting

{age_block}

**Why 13+ and not "all ages"?**

{reason}

If you later add:
- a moderated/filtered chat OR a "no chat for child accounts" toggle
- OR a dedicated Kids mode
-> you can re-submit and target younger audiences without re-publishing.

## 2) Does your app appeal to children?

**No** - the app is for everyone, but the dark UI, social features and
leaderboards don't specifically target children.

## 3) If "Yes" to question 2: Children's content compliance

Skip - answered No.

## 4) Ads

Does your app contain ads? **NO** - the app has no ads.

---

## What changes if you say "Yes" to targeting under-13

The Play Console will require:
- Self-certification of COPPA / GDPR-K compliance
- A clear children's privacy policy
- Disabling features Google considers risky for kids: chat, sign-in
  with non-Google providers, ads with adult content, etc.
- The app goes into "Designed for Families" - a separate review track
  that takes ~2-7 days

Our recommendation: **stay at 13+** for now. Re-evaluate when moderation
ships.

---

## Privacy policy link (re-asked here)

https://sallycards.salistar.com/legal/privacy
"""


# ---------- Asset generation ----------

def gen_icon(app, out_path):
    """Resize apps/mobile/<slug>/assets/icon.png to 512x512."""
    src = MOBILE / app["slug"] / "assets" / "icon.png"
    if not src.exists():
        raise FileNotFoundError(f"missing icon for {app['slug']}: {src}")
    img = Image.open(src).convert("RGBA")
    img = img.resize((512, 512), Image.LANCZOS)
    img.save(out_path, "PNG")


def _dominant_palette(icon_path):
    """Sample the icon's dominant non-bg color and derive a gradient.

    Returns (accent, mid, dark) - three RGB tuples to use as bg gradient
    + accent. Algorithm: quantize, drop white/black/grey, weight by
    saturation x count.
    """
    img = Image.open(icon_path).convert("RGBA").resize((96, 96), Image.LANCZOS)
    from collections import Counter
    buckets = Counter()
    for r, g, b, a in img.getdata():
        if a < 200:
            continue
        lum = (r + g + b) / 3
        if lum > 235 or lum < 18:
            continue
        sat = max(r, g, b) - min(r, g, b)
        if sat < 10:
            continue  # near-grey
        buckets[(r // 16 * 16, g // 16 * 16, b // 16 * 16)] += sat // 8 + 1
    if not buckets:
        accent = (60, 110, 200)
    else:
        accent = buckets.most_common(1)[0][0]
    # Boost saturation so the gradient is vivid
    r, g, b = accent
    mx = max(r, g, b)
    if mx > 0:
        scale = 220 / mx
        r = min(255, int(r * scale))
        g = min(255, int(g * scale))
        b = min(255, int(b * scale))
    accent = (r, g, b)
    mid  = tuple(int(c * 0.55) for c in accent)
    dark = tuple(int(c * 0.18) for c in accent)
    # ensure dark is dark enough
    if sum(dark) > 80:
        dark = tuple(int(c * 0.10) for c in accent)
    return accent, mid, dark


def _rounded_icon(icon_path, size, radius_frac=0.22):
    """Open icon, fit into size x size with a soft rounded mask."""
    img = Image.open(icon_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    radius = int(size * radius_frac)
    md.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def _wrap_to_pixel_width(text, font, max_w, draw, max_lines=2):
    """Greedy word-wrap that measures each candidate line in pixels."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        cand_w = draw.textbbox((0, 0), cand, font=font)[2]
        if cand_w <= max_w or not cur:
            cur = cand
        else:
            lines.append(cur)
            cur = w
            if len(lines) >= max_lines:
                break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    # If we truncated, ellipsize last line
    if lines and len(" ".join(lines)) < len(text):
        last = lines[-1]
        while draw.textbbox((0, 0), last + "...", font=font)[2] > max_w and len(last) > 1:
            last = last[:-1]
        lines[-1] = last + "..."
    return lines


def gen_feature_graphic(app, out_path):
    """1024x500 banner v2:
       * gradient extracted from the app's icon (accent color of the logo)
       * the REAL icon shown as the right-side badge (no overlap with text)
       * title + 2-line tagline fit precisely inside the left area
    """
    W, H = 1024, 500

    icon_path = MOBILE / app["slug"] / "assets" / "icon.png"
    accent, mid, dark = _dominant_palette(icon_path)

    # --- Background: smooth horizontal gradient dark -> mid -> dark
    base = Image.new("RGB", (W, H), dark)
    draw = ImageDraw.Draw(base)
    for x in range(W):
        t = x / (W - 1)
        # ease: dark at left, mid in middle, dark-ish on right
        if t < 0.5:
            k = t * 2  # 0..1
            c1, c2 = dark, mid
        else:
            k = (t - 0.5) * 2
            c1, c2 = mid, tuple(int(c * 0.45) for c in accent)
        r = int(c1[0] + (c2[0] - c1[0]) * k)
        g = int(c1[1] + (c2[1] - c1[1]) * k)
        b = int(c1[2] + (c2[2] - c1[2]) * k)
        draw.line([(x, 0), (x, H)], fill=(r, g, b))

    # Bottom darken band so the bottom-left URL is readable
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(H):
        a = int(min(120, max(0, (y - H * 0.55) * 0.7)))
        od.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    base = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(base)

    # --- Fonts
    def load(size, bold=True):
        for fn in (["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf"] if bold
                   else ["segoeui.ttf", "arial.ttf", "calibri.ttf"]):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                continue
        return ImageFont.load_default()

    title_font = load(96, bold=True)
    sub_font   = load(30, bold=False)
    foot_font  = load(22, bold=True)

    # --- Right-side badge = the REAL app icon
    BADGE = 320
    PAD_R = 64
    bx = W - BADGE - PAD_R
    by = (H - BADGE) // 2

    # Soft glow behind badge using the accent color
    glow_pad = 60
    glow = Image.new("RGBA", (BADGE + glow_pad * 2, BADGE + glow_pad * 2), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(
        [glow_pad // 2, glow_pad // 2,
         BADGE + glow_pad + glow_pad // 2, BADGE + glow_pad + glow_pad // 2],
        radius=int((BADGE + glow_pad) * 0.22),
        fill=(accent[0], accent[1], accent[2], 90))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=24))
    base_rgba = base.convert("RGBA")
    base_rgba.paste(glow, (bx - glow_pad, by - glow_pad), glow)

    # The real icon, rounded
    icon = _rounded_icon(icon_path, BADGE, radius_frac=0.22)
    base_rgba.paste(icon, (bx, by), icon)
    base = base_rgba.convert("RGB")
    draw = ImageDraw.Draw(base)

    # --- LEFT SAFE ZONE for text
    LEFT_PAD = 64
    SAFE_W   = bx - LEFT_PAD - 40    # 40 px gap between text and badge
    # so SAFE_W ~ W - BADGE - PAD_R - LEFT_PAD - 40 = 1024 - 320 - 64 - 64 - 40 = 536 px

    # Auto-shrink title until it fits
    title = app["name"]
    for size in (96, 84, 76, 68, 60, 54, 48):
        title_font = load(size, bold=True)
        tw = draw.textbbox((0, 0), title, font=title_font)[2]
        if tw <= SAFE_W:
            break

    # Auto-shrink tagline font until tagline wraps to <= 2 lines in SAFE_W
    tagline = app["short_desc"]
    for sub_size in (32, 28, 26, 24, 22):
        sub_font = load(sub_size, bold=False)
        # quick check: longest single word still fits
        longest_w = max(
            draw.textbbox((0, 0), w, font=sub_font)[2] for w in tagline.split())
        if longest_w > SAFE_W:
            continue
        lines = _wrap_to_pixel_width(tagline, sub_font, SAFE_W, draw, max_lines=2)
        # OK if all words present in the 2 lines (no truncation)
        if " ".join(lines).replace("...", "").strip().startswith(tagline.split()[0]) and \
           not any("..." in l for l in lines):
            break
    else:
        lines = _wrap_to_pixel_width(tagline, sub_font, SAFE_W, draw, max_lines=2)

    # --- Place title + tagline vertically centered on the left
    title_h = draw.textbbox((0, 0), title, font=title_font)[3]
    line_h  = draw.textbbox((0, 0), "Ag", font=sub_font)[3] + 6
    block_h = title_h + 24 + line_h * len(lines)
    y = (H - block_h) // 2 - 10
    draw.text((LEFT_PAD, y), title, font=title_font, fill=(255, 255, 255))
    y += title_h + 24
    for ln in lines:
        draw.text((LEFT_PAD, y), ln, font=sub_font, fill=(232, 232, 240))
        y += line_h

    # --- Footer URL bottom-left
    draw.text((LEFT_PAD, H - 50), "sallycards.salistar.com",
              font=foot_font, fill=(255, 255, 255))

    base.save(out_path, "PNG", optimize=True)


# ---------- Per-app file writing ----------

def emoji_for(family):
    return {
        "Cards":              "\U0001F0CF",   # playing card
        "Tiles":              "\U0001F0CF",
        "Memory":             "\U0001F9E0",   # brain
        "Guessing":           "\U0001F9D0",   # monocle face
        "Spot the Difference":"\U0001F50D",   # magnifier
        "Solo cards":         "\U0001F0CF",
    }.get(family, "\U0001F3AE")


def write_app(app):
    slug = app["slug"]
    root = OUT_ROOT / slug
    (root / "apk").mkdir(parents=True, exist_ok=True)
    (root / "assets").mkdir(parents=True, exist_ok=True)
    (root / "text").mkdir(parents=True, exist_ok=True)
    (root / "forms").mkdir(parents=True, exist_ok=True)

    # README + APK-vs-AAB
    (root / "README.md").write_text(
        README_TEMPLATE.format(
            name=app["name"], short_title=app["short_title"],
            slug=slug, category=app["category"]),
        encoding="utf-8")
    (root / "APK-vs-AAB.md").write_text(
        APK_VS_AAB_TEMPLATE.format(name=app["name"], slug=slug),
        encoding="utf-8")
    (root / "apk" / "README.txt").write_text(
        APK_README_TEMPLATE.format(name=app["name"], slug=slug),
        encoding="utf-8")

    # Assets
    gen_icon(app, root / "assets" / "icon-512.png")
    gen_feature_graphic(app, root / "assets" / "feature-graphic-1024x500.png")

    # Text
    (root / "text" / "title.txt").write_text(app["short_title"] + "\n", encoding="utf-8")
    (root / "text" / "short-description.txt").write_text(app["short_desc"] + "\n", encoding="utf-8")
    tpl = FULL_DESC_TEMPLATE_MULTIPLAYER if app["multiplayer"] else FULL_DESC_TEMPLATE_SOLO
    full = tpl.format(
        name=app["name"],
        name_upper=app["name"].upper(),
        family_lower=app["family"].lower(),
        rules=app["rules"],
        emoji=emoji_for(app["family"]),
    )
    (root / "text" / "full-description.txt").write_text(full, encoding="utf-8")
    (root / "text" / "category.txt").write_text(
        app["category"] + "\n(Secondary tag: " +
        ("Card Battle" if app["family"] == "Cards" else
         "Brain Games" if app["family"] in ("Memory", "Spot the Difference") else
         "Board Games") + ")\n",
        encoding="utf-8")
    (root / "text" / "contact.txt").write_text(CONTACT_TXT, encoding="utf-8")
    (root / "text" / "privacy-policy-url.txt").write_text(PRIVACY_URL_TXT, encoding="utf-8")

    # Forms
    (root / "forms" / "content-rating-answers.md").write_text(content_rating_md(app), encoding="utf-8")
    (root / "forms" / "data-safety-form.md").write_text(data_safety_md(app), encoding="utf-8")
    (root / "forms" / "target-audience.md").write_text(target_audience_md(app), encoding="utf-8")

    # Sanity: file count
    n = sum(1 for _ in root.rglob("*") if _.is_file())
    return n


def main():
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    total_files = 0
    print(f"Output root: {OUT_ROOT}")
    for app in APPS:
        try:
            n = write_app(app)
            total_files += n
            print(f"  [OK]  {app['slug']:14s} -> {n} files  ({app['name']})")
        except Exception as e:
            print(f"  [ERR] {app['slug']:14s} -> {e}")
            raise
    print(f"\nDone. Generated {len(APPS)} app packs, {total_files} files total.")
    print(f"Open: {OUT_ROOT}")


if __name__ == "__main__":
    main()
