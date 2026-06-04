# -*- coding: utf-8 -*-
# gen-belote-tests.py — Rapport de tests fonctionnels pour l'app Belote.
# Sortie : C:/Users/21266/Desktop/SallyCards/SallyCards-belote-tests.pdf
import os
import sys

# Reutilise les styles + helpers du generateur principal
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib
gen = importlib.import_module("gen-reports".replace("-", "_")) if False else None

# Comme `gen-reports.py` n'est pas import friendly (le tiret), on reimplemente
# une base de styles minimum.

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, HRFlowable, ListFlowable, ListItem)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

try:
    pdfmetrics.registerFont(TTFont("R", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("RB", r"C:\Windows\Fonts\arialbd.ttf"))
    F = "R"; FB = "RB"
except Exception:
    F = "Helvetica"; FB = "Helvetica-Bold"

NAVY = colors.HexColor("#0A1F44")
BLUE = colors.HexColor("#2563EB")
GOLD = colors.HexColor("#D4A12C")
GREEN = colors.HexColor("#10B981")
RED = colors.HexColor("#EF4444")
GREY = colors.HexColor("#444444")
LIGHT_BG = colors.HexColor("#F4F6FB")

AUTHOR = "Idriss Kriouile"
TITLE = "DevOps Senior · Test QA Manager · Tech Lead DevOps & QA"
STATUS = "Disponible — Casablanca / Maroc · salistarcompany@gmail.com"
PROFILE = "salistar.com · github.com/idriss-kriouile · LinkedIn"

ss = getSampleStyleSheet()
def style(name, font=F, size=10, color=GREY, align=TA_LEFT, leading=14,
          space_before=0, space_after=4, indent=0):
    return ParagraphStyle(name, parent=ss["Normal"], fontName=font, fontSize=size,
        textColor=color, alignment=align, leading=leading,
        spaceBefore=space_before, spaceAfter=space_after, leftIndent=indent)

S_TITLE = style("title", FB, 26, NAVY, TA_CENTER, 30, 0, 14)
S_SUB = style("sub", F, 13, GOLD, TA_CENTER, 18, 0, 28)
S_H1 = style("h1", FB, 17, NAVY, TA_LEFT, 22, 18, 8)
S_H2 = style("h2", FB, 13, BLUE, TA_LEFT, 18, 12, 6)
S_H3 = style("h3", FB, 11, GOLD, TA_LEFT, 15, 8, 4)
S_BODY = style("body", F, 10, GREY, TA_JUSTIFY, 15)
S_BODY_C = style("bodyc", F, 10, GREY, TA_CENTER, 14)
S_NOTE = style("note", F, 9, GREEN, TA_LEFT, 12)
S_TBL_H = style("tblh", FB, 9, colors.white, TA_LEFT, 12)
S_TBL = style("tbl", F, 8.5, GREY, TA_LEFT, 11)
S_TBL_C = style("tblc", F, 8.5, GREY, TA_CENTER, 11)
S_CODE = ParagraphStyle("code", parent=ss["Code"], fontName="Courier",
                         fontSize=8.5, textColor=NAVY, leading=11)


def P(t, st=S_BODY):
    s = str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(s, st)


def _cell(v, header=False, center=False):
    if hasattr(v, "wrapOn"):
        return v
    if header: return Paragraph(str(v), S_TBL_H)
    return Paragraph(str(v).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
                     S_TBL_C if center else S_TBL)


def T(data, col_widths=None, header_bg=NAVY, center_cols=()):
    rows = [[_cell(v, header=(i == 0), center=(j in center_cols))
             for j, v in enumerate(row)] for i, row in enumerate(data)]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("LINEABOVE", (0, 0), (-1, 0), 1.2, GOLD),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, GOLD),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(("BACKGROUND", (0, i), (-1, i), LIGHT_BG))
    t.setStyle(TableStyle(cmds))
    return t


def HR(c=GOLD, h=0.7):
    return HRFlowable(width="100%", thickness=h, color=c, spaceBefore=4, spaceAfter=8)


