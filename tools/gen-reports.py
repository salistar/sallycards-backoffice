# -*- coding: utf-8 -*-
"""Génère 2 rapports PDF SallyCards sur le Desktop (reportlab / Platypus)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Preformatted, Table, TableStyle, ListFlowable, ListItem)
from reportlab.lib.enums import TA_LEFT

DESK = os.path.join(os.path.expanduser("~"), "Desktop")
NAVY = colors.HexColor("#0A1535"); BLUE = colors.HexColor("#2563EB")
GOLD = colors.HexColor("#B7791F"); GREY = colors.HexColor("#475569")

ss = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=ss['Heading1'], textColor=NAVY, fontSize=17, spaceBefore=14, spaceAfter=8)
H2 = ParagraphStyle('H2', parent=ss['Heading2'], textColor=BLUE, fontSize=13, spaceBefore=10, spaceAfter=5)
H3 = ParagraphStyle('H3', parent=ss['Heading3'], textColor=GOLD, fontSize=11, spaceBefore=8, spaceAfter=3)
BODY = ParagraphStyle('Body', parent=ss['BodyText'], fontSize=9.5, leading=14, alignment=TA_LEFT, spaceAfter=5)
SMALL = ParagraphStyle('Small', parent=BODY, fontSize=8.5, textColor=GREY)
CODE = ParagraphStyle('Code', parent=ss['Code'], fontName='Courier', fontSize=8, leading=10.5,
                      backColor=colors.HexColor("#F1F5F9"), borderColor=colors.HexColor("#CBD5E1"),
                      borderWidth=0.5, borderPadding=5, spaceBefore=4, spaceAfter=8, leftIndent=2)
TITLE = ParagraphStyle('TitleX', parent=ss['Title'], textColor=NAVY, fontSize=24, spaceAfter=6)
SUB = ParagraphStyle('Sub', parent=ss['Normal'], textColor=GREY, fontSize=11, spaceAfter=2)


def render(blocks):
    story = []
    for kind, val in blocks:
        if kind == 'title':
            story.append(Paragraph(val, TITLE))
        elif kind == 'sub':
            story.append(Paragraph(val, SUB))
        elif kind == 'h1':
            story.append(Paragraph(val, H1))
        elif kind == 'h2':
            story.append(Paragraph(val, H2))
        elif kind == 'h3':
            story.append(Paragraph(val, H3))
        elif kind == 'p':
            story.append(Paragraph(val, BODY))
        elif kind == 'small':
            story.append(Paragraph(val, SMALL))
        elif kind == 'code':
            story.append(Preformatted(val, CODE))
        elif kind == 'ul':
            items = [ListItem(Paragraph(x, BODY), leftIndent=10) for x in val]
            story.append(ListFlowable(items, bulletType='bullet', start='square', leftIndent=12))
            story.append(Spacer(1, 4))
        elif kind == 'table':
            t = Table(val, hAlign='LEFT', repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), NAVY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(t)
            story.append(Spacer(1, 8))
        elif kind == 'spacer':
            story.append(Spacer(1, val))
        elif kind == 'pb':
            story.append(PageBreak())
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(20 * mm, 12 * mm, "SallyCards - Salistar Company - salistarcompany@gmail.com")
    canvas.drawRightString(190 * mm, 12 * mm, "Page %d" % doc.page)
    canvas.restoreState()


def build(path, blocks):
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=18 * mm, bottomMargin=20 * mm,
                            leftMargin=18 * mm, rightMargin=18 * mm, title=os.path.basename(path))
    doc.build(render(blocks), onFirstPage=footer, onLaterPages=footer)
    print("OK ->", path)


# =====================================================================
# RAPPORT 1 - SESSION
# =====================================================================
R1 = [
 ('title', "SallyCards - Rapport de session"),
 ('sub', "Cross-play web/mobile, appel audio-video + chat, generalisation 10 apps, deploiement CI/CD"),
 ('sub', "Date : 25 mai 2026 - Salistar Company"),
 ('spacer', 8),

 ('h1', "1. Objectif de la session"),
 ('p', "Rendre le multijoueur de l'app mobile Belote interoperable avec le web (un joueur web "
       "joue avec un joueur mobile dans la meme partie), ajouter l'appel audio/video (WebRTC "
       "TURN/STUN) + chat dans le plateau, puis generaliser a toutes les apps mobiles (sauf "
       "Solitaire), et enfin synchroniser le tout vers les depots GitHub de deploiement avec "
       "CI/CD pour generer les APK et les publier sur la page /download."),

 ('h1', "2. Belote : multijoueur cross-platform web - mobile"),
 ('p', "Diagnostic : l'ecran de jeu mobile simulait une partie LOCALE (bots cote client) avec une "
       "synchro factice. Il ne pouvait pas partager une room avec un joueur web."),
 ('p', "Architecture retenue (le serveur fait foi) :"),
 ('ul', [
   "Gateway <b>/game</b> (NestJS, socket-server) AUTORITATIF, rooms en memoire cles par <b>gameType:CODE</b>.",
   "Web et mobile rejoignent la MEME room sur l'unique instance socket-server -&gt; cross-play natif.",
   "Persistance : metadonnees de room en <b>MongoDB</b> (API /rooms), fan-out temps reel via <b>Redis</b> pub/sub (/lobby), etat de jeu live en memoire dans /game (correct pour une instance unique).",
 ]),
 ('p', "Reecriture de apps/mobile/belote/app/game/[roomCode].tsx en client MINCE :"),
 ('code', "io(`${SOCKET}/game`, { transports:['websocket'], auth:(cb)=>cb({token}) })\n"
          "s.emit('game:join', { roomCode, gameType:'belote' })\n"
          "s.on('game:state', snap => setSnap(snap))   // rendu direct de la vue serveur\n"
          "s.emit('game:action', { roomCode, action }) // BID / PLAY_CARD (playerId injecte serveur)\n"
          "s.emit('game:start', { roomCode })           // revanche"),
 ('ul', [
   "Token : ensureToken() -&gt; session invite (auth/guest) en repli, refresh sur connect_error.",
   "Web inchange (deja un client autoritatif correct). Seul le mobile etait casse.",
 ]),

 ('h1', "3. Appel audio/video (WebRTC TURN/STUN) + chat dans le plateau"),
 ('ul', [
   "Nouveau composant <b>src/components/Chat.tsx</b> (namespace /chat, roomId = jeu-CODE).",
   "<b>P2PCall</b> : mode <b>compact</b> (rangee de vignettes) -&gt; ma camera + celles des AUTRES participants (mesh WebRTC via TURN/STUN SALISTAR).",
   "Boutons <b>Appel</b> et <b>Chat</b> INDEPENDANTS dans le plateau (les deux en meme temps).",
   "<b>AppHeader</b> : prop optionnelle onBack (confirmation avant de quitter).",
 ]),
 ('p', "Bug majeur corrige : les boutons Appel/Chat etaient en texte blanc sur fond clair (theme "
       "clair) -&gt; invisibles. Passes en bleu plein (APP_CONFIG.primary), visibles dans tous les themes."),

 ('h1', "4. Corrections diverses (mobile + web)"),
 ('table', [
   ["Symptome", "Cause", "Correctif"],
   ["api call failed /rooms/CODE/join", "code cree cote web absent de MongoDB (404)", "Rejoindre -> /game/CODE direct"],
   ["camera/chat invisibles", "boutons blanc-sur-blanc (theme clair)", "boutons bleus + P2PCall compact"],
   ["Unable to load script (tel)", "adb reverse 8081 saute", "re-etablir adb reverse + RELOAD"],
   ["ecran noir", "ecran du tel en veille", "wakeup + stayon"],
   ["backend = 127.0.0.1", "EXPO_PUBLIC_* en local", ".env -> prod, EXPO_PUBLIC_DEFAULT_ENV=prod"],
 ]),
 ('p', "Web (belote/room/[code]) : passage de localStorage.accessToken direct a resolveGameToken() "
       "(courant -&gt; refresh -&gt; invite) + refresh sur connect_error (corrige le blocage 'connexion...')."),

 ('h1', "5. Generalisation a toutes les apps mobiles (hors Solitaire)"),
 ('p', "Chaque app : ecran de jeu = client mince /game (gameType propre), rendu de game:state, "
       "game:action, game:start ; appel audio/video (P2PCall compact) + chat ; Creer/Rejoindre "
       "-&gt; /game/CODE direct ; .env -&gt; prod. Typecheck propre sur tous les fichiers modifies."),
 ('table', [
   ["App", "gameType", "Plateau (rendu autoritatif)"],
   ["belote", "belote", "encheres + plis (4 joueurs 2v2)"],
   ["ronda", "ronda", "capture cartes espagnoles"],
   ["kdoub", "kdoub", "pile + defi/bluff"],
   ["scopa", "scopa", "capture cartes italiennes"],
   ["poker", "poker", "Texas Hold'em : pot/mises/fold-call-raise-allin"],
   ["tarot", "tarot", "plis (78 cartes)"],
   ["okey", "okey", "tuiles colorees : pioche/jette/termine"],
   ["concentration", "concentration", "grille memoire : flip"],
   ["quiestce", "quiestce", "suspects : questions / deviner"],
   ["kantcopy", "kantcopy", "pioche/jette/signal/announce"],
 ]),
 ('small', "Cartes en vraies images (scopa/ronda) ou pastilles texte robustes (poker/tarot/okey/kantcopy) "
           "pour eviter tout asset manquant. Logique multijoueur + voix/chat complete ; visuel a peaufiner."),

 ('h1', "6. Synchronisation deploiement + CI/CD + page /download"),
 ('ul', [
   "<b>node apps-deploy/sync-app.js</b> : copie apps/mobile/&lt;jeu&gt; -&gt; apps-deploy/sally-&lt;jeu&gt; (10 jeux).",
   "<b>Push GitHub</b> : 10 depots github.com/salistar/sally-&lt;jeu&gt; pousses sur main (gh authentifie salistar).",
   "<b>CI/CD</b> : android-build.yml -&gt; sur push main, build APK debug (Gradle, sans EAS) puis publie une Release 'latest' (.../releases/download/latest/app-debug.apk).",
   "<b>/download</b> : deja cablee (games.ts) ; chaque APK apparait automatiquement. https://sallycards.salistar.com/download .",
 ]),
 ('h2', "6.1 Correctifs de build CI (monorepo -> standalone)"),
 ('ul', [
   "shared/ partiel -&gt; 'Unable to resolve ../../shared/googleAuth' : copie du shared/ COMPLET.",
   "'@sally/game-engine' (lib workspace, importee par les ecrans solo) introuvable en standalone : "
   "vendoring de libs/game-engine + libs/shared/types dans vendor/, alias metro (extraNodeModules) + dependance zustand.",
   "sync-app.js durci : full shared/ + vendor @sally/* + zustand + nettoyage deps @sally.",
 ]),
 ('h2', "6.2 Etat final des builds CI"),
 ('ul', [
   "<b>11/11 APK generes et publies</b> (Release 'latest', app-debug.apk) : solitaire, belote, ronda, kdoub, scopa, poker, tarot, okey, concentration, quiestce, kantcopy.",
   "Correctifs cles : shared/ complet (googleAuth) ; vendor @sally/game-engine+types via alias metro + zustand ; package.json AUTONOME (deps fusionnees depuis le monorepo, ex. expo-image-picker / google-signin pour belote).",
   "https://sallycards.salistar.com/download sert les 11 APK (liens = Release latest de chaque depot, MAJ auto a chaque build).",
 ]),

 ('h1', "7. Commandes de build et de deploiement"),
 ('h3', "Build sur telephone (dev local, USB)"),
 ('code', ".\\tools\\run-one.ps1 <jeu>   # belote|ronda|kdoub|scopa|poker|tarot|okey|concentration|quiestce|kantcopy"),
 ('h3', "Build autonome EAS"),
 ('code', "cd apps\\mobile\\<jeu> ; eas init                                  # 1 fois\n"
          "cd apps\\mobile\\<jeu> ; eas build --platform android --profile preview"),
 ('h3', "Deployer en prod sur le telephone (watch)"),
 ('code', "cd apps-deploy\\sally-<jeu>\n"
          ".\\watch-and-install.ps1        # daemon : a chaque build CI reussi -> DL APK + install\n"
          ".\\watch-and-install.ps1 -Once  # une seule verif\n"
          ".\\install-from-github.ps1      # DL la Release latest + install\n"
          ".\\deploy-to-phone.ps1          # build local direct + install"),
 ('h3', "Cycle complet"),
 ('code', "1) coder dans apps/mobile/<jeu>\n"
          "2) node apps-deploy/sync-app.js          # sync -> depots deploy\n"
          "3) cd apps-deploy ; .\\push-all.ps1       # push -> CI build APK -> Release latest\n"
          "4) (sur le tel) cd apps-deploy\\sally-<jeu> ; .\\watch-and-install.ps1"),

 ('h1', "8. URLs multijoueur web (prod)"),
 ('code', "https://sallycards.salistar.com/<jeu>/room        (lobby)\n"
          "https://sallycards.salistar.com/<jeu>/room/<CODE> (table)\n"
          "jeux : belote ronda kdoub scopa poker tarot okey concentration quiestce kantcopy"),
 ('p', "Cross-play : joueur web sur /&lt;jeu&gt;/room/&lt;CODE&gt; + joueur mobile qui Rejoint le MEME code "
       "dans l'app du MEME jeu -&gt; meme room &lt;jeu&gt;:&lt;CODE&gt; du /game, voix + chat partages."),

 ('h1', "9. Commits"),
 ('ul', [
   "Monorepo (apps/mobile + apps/web) : commits locaux (sans push) - branche feat/solitaire-hint-bigger.",
   "Depots de deploiement (apps-deploy/sally-*) : commits + PUSH vers github.com/salistar/sally-<jeu>.",
   "Builds CI : <b>11/11 APK publies</b> (belote inclus apres fusion des deps autonomes).",
 ]),
]

# =====================================================================
# RAPPORT 2 - PROJET SALLYCARDS
# =====================================================================
R2 = [
 ('title', "SallyCards - Rapport projet"),
 ('sub', "Architecture, composants, features, infrastructure, base de donnees, deploiement, prompts de creation"),
 ('sub', "Salistar Company - salistarcompany@gmail.com"),
 ('spacer', 8),

 ('h1', "1. Vue d'ensemble"),
 ('p', "SallyCards est une suite de 11 jeux de cartes/societe (Solitaire + 10 jeux multijoueur) "
       "en monorepo Nx : un site web (Next.js), une API metier (NestJS + MongoDB), un serveur "
       "temps reel (Socket.IO/NestJS), Redis, un serveur TURN/STUN (coturn) pour la voix/video, "
       "et 11 apps mobiles Expo/React Native. Backend deploye par Docker + GitHub Actions vers un "
       "VPS Hetzner ; apps mobiles via depots GitHub dedies + CI APK."),
 ('table', [
   ["Brique", "Techno", "Role"],
   ["Web", "Next.js 15 (App Router)", "Vitrine, /download, salles multijoueur, ecrans data"],
   ["API", "NestJS + Mongoose + MongoDB", "Auth, users, rooms, leaderboards, shop, challenges, deal-seeds, hkim"],
   ["Socket", "NestJS WebSocket (Socket.IO)", "Gateways /game /lobby /chat /webrtc /presence"],
   ["Cache/bus", "Redis 7.2", "Pub/sub rooms, presence, fan-out temps reel"],
   ["WebRTC", "coturn (TURN/STUN)", "Appels audio/video P2P (credentials HMAC)"],
   ["Mobile", "Expo ~52 / RN 0.76 / expo-router", "11 apps natives (Android/iOS)"],
   ["Infra", "Docker, GitHub Actions, Hetzner", "CI/CD backend, conteneurs prod"],
 ]),
 ('p', "Domaines prod : web <b>sallycards.salistar.com</b>, API <b>api.salistar.com/api/v1</b>, "
       "socket <b>ws.salistar.com</b>, TURN <b>turn.salistar.com</b>."),

 ('h1', "2. Architecture (flux)"),
 ('code',
  "Mobile (Expo)  --HTTPS-->  api.salistar.com/api/v1   (NestJS + MongoDB)\n"
  "      |                          ^\n"
  "      |  WSS /game,/chat,/webrtc |  (mutations rooms -> Redis pub/sub)\n"
  "      v                          |\n"
  "Web (Next.js)  --WSS-->  ws.salistar.com (socket-server) <--> Redis\n"
  "      |                          |\n"
  "      +------- WebRTC P2P -------+--> turn.salistar.com (coturn)\n"
  "\n"
  "Room : metadonnees en MongoDB (API) | fan-out temps reel via Redis (/lobby)\n"
  "       etat de jeu LIVE en memoire dans /game (cle gameType:CODE)"),

 ('h1', "3. Backend - API (NestJS)"),
 ('ul', [
   "auth : login/register/google/guest/refresh (JWT access ~15min + refresh ; sub+username).",
   "users (profil, ELO, coins, by-game), rooms (CRUD, public/prive/ranked, ready/start, publie sur Redis 'sallycards:room').",
   "leaderboards (season/weekly/allTime, scope world/country/city), shop, challenges (daily), games (complete/save + ELO), bots, turn-creds (HMAC), hkim.",
   "deal-seeds : collection deal_seeds (~300 donnes resolubles/variante Solitaire, avec solution).",
   "migrations : migrations.service.ts (001..017) au boot.",
 ]),

 ('h1', "4. Backend - Socket-server (gateways)"),
 ('table', [
   ["Namespace", "Role"],
   ["/game", "Jeu AUTORITATIF multi-jeux via registre d'adaptateurs (belote, scopa, tarot, okey, quiestce, kdoub, kantcopy, concentration, poker, ronda). Rooms cle gameType:CODE, bots+transitions serveur, vue perso."],
   ["/lobby", "Relais Redis 'sallycards:room' -> room:updated."],
   ["/chat", "Chat texte par room (chat:join/message/leave)."],
   ["/webrtc", "Signaling mesh WebRTC (join/offer/answer/ice/leave) + TURN/STUN."],
   ["/presence", "Presence en ligne."],
 ]),
 ('p', "Auth WS : JWT dans handshake.auth.token (sub+username requis). Adaptateur = "
       "{seatCount, maxHumans, build, view, currentId, applyAction, advance, isOver}."),

 ('h1', "5. Base de donnees"),
 ('ul', [
   "<b>MongoDB</b> (Mongoose) : users, rooms, games, leaderboards, shop_packages, challenges, deal_seeds, hkim_&lt;jeu&gt;.",
   "<b>Redis</b> 7.2 : canal pub/sub 'sallycards:room', presence, fan-out temps reel. REDIS_URL=redis://sallycards-redis:6379.",
   "Decision room : metadonnees -&gt; MongoDB ; diffusion temps reel -&gt; Redis ; etat live -&gt; memoire /game.",
 ]),

 ('h1', "6. Features par app (11 jeux)"),
 ('table', [
   ["Jeu", "Joueurs", "Cartes", "Specificite"],
   ["Solitaire", "1 / 2-4", "52 FR", "192 variantes, donnes resolubles + indice"],
   ["Ronda", "2-4", "40 ES", "Capture marocaine, Tringla"],
   ["Kdoub", "3-6", "52 FR", "Bluff/defi (Kdoub!)"],
   ["Belote", "4 (2v2)", "32 FR", "Encheres + plis, Belote/Rebelote +20"],
   ["Poker", "2-9", "52 FR", "Texas Hold'em No-Limit, all-in"],
   ["Tarot", "3-5", "78", "Contrats, bouts (1/21/Excuse)"],
   ["Scopa", "2-4", "40 IT", "Capture, Scopa/Settebello/Primiera"],
   ["Okey", "4", "106 tuiles", "Rami turc, joker gosterge"],
   ["Concentration", "1-4", "memoire", "Paires, mode chrono"],
   ["Qui-est-ce", "2", "deduction", "Questions oui/non, deviner"],
   ["Kantcopy", "2-4", "52 FR", "Jeu original, carte Kant (copie)"],
 ]),
 ('p', "Communes (hors Solitaire solo) : multijoueur autoritatif, parties privees par code, bots "
       "serveur, classement ELO, appel audio/video (TURN/STUN) + chat en jeu, i18n FR/EN/AR, "
       "theme clair/sombre, boutique Sally Coins."),

 ('h1', "7. Apps mobiles (structure Expo)"),
 ('code',
  "apps/mobile/<jeu>/\n"
  "  app/            index, (tabs), game/[roomCode] (client mince /game),\n"
  "                  game/local|vs-bot (solo), room/{create,join,lobby}, auth, profile, shop\n"
  "  src/components/ AppHeader (onBack), AnimatedCard, P2PCall (WebRTC, compact), Chat\n"
  "  src/game/       moteur client + assets cartes\n"
  "  shared/         api.ts (REST+token, repli invite), env.ts (toggle local/prod), googleAuth\n"
  "  assets/ app.json eas.json metro.config.js .env"),

 ('h1', "8. Web (Next.js)"),
 ('ul', [
   "/download + /download/[slug] : catalogue 11 jeux (games.ts), regles FR/EN/AR, APK (Release latest GitHub).",
   "/<jeu>/room + /<jeu>/room/[code] : salles multijoueur (client autoritatif /game) + VoiceCall + Chat.",
   "/solitaire : 137 variantes (engines generiques), donnes resolubles, indice.",
   "Ecrans data (leaderboard, watch, admin) + i18n + LanguageSwitcher.",
 ]),

 ('h1', "9. Infrastructure et deploiement"),
 ('h3', "Backend (Docker + CI/CD -> VPS Hetzner)"),
 ('ul', [
   "docker-compose.prod.yml : web, api, socket-server, mongo, sallycards-redis, coturn.",
   "docker/{web,api,socket}.Dockerfile (web bake NEXT_PUBLIC_API_URL/SOCKET_URL prod).",
   ".github/workflows (deploy-prod.yml, backend-deploy.yml) : build + deploy VPS.",
   "TURN/STUN : coturn (sally-turn-stun), credentials HMAC via /api/turn-creds.",
 ]),
 ('h3', "Mobile (depots dedies + CI APK + /download)"),
 ('ul', [
   "apps-deploy/sally-<jeu> : 1 depot GitHub par app.",
   "sync-app.js : monorepo -> depot (app/src/assets/shared complet + vendor @sally/* + config prod).",
   "push-all.ps1 : push des 11 depots.",
   "CI android-build.yml : APK debug (Gradle) -> Release latest.",
   "EAS (eas.json) pour APK/AAB signes Play Store (voir deployMobile.md).",
   "watch-and-install.ps1 / install-from-github.ps1 / deploy-to-phone.ps1 : install sur tel USB.",
 ]),
 ('h3', "Methodes de deploiement - resume"),
 ('table', [
   ["Cible", "Methode", "Commande"],
   ["Backend prod", "Docker + GitHub Actions -> VPS", "push -> workflow deploy"],
   ["Web prod", "Docker (web.Dockerfile) -> VPS", "docker-compose.prod.yml"],
   ["APK (CI)", "GitHub Actions android-build", "push apps-deploy/sally-<jeu> -> Release latest"],
   ["APK/AAB signe", "EAS Build", "eas build --profile production --platform android"],
   ["Tel (dev)", "expo run:android", ".\\tools\\run-one.ps1 <jeu>"],
   ["Tel (prod)", "watch CI + adb install", ".\\watch-and-install.ps1"],
 ]),

 ('h1', "10. Prompts de creation du systeme SallyCards"),
 ('p', "Serie de prompts (par phase) pour reconstruire SallyCards de zero, dans l'ordre."),

 ('h2', "Phase 0 - Monorepo et conventions"),
 ('code',
  "Cree un monorepo Nx 'SallyCards' (11 jeux de cartes). Workspaces: apps/* (web, api,\n"
  "socket-server), apps/mobile/* (1 app Expo par jeu), libs/* (game-engine, shared/types).\n"
  "TypeScript strict, prettier, eslint. Docker + docker-compose (dev/prod). Domaines prod:\n"
  "web sallycards.salistar.com, api api.salistar.com/api/v1, socket ws.salistar.com,\n"
  "turn turn.salistar.com."),

 ('h2', "Phase 1 - API (NestJS + MongoDB)"),
 ('code',
  "Cree apps/api (NestJS + Mongoose/MongoDB). Modules: auth (JWT access 15min + refresh,\n"
  "login/register/google/guest, JWT = sub+username), users (ELO, coins, by-game), rooms (CRUD,\n"
  "public/prive/ranked, ready/start, code 6 car., publie chaque mutation sur Redis 'sallycards:\n"
  "room'), leaderboards (season/weekly/allTime, scope world/country/city), shop, challenges (daily),\n"
  "games (complete/save + ELO), bots, turn-creds (HMAC coturn), hkim. Reponses {success,data,\n"
  "timestamp}. Migrations au boot."),

 ('h2', "Phase 2 - Socket-server (temps reel autoritatif)"),
 ('code',
  "Cree apps/socket-server (NestJS + Socket.IO). Middleware auth WS: JWT dans handshake.auth.token\n"
  "(sub+username requis). Gateways: /game (multi-jeux via adaptateurs ; game:join{roomCode,gameType},\n"
  "game:action{roomCode,action}, game:start ; rooms memoire 'gameType:CODE' ; bots remplissent les\n"
  "sieges ; advance() joue bots+transitions ; view()=vue perso ; diffuse game:state), /lobby (relais\n"
  "Redis 'sallycards:room' -> room:updated), /chat (chat:join/message/leave), /webrtc (signaling\n"
  "mesh), /presence."),

 ('h2', "Phase 3 - Moteurs de jeux (adaptateurs)"),
 ('code',
  "Pour chaque jeu (belote, scopa, tarot, okey, quiestce, kdoub, kantcopy, concentration, poker,\n"
  "ronda): moteur pur-TS cote serveur (types, createDeck/shuffle, regles, gameReducer(action),\n"
  "botPlay/botBid, viewFor(state,youId)). Adaptateur {seatCount,maxHumans,build,view,currentId,\n"
  "applyAction,advance,isOver} enregistre dans game/adapters.ts. Le serveur valide chaque coup\n"
  "au siege courant."),

 ('h2', "Phase 4 - Web (Next.js)"),
 ('code',
  "Cree apps/web (Next.js 15, App Router). Pages: accueil, /download + /download/[slug] (catalogue\n"
  "games.ts, regles FR/EN/AR, APK = Release GitHub latest), /<jeu>/room + /<jeu>/room/[code]\n"
  "(client MINCE /game: WSS auth token, game:join, rendu game:state, game:action ; + VoiceCall\n"
  "WebRTC et Chat), /solitaire (engines generiques + donnes resolubles + indice), ecrans data.\n"
  "i18n FR/EN/AR. socketAuth.resolveGameToken (courant->refresh->invite)."),

 ('h2', "Phase 5 - Apps mobiles (Expo)"),
 ('code',
  "Pour chaque jeu, apps/mobile/<jeu> (Expo ~52, RN 0.76, expo-router). app/ (index, tabs,\n"
  "game/[roomCode]=client mince /game, game/local|vs-bot solo, room/{create,join,lobby}, auth,\n"
  "profile, shop), src/components (AppHeader onBack, AnimatedCard, P2PCall WebRTC compact, Chat),\n"
  "src/game (moteur+assets), shared/ (api.ts REST+token repli invite, env.ts toggle local/prod).\n"
  "L'ecran de jeu rend game:state et emet game:action ; Creer/Rejoindre -> /game/CODE direct ;\n"
  "appel audio/video + chat dans le plateau. .env: EXPO_PUBLIC_DEFAULT_ENV, API_URL, SOCKET_URL."),

 ('h2', "Phase 6 - Infra (Docker, Redis, coturn)"),
 ('code',
  "docker-compose.yml (dev) + docker-compose.prod.yml (prod): web, api, socket-server, mongo,\n"
  "sallycards-redis (redis:7.2-alpine, REDIS_URL=redis://sallycards-redis:6379), coturn (TURN/STUN,\n"
  "realm salistar.com, secret HMAC partage avec l'API turn-creds). Dockerfiles docker/{web,api,\n"
  "socket}.Dockerfile."),

 ('h2', "Phase 7 - CI/CD backend -> VPS"),
 ('code',
  "Cree .github/workflows/deploy-prod.yml : sur push main, build images Docker et deploie sur le\n"
  "VPS Hetzner (web/api/socket/turn). Secrets: registry, SSH/deploy, Mongo, JWT, TURN secret."),

 ('h2', "Phase 8 - CI/CD mobile (APK) + page /download"),
 ('code',
  "1 depot GitHub par app (sally-<jeu>) avec android-build.yml: npm install, expo prebuild,\n"
  "bundle (export:embed --dev false), gradle assembleDebug, publie Release 'latest' avec\n"
  "app-debug.apk (contents:write, sans secret EAS). apps-deploy/sync-app.js (monorepo -> depot:\n"
  "app/src/assets/shared complet + vendor @sally/* via alias metro + zustand + config prod) +\n"
  "push-all.ps1. Page /download (games.ts) cablee sur les Releases latest. Scripts tel:\n"
  "watch-and-install.ps1, install-from-github.ps1, deploy-to-phone.ps1."),

 ('h2', "Phase 9 - Store (EAS) - optionnel"),
 ('code',
  "eas.json (profils development/preview/production, EXPO_PUBLIC_DEFAULT_ENV=prod). AAB signe:\n"
  "eas build --profile production --platform android ; soumission: eas submit. Voir deployMobile.md\n"
  "(keystore unique, fiche Play, IARC, OTA eas update)."),

 ('h1', "11. Annexe - arborescence"),
 ('code',
  "SallyCards/\n"
  "  apps/web                Next.js (vitrine, /download, salles, solitaire)\n"
  "  apps/api                NestJS + MongoDB\n"
  "  apps/socket-server      NestJS + Socket.IO (gateways + adaptateurs)\n"
  "  apps/mobile/<jeu>       11 apps Expo\n"
  "  libs/game-engine        @sally/game-engine\n"
  "  libs/shared/types       @sally/types\n"
  "  apps-deploy/sally-<jeu> depots de deploiement (push GitHub + CI APK)\n"
  "  docker/                 Dockerfiles + turnserver.conf\n"
  "  .github/workflows/      CI/CD\n"
  "  deploy.md deployMobile.md  guides de deploiement"),
]

build(os.path.join(DESK, "SallyCards-Rapport-Session.pdf"), R1)
build(os.path.join(DESK, "SallyCards-Rapport-Projet.pdf"), R2)
print("FINI")