def header_footer(canvas, doc):
    w, h = A4
    canvas.saveState()
    canvas.setStrokeColor(GOLD); canvas.setLineWidth(1.2)
    canvas.line(15*mm, h-12*mm, w-15*mm, h-12*mm)
    canvas.setFont(FB, 9); canvas.setFillColor(NAVY)
    canvas.drawString(15*mm, 12*mm, AUTHOR)
    canvas.setFont(F, 8); canvas.setFillColor(GREY)
    canvas.drawString(15*mm, 8*mm, TITLE)
    canvas.drawRightString(w-15*mm, 12*mm, f"Page {doc.page}")
    canvas.drawRightString(w-15*mm, 8*mm, PROFILE)
    canvas.setStrokeColor(GOLD); canvas.line(15*mm, 16*mm, w-15*mm, 16*mm)
    canvas.restoreState()


# ============================================================================
# CONTENU DU RAPPORT DE TESTS
# ============================================================================

TEST_GROUPS = [
    ("1. Moteur de jeu (beloteEngine.ts + advanced)", [
        # Format: (id, scenario, given, when, then_expected)
        ("ENG-01", "Distribution des cartes",
         "Partie 4 joueurs, target=10",
         "initGame(['P0','Bot1','Bot2','Bot3'], 3, 10) suivi de START_GAME",
         "20 cartes au total distribuees, 5 par joueur, deck restant = 20 cartes"),
        ("ENG-02", "Carte la plus forte a l'atout",
         "Atout = 'oros', main = [Valet d'oros (11), As d'oros (1)]",
         "getCardStrength(Valet, 'oros') vs getCardStrength(As, 'oros')",
         "Valet > As (Valet=20 pts, As=11 pts dans TRUMP_ORDER)"),
        ("ENG-03", "Carte la plus forte hors atout",
         "Atout = 'bastos', main = [Roi de copas (12), As de copas (1)]",
         "getCardStrength(Roi, 'bastos') vs getCardStrength(As, 'bastos')",
         "As > Roi (As = plus forte hors atout)"),
        ("ENG-04", "Obligation de suivre la couleur",
         "Levee ouverte avec 5 de copas. Bot a [3 copas, As bastos, As oros]",
         "getPlayableCards(bot.hand, 'copas', 'bastos', currentTrick)",
         "Retourne [3 copas] uniquement (obligation de fournir)"),
        ("ENG-05", "Obligation de couper si pas de couleur demandee",
         "Levee de copas. Bot a 0 copas + atout (bastos) en main",
         "getPlayableCards avec lead='copas', trump='bastos'",
         "Retourne uniquement les cartes d'atout (obligation de couper)"),
        ("ENG-06", "Surcoupe obligatoire",
         "Lead=copas, partenaire deja coupe avec 7 bastos. Bot a 10 bastos + 2 bastos.",
         "getPlayableCards",
         "Retourne [10 bastos] (doit surcouper)"),
        ("ENG-07", "Resolution d'une levee",
         "4 cartes jouees, atout=oros : 5 oros, 7 copas, 11 oros (Valet), As copas",
         "resolveTrick(trick, 'oros')",
         "Vainqueur = joueur qui a joue 11 oros (Valet d'atout)"),
        ("ENG-08", "Total des points = 162 par manche",
         "Manche complete, atout = oros",
         "Somme(cardPoints) pour les 40 cartes + 10 de der",
         "= 152 + 10 (10 de der) = 162 points par manche"),
    ]),
    ("2. Annonces (tierce / cinquante / cent / carre / belote)", [
        ("ANN-01", "Tierce detectee (3 cartes consecutives meme couleur)",
         "Main = [5 oros, 6 oros, 7 oros, ...]",
         "detectAnnonces(player, 'bastos')",
         "Retourne 1 annonce { type:'tierce', points:20 }"),
        ("ANN-02", "Quarte = cinquante",
         "Main = [As copas, Roi copas, Valet copas, 10 copas]",
         "detectAnnonces",
         "Retourne 1 annonce { type:'cinquante', points:50 }"),
        ("ANN-03", "Cent (5+ cartes consecutives)",
         "Main = [As, Roi, Valet, 10, 7 — meme couleur]",
         "detectAnnonces",
         "Retourne 1 annonce { type:'cent', points:100 }"),
        ("ANN-04", "Carre de Valets = 200",
         "Main contient les 4 valets",
         "detectAnnonces",
         "Retourne { type:'carre-valets', points:200 }"),
        ("ANN-05", "Carre d'As = 100",
         "Main contient les 4 As",
         "detectAnnonces",
         "Retourne { type:'carre-autres', points:100 }"),
        ("ANN-06", "Belote (Roi + Dame d'atout)",
         "Atout=oros, main = [Roi oros, Dame oros, ...]",
         "hasBelote(player, 'oros')",
         "Retourne true. +20 pts a l'equipe a la fin"),
        ("ANN-07", "Bataille des annonces : 100 > 50",
         "Equipe 0 a 'cent' (100), equipe 1 a 'cinquante' (50)",
         "resolveAnnonces(...)",
         "winningTeam=0, totalPoints=100. L'equipe 1 ne marque RIEN."),
        ("ANN-08", "Egalite -> equipe du donneur gagne",
         "Equipe 0 a 'tierce' (20), equipe 1 a 'tierce' (20). Donneur = team 1.",
         "resolveAnnonces",
         "winningTeam=1, totalPoints=20"),
    ]),
    ("3. Bot par niveau (botBidAdvanced / botPlayAdvanced)", [
        ("BOT-01", "Bot Easy passe parfois sur main forte (randomness 30%)",
         "Main de 90 points en atout oros, config={difficulty:'easy', randomness:0.30}",
         "1000 appels a botBidAdvanced",
         "Le bot passe ~30% du temps malgre une main gagnante (humanisation)"),
        ("BOT-02", "Bot Medium prend des >= 55 pts",
         "Main 60 pts oros, config medium",
         "botBidAdvanced",
         "Renvoie 'oros' (au-dessus du seuil)"),
        ("BOT-03", "Bot Hard ne prend pas si surenchere risquee",
         "Adversaire deja annoncé bastos, main bot = 56 pts en copas",
         "botBidAdvanced en mode hard",
         "Passe (necessite +10 pts au-dessus du seuil = 65)"),
        ("BOT-04", "Bot Hard sort les atouts en premier (3+ atouts)",
         "Main = 4 atouts oros + 1 autre. Bot ouvre la levee.",
         "botPlayAdvanced en mode hard",
         "Joue son atout le plus fort (Valet ou 9)"),
        ("BOT-05", "Bot charge le partenaire qui gagne deja",
         "Partenaire joue Valet d'atout (gagnant assure). Bot dernier.",
         "botPlayAdvanced",
         "Joue sa carte avec le plus de POINTS (pas la plus haute) — ex: 10 ou As hors atout"),
        ("BOT-06", "Bot defausse plus basse si pas gagnable",
         "Lead=copas. Bot n'a pas de copas ni atout.",
         "botPlayAdvanced",
         "Joue sa carte ayant les MOINS de cardPoints"),
        ("BOT-07", "Card counting : bot suit les atouts vus",
         "12 atouts deja joues sur 10 (jeu de 40). Bot voit que ses 2 atouts sont les plus hauts.",
         "remainingOfSuit(state, 'oros', bot.hand)",
         "Retourne 0 cartes restantes a l'adversaire en atout"),
        ("BOT-08", "probAdversaireBeatsAtout en fin de partie",
         "Tous les atouts hauts deja joues. Bot a 7 d'atout.",
         "probAdversaireBeatsAtout(state, bot, 7)",
         "Retourne 0 (aucun atout adverse ne peut battre)"),
    ]),
    ("4. Coinche / Contree (variante avancee)", [
        ("COI-01", "evaluateContract retourne null si main < 55",
         "Main de 30 pts",
         "evaluateContract(hand, 'oros')",
         "Retourne null (pas d'annonce)"),
        ("COI-02", "evaluateContract 80 si 55 <= pts < 65",
         "Main 60 pts oros",
         "evaluateContract",
         "Retourne 80"),
        ("COI-03", "evaluateContract capot (252) si >= 200",
         "Main exceptionnelle 210 pts",
         "evaluateContract",
         "Retourne 252 (capot)"),
        ("COI-04", "Chute = adversaire prend 162 + capot=250 si capot rate",
         "contract=252, taker fait 240 pts < 252",
         "scoreRound(state)",
         "Equipe taker = 0 pts, equipe adverse = 412 pts"),
        ("COI-05", "Contree double le contrat reussi",
         "contract=100, contre=1, taker fait 110 pts",
         "scoreRound",
         "Equipe taker = 200 pts (100 x 2)"),
        ("COI-06", "Sur-contree quadruple",
         "contract=100, contre=2, taker fait 110",
         "scoreRound",
         "Equipe taker = 400 pts (100 x 4)"),
    ]),
    ("5. Ecrans mobile (challenge / profil / rewards / friends / inbox)", [
        ("UI-01", "Ecran challenge/create — toggle marche/course",
         "Ecran ouvert, type='walk' par defaut",
         "Tap sur le bouton 'Course'",
         "Le bouton 'Course' devient dore, le bouton 'Marche' redevient bleu fonce. Variable type='run'."),
        ("UI-02", "Selection distance par bouton",
         "distanceM=1000 (defaut)",
         "Tap sur '500m'",
         "distanceM=500. Texte 'Distance : 500 m'. Bouton 500m surligne bleu."),
        ("UI-03", "Permission GPS demandee au mount",
         "1ere ouverture de challenge/create.tsx",
         "useEffect declenche Location.requestForegroundPermissionsAsync",
         "Modal Android demande la permission. Si accepte, pointA est rempli avec lat/lng actuel."),
        ("UI-04", "Submit sans pointB",
         "pointA defini, pointB null",
         "Tap sur 'Envoyer le challenge'",
         "Alert 'Erreur — Choisir 2 points et un destinataire'. Pas d'appel API."),
        ("UI-05", "Submit reussi",
         "pointA, pointB, opponentId definis. Backend OK.",
         "Tap 'Envoyer'",
         "POST /api/v1/challenges/sport. 201. Alert 'Challenge envoye !'. router.back()."),
        ("UI-06", "Active : batch GPS toutes les 10s",
         "Tracking en cours, 5 points captures",
         "10 secondes ecoulees",
         "POST /api/v1/challenges/sport/{id}/track avec body={points: [5 points]}. batchRef vide."),
        ("UI-07", "Auto-detect arrivee < 30m",
         "Dernier point GPS a 25m du pointB",
         "Le subscription Location envoie le point",
         "setArrived(true). useEffect declenche POST /finish?success=true. Redirige vers /challenge/share."),
        ("UI-08", "Depassement deadline",
         "remainingS = 1",
         "Apres 1s",
         "remainingS=0. POST /finish?success=false. Alert 'Temps ecoule'. Redirige vers /challenge/history."),
        ("UI-09", "Profile edit : avatar via gallery",
         "Permission media accordee",
         "Tap sur l'avatar",
         "ImagePicker s'ouvre, crop 1:1. URI local stocke. Affichage immediat (mais pas encore upload)."),
        ("UI-10", "Profile edit : save",
         "username valide, avatar local",
         "Tap 'Sauvegarder'",
         "POST multipart /users/me/avatar. PATCH /users/me. Alert 'Profil sauvegarde'. router.back()."),
        ("UI-11", "Rewards : copier code voucher",
         "1 voucher actif avec code 'ABC123XYZ789'",
         "Tap 'Copier'",
         "Clipboard contient 'ABC123XYZ789'. Alert 'Copie'."),
        ("UI-12", "Friends : envoyer demande",
         "Username valide tape",
         "Tap '+'",
         "POST /friends. Alert 'Demande envoyee'. reload() rafraichit la liste."),
        ("UI-13", "Friends : defier un ami online",
         "Ami online=true, status='accepted'",
         "Tap 'Defier'",
         "POST /rooms avec isPrivate=true et invitedUserId. router.push('/room/lobby?code=...')."),
        ("UI-14", "Inbox : notif lue au tap",
         "Notif unread (readAt=undefined)",
         "Tap sur la notif",
         "PATCH /notifications/{id} avec {read:true}. Navigation vers la route adequate selon type."),
    ]),
    ("6. Backend (schemas + endpoints)", [
        ("API-01", "POST /challenges/sport — creation",
         "Body : {receiverId, gameType, type, distanceMeters, deadlineAt, pointA, pointB}",
         "Requete avec JWT valide",
         "201 Created. Document insere avec status='pending'. Notification 'challenge_received' creee pour receiverId."),
        ("API-02", "POST /challenges/sport/{id}/track — batch GPS",
         "Body : {points: [{lat, lng, ts, accuracyM}]}",
         "Requete avec owner du challenge",
         "200. gpsTrack.push(...points). status passe a 'in-progress' au 1er point."),
        ("API-03", "POST /challenges/sport/{id}/finish — succes",
         "Body : {success:true, durationMs:1234}",
         "Owner du challenge",
         "200. status='done'. elapsedTimeMs=durationMs. completedAt=now. Notification 'challenge_completed' au giver. +rewardPoints a l'XP."),
        ("API-04", "GET /challenges/sport/history",
         "User authentifie",
         "GET",
         "200. Tableau des challenges donnes + recus, tries par createdAt DESC. Champ 'role':'given'|'received' calcule."),
        ("API-05", "GET /rankings?period=daily",
         "User authentifie",
         "GET /rankings?period=daily&gameType=belote",
         "200. Top 100 daily du jour. Read-through cache Redis 60s."),
        ("API-06", "PATCH /users/me — bio + locale",
         "Body : {bio, locale}",
         "User authentifie",
         "200. Document users mis a jour. updatedAt = now."),
        ("API-07", "POST /users/me/avatar — multipart",
         "Multipart form avec file (jpeg/png < 5 MB)",
         "User authentifie",
         "200. Upload vers S3/CDN. Retourne {url}. PATCH automatique users.avatar=url."),
        ("API-08", "GET /notifications",
         "User authentifie",
         "GET",
         "200. Top 50 notifs DESC par sentAt. Champ 'unreadCount' dans header X-Unread."),
        ("API-09", "PATCH /notifications/{id} — read",
         "Body : {read:true}",
         "Owner",
         "200. readAt = now."),
        ("API-10", "POST /friends — demande",
         "Body : {usernameOrEmail}",
         "User authentifie",
         "201. Document insere status='pending'. Notification 'friend_request' au receiver."),
        ("API-11", "PATCH /friends/{id} — accept",
         "Body : {status:'accepted'}",
         "Receiver de la demande",
         "200. status='accepted'. acceptedAt=now."),
        ("API-12", "GET /levels/me?gameType=belote",
         "User authentifie",
         "GET",
         "200. Document level (level, xp, nextLevelXp=xpForLevel(level+1), unlockedFeatures)."),
    ]),
    ("7. Multijoueur (Socket.IO + rooms)", [
        ("SOC-01", "Creation room",
         "User 'P0' authentifie",
         "POST /rooms?gameType=belote",
         "201. roomCode unique 6 chars. Socket join automatique."),
        ("SOC-02", "Rejoindre room via code",
         "Code 'ABC123' existe, 1 joueur present",
         "POST /rooms/ABC123/join + socket.emit('room:join', {code:'ABC123'})",
         "200. socket joint le canal. Broadcast 'room:update' avec players[]=2."),
        ("SOC-03", "Lobby ready a 4 joueurs",
         "Room avec 4 joueurs",
         "Le 4e socket.emit('room:join')",
         "Server broadcast 'room:ready'. Bouton 'Lancer' actif pour owner."),
        ("SOC-04", "Start game",
         "Owner clique 'Lancer'",
         "socket.emit('game:start')",
         "Server cree etat initial, tire 5 cartes par joueur, emit 'hand:dealt' a chacun, 'phase' = 'bidding'."),
        ("SOC-05", "Phase d'enchere",
         "Phase='bidding', P0 a la main",
         "P0 socket.emit('bid', {suit:'oros'})",
         "Server valide. Broadcast 'bid:placed'. currentPlayerIndex avance."),
        ("SOC-06", "Validation server-side de carte",
         "P0 tente de jouer une carte qu'il n'a pas en main (anti-triche)",
         "socket.emit('play', {cardId:'oros-1'}) mais P0 a 'bastos-1'",
         "Server emit 'game:reject' au socket P0 + ferme la connexion (cheat detection)."),
        ("SOC-07", "Disconnect mid-game",
         "P0 quitte (connection lost)",
         "socket disconnect detecte",
         "30s grace period. Si reconnect : etat resume. Sinon bot reprend la main."),
        ("SOC-08", "Fin de manche",
         "8e levee jouee, sommes calculees",
         "Server detecte tricks.length === 8",
         "Server appelle scoreRound, broadcast 'round:end' avec scores + annonces. Persistance belote-matches."),
    ]),
    ("8. Performance & non-regression", [
        ("PERF-01", "Splash screen < 1.5s",
         "Cold start sur Galaxy A07",
         "expo run:android dev build, mesure depuis tap icone",
         "Splash visible < 1.5s. JS bundle pret < 3s."),
        ("PERF-02", "Login Google < 3s end-to-end",
         "Reseau 4G",
         "Tap Google -> picker -> POST /auth/google -> redirect tabs",
         "Latence totale < 3s p95."),
        ("PERF-03", "Bot Hard joue en < 200ms",
         "10 atouts, calcul card counting + heuristique",
         "Mesure perf.now() avant/apres botPlayAdvanced",
         "< 200ms (jamais bloquant pour l'UX)."),
        ("PERF-04", "Open cold app < 5 appels backend",
         "Cold start avec session JWT valide",
         "DevTools Network",
         "<= 5 requetes : /users/me, /challenges/daily, /leaderboard, /notifications/unread-count, /levels/me."),
        ("PERF-05", "Pas de fuite memoire en multi-partie",
         "Jouer 20 parties consecutives",
         "DevTools Memory tab",
         "Heap stable (+/- 5 MB). Pas de croissance lineaire."),
        ("PERF-06", "Reception push notif en background",
         "App en background, notif challenge_received envoyee",
         "Firebase test send",
         "Notif systeme apparait < 3s apres send. Tap ouvre l'app sur /challenge/active."),
    ]),
]


def cover():
    return [
        Spacer(1, 60 * mm),
        P("SallyCards · Belote", S_SUB),
        P("Plan de tests fonctionnels", S_TITLE),
        P("Couvre moteur, bot, annonces, Coinche, ecrans, backend, socket, performance", S_SUB),
        Spacer(1, 20 * mm), HRFlowable(width="100%", thickness=1.5, color=GOLD),
        P("Auteur : <b>%s</b>" % AUTHOR, S_BODY_C),
        P(TITLE, S_BODY_C),
        P("Date : 21 mai 2026", S_BODY_C),
        P(STATUS, S_BODY_C),
        PageBreak(),
    ]


def main():
    out = r"C:\Users\21266\Desktop\SallyCards\SallyCards-belote-tests.pdf"
    doc = SimpleDocTemplate(out, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=20*mm, bottomMargin=22*mm,
        title="Belote tests", author=AUTHOR)
    story = cover()

    # Resume
    story.append(P("Resume general", S_H1)); story.append(HR())
    total = sum(len(tests) for _, tests in TEST_GROUPS)
    rows = [["Groupe", "Tests"]]
    for name, tests in TEST_GROUPS:
        rows.append([name, str(len(tests))])
    rows.append(["TOTAL", str(total)])
    story.append(T(rows, col_widths=[130*mm, 30*mm], center_cols=(1,)))
    story.append(Spacer(1, 6))
    story.append(P("Chaque test est decrit en format <b>Given / When / Then</b> "
        "(donne en entree, action declenchee, sortie attendue). Les IDs (ENG-XX, "
        "BOT-XX, ...) servent de cle de tracking dans le futur framework de test "
        "automatise (Jest + Playwright + Detox).", S_BODY))

    # Groupes
    for name, tests in TEST_GROUPS:
        story.append(PageBreak())
        story.append(P(name, S_H1)); story.append(HR())
        rows = [["ID", "Scenario", "Given (entree)", "When (action)", "Then (sortie attendue)"]]
        for tid, scenario, given, when, then in tests:
            rows.append([tid, scenario, given, when, then])
        story.append(T(rows,
            col_widths=[15*mm, 36*mm, 38*mm, 38*mm, 47*mm],
            center_cols=(0,)))

    # Annexe : commandes de test
    story.append(PageBreak())
    story.append(P("Annexe A. Commandes pour executer les tests", S_H1)); story.append(HR())
    story.append(P("Une fois le framework de test mis en place :", S_BODY))
    cmds = [
        ("npx jest libs/game-engine --testPathPattern belote",
         "Tests ENG-* + ANN-* + BOT-* + COI-* (unit, ~80 tests)"),
        ("npx jest apps/api --testPathPattern '(challenges-sport|rewards|friends|notifications)'",
         "Tests API-* (integration backend Mongoose memory-server)"),
        ("npx detox test --configuration android.emu.debug",
         "Tests UI-* sur emulateur Android (Detox + Jest)"),
        ("k6 run scripts/load-belote-rooms.js",
         "Tests SOC-* en charge (1000 rooms simultanees)"),
        ("npx playwright test e2e/belote.spec.ts",
         "Tests end-to-end (web companion)"),
        ("npm run perf:lighthouse",
         "Tests PERF-* (Lighthouse mobile CI)"),
    ]
    rows = [["Commande", "Couvre"]]
    for c, w in cmds:
        rows.append([c, w])
    story.append(T(rows, col_widths=[95*mm, 75*mm]))

    story.append(P("Annexe B. Etat des features livrees (code+schema+API)", S_H1)); story.append(HR())
    story.append(P(
        "L'app Belote dispose maintenant d'une couche <b>complete</b> : engine "
        "avance, 6 ecrans mobiles, 6 schemas Mongoose, et les <b>6 modules "
        "NestJS</b> (controller + service + module) qui exposent les endpoints "
        "consommes par les ecrans.", S_BODY))
    added = [
        ("[OK] Engine", "apps/mobile/belote/src/game/beloteEngine.advanced.ts", "Annonces + belote + card-counting + bot 3 niveaux + scoring Coinche"),
        ("[OK] Ecran", "apps/mobile/belote/app/challenge/create.tsx", "Donner un challenge sport (walk/run, distance, deadline, GPS)"),
        ("[OK] Ecran", "apps/mobile/belote/app/challenge/active.tsx", "Challenge actif : timer + tracking GPS toutes 2s + batch 10s"),
        ("[OK] Ecran", "apps/mobile/belote/app/challenge/history.tsx", "Historique challenges donnes/recus"),
        ("[OK] Ecran", "apps/mobile/belote/app/profile/edit.tsx", "Edition profil + avatar via expo-image-picker (installe)"),
        ("[OK] Ecran", "apps/mobile/belote/app/rewards.tsx", "Bons d'achat + progression niveau XP"),
        ("[OK] Ecran", "apps/mobile/belote/app/friends.tsx", "Liste d'amis + ajout + defi prive"),
        ("[OK] Ecran", "apps/mobile/belote/app/notifications/inbox.tsx", "Inbox de notifications persistees"),
        ("[OK] Schema", "apps/api/src/modules/challenges-sport/schemas/challenge-sport.schema.ts", "Defis sport avec GPS track + status workflow"),
        ("[OK] Schema", "apps/api/src/modules/rankings-period/schemas/rankings-period.schema.ts", "Classements daily/weekly/monthly/weekend/season"),
        ("[OK] Schema", "apps/api/src/modules/rewards/schemas/rewards-voucher.schema.ts", "Bons d'achat 100 EUR + multi-provider"),
        ("[OK] Schema", "apps/api/src/modules/levels/schemas/level-progression.schema.ts", "Progression XP par-jeu + features debloquees"),
        ("[OK] Schema", "apps/api/src/modules/notifications/schemas/notification.schema.ts", "Inbox persistee avec types etendus"),
        ("[OK] Schema", "apps/api/src/modules/friends/schemas/friend.schema.ts", "Relations sociales (pending/accepted/blocked)"),
        ("[OK] Backend", "apps/api/src/modules/challenges-sport/{controller,service,module}.ts", "POST / track / finish / GET history / active — JwtAuthGuard"),
        ("[OK] Backend", "apps/api/src/modules/rankings-period/{controller,service,module}.ts", "GET :gameType + me — calcul ISO week / month / quarter, top1 multi"),
        ("[OK] Backend", "apps/api/src/modules/rewards/{controller,service,module}.ts", "GET vouchers + POST claim — generateCode aleatoire + expire cron"),
        ("[OK] Backend", "apps/api/src/modules/levels/{controller,service,module}.ts", "GET /levels/me + addXp + deblocage automatique sur 10 paliers"),
        ("[OK] Backend", "apps/api/src/modules/friends/{controller,service,module}.ts", "GET / POST / PATCH — sendRequest + respond"),
        ("[OK] Backend", "apps/api/src/modules/notifications/{controller,service,module}.ts", "GET + unread-count + PATCH read + POST read-all"),
        ("[OK] Wiring", "apps/api/src/app.module.ts (lignes 31-39 + 107-112)", "Les 6 nouveaux modules sont importes et listes dans le @Module"),
    ]
    rows = [["Statut", "Fichier", "Description"]]
    for t, f, d in added:
        rows.append([t, f, d])
    story.append(T(rows, col_widths=[22*mm, 78*mm, 70*mm], center_cols=(0,)))

    # Annexe C : commandes rebuild + rollout
    story.append(PageBreak())
    story.append(P("Annexe C. Commandes de rebuild + verification", S_H1)); story.append(HR())
    story.append(P("Apres tous les ajouts, voici la sequence complete de rebuild et test :", S_BODY))

    cmds = [
        ("# 1. Backend : rebuild + redemarrage du container API\ncd C:\\Users\\21266\\Desktop\\sdk52\\SallyCards\ndocker compose build sallycards-api\ndocker compose up -d --force-recreate sallycards-api",
         "Le backend recharge les 6 nouveaux modules NestJS. Verif via Swagger : http://localhost:3000/api/docs -> sections 'Challenges Sport', 'Rankings', 'Rewards', 'Levels', 'Friends', 'Notifications'."),
        ("# 2. Mobile Belote : install expo-image-picker (1ere fois seulement)\ncd C:\\Users\\21266\\Desktop\\sdk52\\SallyCards\\apps\\mobile\\belote\nnpx expo install expo-image-picker",
         "Ajoute la dependance manquante au package.json + installe. Necessaire pour profile/edit avatar."),
        ("# 3. Rebuild dev client Belote\ncd C:\\Users\\21266\\Desktop\\sdk52\\SallyCards\n.\\tools\\run-one.ps1 belote",
         "Reprebuild Android (incrementiel via .cxx cache), reinstall APK, demarre Metro. ~7-10 min."),
        ("# 4. Si simple reload JS (apres edition .tsx)\ncd C:\\Users\\21266\\Desktop\\sdk52\\SallyCards\\apps\\mobile\\belote\nnpx expo start --clear --dev-client",
         "Skip Gradle, juste Metro avec cache vide. Force-stop l'app sur le tel, rouvre."),
        ("# 5. Verification des endpoints (curl)\ncurl -s http://localhost:3000/api/v1/rankings/belote?period=daily | head\ncurl -s -H 'Authorization: Bearer $JWT' http://localhost:3000/api/v1/levels/me?gameType=belote",
         "Smoke test post-deploy. Doit renvoyer 200 + JSON valide. JWT obtenu via /auth/google."),
        ("# 6. Tests automatises (futurs, voir Annexe A)\nnpx jest libs/game-engine --testPathPattern belote\nnpx jest apps/api/src/modules/challenges-sport",
         "Tests ENG-* / ANN-* / BOT-* / COI-* sur l'engine + tests API-* (Mongoose memory-server)."),
    ]
    rows = [["Commande", "Effet"]]
    for c, e in cmds:
        rows.append([c, e])
    story.append(T(rows, col_widths=[85*mm, 85*mm]))

    story.append(P("Note importante", S_H3))
    story.append(P(
        "Apres rebuild du container API, redemarrer aussi <code>sallycards-socket</code> "
        "si tu modifies les rooms. Les schemas Mongoose s'auto-creent au demarrage "
        "(MongooseModule.forFeature) — aucune migration manuelle requise. Les indexes "
        "sont crees automatiquement en dev (autoIndex true) ; en prod, lancer manuellement "
        "<code>db.collection.createIndexes()</code> pour controler.", S_NOTE))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("OK", os.path.basename(out), os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
