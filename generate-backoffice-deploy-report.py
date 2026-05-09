"""
Genere le rapport PDF complet du deploiement Backoffice SallyCards
sur Hetzner Cloud + Cloudflare avec CI/CD GitHub Actions.

Couvre tout le parcours du debut (creation domaine + VPS) jusqu'au
deploiement automatique via push sur main.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Preformatted
)

styles = getSampleStyleSheet()

PRIMARY = HexColor("#F38020")  # Cloudflare orange
ACCENT = HexColor("#D50C2D")   # Hetzner red
SUCCESS = HexColor("#2DA44E")
WARN = HexColor("#D68910")
DANGER = HexColor("#C0392B")
CODE_BG = HexColor("#F6F8FA")
NOTE_BG = HexColor("#FFF8E1")

title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=22, leading=26,
    textColor=PRIMARY, spaceAfter=12, alignment=TA_CENTER)
subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=11, leading=14,
    textColor=HexColor("#555"), alignment=TA_CENTER, spaceAfter=18)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, leading=20,
    textColor=PRIMARY, spaceBefore=18, spaceAfter=10, fontName="Helvetica-Bold")
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13, leading=16,
    textColor=ACCENT, spaceBefore=12, spaceAfter=6, fontName="Helvetica-Bold")
h3 = ParagraphStyle("H3", parent=styles["Heading3"], fontSize=11, leading=14,
    textColor=PRIMARY, spaceBefore=8, spaceAfter=4, fontName="Helvetica-Bold")
body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14,
    spaceAfter=6, alignment=TA_JUSTIFY)
note_style = ParagraphStyle("Note", parent=body, backColor=NOTE_BG, borderColor=WARN,
    borderWidth=0.5, borderPadding=8, leftIndent=4, rightIndent=4)
ok_style = ParagraphStyle("OK", parent=body, backColor=HexColor("#E8F8F0"), borderColor=SUCCESS,
    borderWidth=0.5, borderPadding=8, leftIndent=4, rightIndent=4)
err_style = ParagraphStyle("Err", parent=body, backColor=HexColor("#FDEDEC"), borderColor=DANGER,
    borderWidth=0.5, borderPadding=8, leftIndent=4, rightIndent=4)
code_style = ParagraphStyle("Code", parent=styles["Code"], fontSize=8, leading=10.5,
    fontName="Courier", backColor=CODE_BG, borderColor=HexColor("#D0D7DE"),
    borderWidth=0.5, borderPadding=6, leftIndent=4, rightIndent=4, spaceAfter=8)


def code(text):
    return Preformatted(text, code_style)
def note(text):
    return Paragraph(text, note_style)
def ok(text):
    return Paragraph(text, ok_style)
def err(text):
    return Paragraph(text, err_style)


import os
os.makedirs("reports", exist_ok=True)
out = "reports/SallyCards-Backoffice-Deploy-Report.pdf"
import sys
if len(sys.argv) > 1:
    out = sys.argv[1]

doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="SallyCards Backoffice Deploy Report",
    author="SallyStar")
story = []

# ===== Cover =====
story.append(Paragraph("SallyCards Backoffice", title_style))
story.append(Paragraph("Guide de deploiement complet : Hetzner Cloud + Cloudflare + GitHub Actions",
    subtitle_style))
story.append(Spacer(1, 0.5*cm))
story.append(ok(
    "Ce rapport documente le parcours complet de mise en production de l'infrastructure "
    "back-office SallyCards : creation du domaine sur Cloudflare Registrar, provisioning "
    "du VPS Hetzner, hardening securite, installation Docker, configuration Cloudflare "
    "Tunnel, et pipeline CI/CD GitHub Actions. Chaque etape est detaillee clic par clic "
    "avec les commandes exactes."
))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Date du deploiement : 8 mai 2026", body))
story.append(Paragraph("Serveur : <b>91.99.70.43</b> (CPX22, Nuremberg)", body))
story.append(Paragraph("Repo : <b>github.com/salistar/sallycards-backoffice</b>", body))
story.append(Paragraph("Domaine : <b>salistar.com</b>", body))

# ===== Sommaire =====
story.append(PageBreak())
story.append(Paragraph("Sommaire", h1))
toc = [
    "1. Architecture de la stack",
    "2. Inventaire complet des 8 conteneurs (tous via GHA)",
    "3. URLs publiques et services exposes",
    "4. Couts et recap",
    "5. Etape 1 — Domaine Cloudflare Registrar",
    "6. Etape 2 — Provisioning VPS Hetzner",
    "7. Etape 3 — Hardening securite",
    "8. Etape 4 — Installation Docker",
    "9. Etape 5 — Cloudflare Tunnel",
    "10. Etape 6 — Repo GitHub backoffice",
    "11. Etape 7 — GitHub Actions CI/CD",
    "12. Etape 8 — Premier deploiement",
    "13. Workflow quotidien",
    "14. Backups et monitoring",
    "15. Troubleshooting et incidents",
    "16. Annexe — Fichiers du repo",
]
for item in toc:
    story.append(Paragraph(item, body))

# ===== 1. Architecture =====
story.append(PageBreak())
story.append(Paragraph("1. Architecture de la stack", h1))

story.append(Paragraph(
    "L'infrastructure suit une architecture <b>3-tier</b> classique : Cloudflare en frontal "
    "(DNS + CDN + WAF + Tunnel), Hetzner VPS comme compute, et MongoDB/Redis comme stockage. "
    "Aucun port HTTP/HTTPS n'est expose sur le VPS — tout passe par Cloudflare Tunnel.",
    body))

story.append(Spacer(1, 0.2*cm))
story.append(code("""
                            Internet
                               |
                               v
                  +------------------------+
                  |   Cloudflare           |
                  |   - DNS                |
                  |   - CDN cache          |
                  |   - WAF + DDoS         |
                  |   - SSL/TLS auto       |
                  +-----------+------------+
                              | Cloudflare Tunnel
                              | (outbound only,
                              |  no public ports
                              |  on VPS!)
                              v
                +-----------------------------+
                | Hetzner CPX22 - Nuremberg   |
                | IP 91.99.70.43              |
                +-----------------------------+
                | cloudflared (systemd)       |
                |  +-> api.salistar.com :3000 |
                |  +-> ws.salistar.com  :3001 |
                |  +-> sallycards...    :4000 |
                +-----------------------------+
                | Docker Compose stack:       |
                |  - sallycards-api    (Nest) |
                |  - sallycards-socket (IO)   |
                |  - sallycards-web    (Next) |
                |  - sallycards-mongo  (DB)   |
                |  - sallycards-redis  (cache)|
                +-----------------------------+
"""))

story.append(Paragraph("Pourquoi cette architecture ?", h2))
arch_choices = [
    ("<b>Cloudflare Tunnel vs IP publique exposee</b>",
     "Aucun port 80/443 ouvert sur le VPS = pas de surface d'attaque directe. "
     "Cloudflare WAF filtre 99% du trafic malicieux avant qu'il n'atteigne le serveur. "
     "Bonus : pas besoin de Let's Encrypt, le SSL est gere par Cloudflare."),
    ("<b>Hetzner vs AWS/GCP/Azure</b>",
     "10x moins cher pour des perfs equivalentes (€7.99/mois CPX22 vs ~$80/mois t3.medium AWS). "
     "Pas de cout reseau (20 TB inclus). Datacenter en Europe = RGPD-friendly."),
    ("<b>Single VPS vs Kubernetes</b>",
     "Pour < 10k users actifs, un seul VPS bien dimensionne suffit largement. "
     "Pas de complexite operationnelle, redemarrages de 30 sec, debug facile."),
    ("<b>Docker Compose vs Docker Swarm/K8s</b>",
     "Stack predefinie dans <i>docker-compose.yml</i>, deja maitrisee en local. "
     "Migrations vers Swarm/K8s plus tard si besoin de multi-node."),
    ("<b>ghcr.io vs Docker Hub</b>",
     "Gratuit illimite pour repos publics, integration native avec GitHub Actions, "
     "pas de pull rate limit comme Docker Hub free tier."),
]
for title, desc in arch_choices:
    story.append(Paragraph(title, body))
    story.append(Paragraph(desc, body))
    story.append(Spacer(1, 0.1*cm))

# ===== 2. Inventaire des 5 conteneurs =====
story.append(PageBreak())
story.append(Paragraph("2. Inventaire complet des 8 conteneurs (tous via GHA)", h1))

story.append(Paragraph(
    "Chaque conteneur de la stack passe par le pipeline GitHub Actions, soit en "
    "<b>build</b> (api, socket, web : Dockerfiles construits sur les runners GHA et "
    "pushes sur ghcr.io), soit en <b>pull</b> (mongo, redis : images officielles "
    "Docker Hub recuperees par le job deploy lors du <i>docker compose pull</i>).",
    body))

story.append(Spacer(1, 0.2*cm))

containers_data = [
    ["#", "Container", "Image / Source", "Port int.", "Pipeline GHA", "URL"],
    ["1", "sallycards-api",       "ghcr.io/.../sallycards-api:latest",        "3000",  "build + push",  "api.salistar.com"],
    ["2", "sallycards-socket",    "ghcr.io/.../sallycards-socket:latest",     "3001",  "build + push",  "ws.salistar.com"],
    ["3", "sallycards-web",       "ghcr.io/.../sallycards-web:latest",        "3000",  "build + push",  "sallycards.salistar.com"],
    ["4", "sallycards-mongo",     "mongo:7.0",                                  "27017", "pull",          "(interne)"],
    ["5", "sallycards-redis",     "redis:7.2-alpine",                           "6379",  "pull",          "(interne)"],
    ["6", "mongo-express",        "mongo-express:1.0\nadmin UI + basic auth",  "8081",  "pull",          "mongo.salistar.com"],
    ["7", "redis-commander",      "rediscommander/redis-commander",            "8081",  "pull",          "(interne reseau Docker)"],
    ["8", "redis-auth-proxy",     "ghcr.io/.../sallycards-redis-auth-proxy\nnginx + basic auth", "80", "build + push", "redis.salistar.com"],
]
t = Table(containers_data, colWidths=[0.6*cm, 3*cm, 4.8*cm, 1.4*cm, 3.2*cm, 3*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (1,1), (1,-1), "Courier-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 4),
    ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Conteneurs explicitement exclus de la prod :", h3))

exclus = [
    ["Container", "Image", "Raison de l'exclusion"],
    ["sallycards-nginx", "nginx:1.27-alpine", "Remplace par Cloudflare Tunnel - aucun port 80/443 expose sur le VPS"],
    ["sallycards-turn",  "coturn/coturn:4.6", "TURN/STUN deploye separement sur un autre VPS dedie WebRTC"],
]
t = Table(exclus, colWidths=[3.5*cm, 3.8*cm, 8.7*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), DANGER),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("FONTNAME", (1,1), (1,-1), "Courier"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#FDEDEC")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(ok(
    "<b>Verification</b> : sur le VPS, <code>docker compose ps</code> doit montrer "
    "<b>exactement 8 containers</b> tous en statut <i>Up (healthy)</i>. Si un container "
    "manque, le pipeline GHA le redemarrera automatiquement au prochain push, ou via "
    "<i>docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d</i>."
))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Acces admin DB (interfaces web protegees) :", h3))
admin_data = [
    ["URL", "Outil", "Auth"],
    ["https://mongo.salistar.com", "mongo-express - explorer/editer MongoDB", "Basic Auth (admin + password)"],
    ["https://redis.salistar.com", "redis-commander - explorer/editer Redis", "Basic Auth (admin + password)"],
]
t = Table(admin_data, colWidths=[5.2*cm, 6.8*cm, 4.0*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ACCENT),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.2*cm))
story.append(note(
    "<b>Recuperer les credentials admin</b> :<br/>"
    "<code>ssh deploy@91.99.70.43 'grep -E \"(MONGO_EXPRESS|REDIS_COMMANDER)_(USER|PASSWORD)\" "
    "~/apps/sallycards-backoffice/.env.production'</code>"
))

# ===== 3. URLs publiques =====
story.append(PageBreak())
story.append(Paragraph("3. URLs publiques et services exposes", h1))

urls_data = [
    ["Service", "URL", "Container interne", "Port"],
    ["API REST", "https://api.salistar.com/api/v1", "sallycards-api", "3000"],
    ["WebSocket", "https://ws.salistar.com", "sallycards-socket", "3001"],
    ["Web app", "https://sallycards.salistar.com", "sallycards-web", "4000"],
    ["Landing", "https://salistar.com", "sallycards-web", "4000"],
    ["MongoDB admin", "https://mongo.salistar.com", "mongo-express (basic auth)", "8083"],
    ["Redis admin", "https://redis.salistar.com", "redis-commander (basic auth)", "8082"],
    ["TURN/STUN", "turn.salistar.com", "(serveur separe)", "3478"],
]
t = Table(urls_data, colWidths=[2.6*cm, 6.2*cm, 5.4*cm, 1.6*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Endpoints critiques pour les apps mobiles :", h3))
story.append(code("""
// Dans chaque app sally-* :
const API_URL    = 'https://api.salistar.com/api/v1';
const SOCKET_URL = 'https://ws.salistar.com';

// Health checks (pour UptimeRobot) :
GET https://api.salistar.com/api/v1/health  -> 200 OK
GET https://ws.salistar.com/health          -> 200 OK
GET https://sallycards.salistar.com         -> 200 OK
"""))

# ===== 3. Couts =====
story.append(PageBreak())
story.append(Paragraph("3. Couts mensuels detailles", h1))

cost_data = [
    ["Poste", "Provider", "Mensuel", "Annuel"],
    ["VPS CPX22 (2 vCPU, 4 GB, 80 GB SSD)", "Hetzner", "€7.99", "€95.88"],
    ["Backups quotidiens (rotation 7 jours)", "Hetzner +20%", "€1.60", "€19.20"],
    ["Trafic reseau (20 TB inclus)", "Hetzner", "€0", "€0"],
    ["IP publique IPv4 + IPv6", "Hetzner", "€0", "€0"],
    ["Domaine salistar.com (at-cost)", "Cloudflare Registrar", "€0.75", "~€9"],
    ["DNS, CDN, Tunnel, WAF, SSL", "Cloudflare Free", "€0", "€0"],
    ["GitHub Actions (2000 min/mois)", "GitHub Free", "€0", "€0"],
    ["Container Registry (ghcr.io)", "GitHub Free", "€0", "€0"],
    ["UptimeRobot monitoring", "Free", "€0", "€0"],
    ["", "", "", ""],
    ["TOTAL", "", "€10.34", "€124"],
]
t = Table(cost_data, colWidths=[7*cm, 4*cm, 2.5*cm, 2.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,-1), (-1,-1), "Helvetica-Bold"),
    ("BACKGROUND", (0,-1), (-1,-1), HexColor("#E8F8F0")),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-2), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-2), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(ok(
    "<b>Comparaison reference</b> : un setup equivalent sur AWS coute environ "
    "$80-150/mois (t3.medium + RDS + ElastiCache + Route53 + bandwidth). "
    "Ici on est 10x moins cher pour les memes performances."
))

# ===== 4. Etape 1 : Domaine =====
story.append(PageBreak())
story.append(Paragraph("4. Etape 1 — Domaine Cloudflare Registrar", h1))

story.append(Paragraph(
    "Cloudflare est le registrar le moins cher du marche : ils refacturent le prix "
    "ICANN <b>at-cost</b> (sans markup). Un .com coute ~$9.77/an chez eux contre $15-20 "
    "chez OVH/GoDaddy.",
    body))

story.append(Paragraph("4.1 Compte Cloudflare", h2))
story.append(Paragraph("1. Aller sur https://dash.cloudflare.com et creer un compte", body))
story.append(Paragraph("2. <b>Activer 2FA</b> (obligatoire pour Registrar)", body))
story.append(Paragraph("3. Verifier l'email", body))

story.append(Paragraph("4.2 Acheter le domaine", h2))
story.append(Paragraph("Menu lateral -> <b>Domain Registration -> Register</b>", body))
story.append(Paragraph("Recherche : <code>salistar.com</code>", body))
story.append(Paragraph("Si libre -> <b>Register</b>, ajouter au panier, payer (~$9.77/an)", body))
story.append(Paragraph(
    "Si deja chez OVH/autre -> <b>Transfer Domains</b>, deverrouiller chez l'ancien "
    "registrar, recuperer le code AUTH, lancer le transfert (~7 jours, prix at-cost).",
    body))

story.append(Paragraph("4.3 Validation", h2))
story.append(ok(
    "Une fois le domaine achete/transfere, il apparait dans la liste des sites Cloudflare. "
    "Les nameservers sont automatiquement configures pour pointer vers Cloudflare. "
    "Le DNS sera configure plus tard automatiquement par cloudflared."
))

# ===== 5. Etape 2 : VPS Hetzner =====
story.append(PageBreak())
story.append(Paragraph("5. Etape 2 — Provisioning VPS Hetzner", h1))

story.append(Paragraph("5.1 Compte et clef SSH", h2))
story.append(Paragraph(
    "1. Compte sur https://accounts.hetzner.com (verification SMS + carte bancaire)",
    body))
story.append(Paragraph(
    "2. Console : https://console.hetzner.cloud (URL differente du compte)",
    body))
story.append(Paragraph(
    "3. Generer une clef SSH locale si pas deja faite :",
    body))
story.append(code("""# Sur PC Windows (PowerShell) :
ssh-keygen -t ed25519 -C "salistar"
# 3x Entree (pas de passphrase pour simplifier)

# Afficher la clef PUBLIQUE (a coller dans Hetzner) :
cat $env:USERPROFILE\\.ssh\\id_ed25519.pub
# -> ssh-ed25519 AAAA... salistar"""))

story.append(err(
    "<b>JAMAIS partager le fichier <i>id_ed25519</i> (sans .pub) !</b> "
    "C'est la clef privee, equivalent du mot de passe. Seul <i>id_ed25519.pub</i> "
    "est partageable."
))

story.append(Paragraph("5.2 Creation du serveur (clic par clic)", h2))
steps_vps = [
    ("Add SSH Key", "Coller le contenu de id_ed25519.pub, nom 'salistar-pc'"),
    ("Create Resource", "Bouton violet/rouge en haut a droite -> Servers"),
    ("Location", "Falkenstein ou Nuremberg (Europe = latence basse)"),
    ("Image", "OS Images -> Ubuntu 24.04"),
    ("Type", "Shared Resources -> x86 -> CPX22 (€7.99/mo)"),
    ("Networking", "Public IPv4 + IPv6 (defaults)"),
    ("SSH Keys", "Cocher la clef ajoutee"),
    ("Backups", "ACTIVER (toggle) -> +20% = €1.60/mo additional"),
    ("Name", "sallycards-prod"),
    ("Create & Buy now", "Bouton final, attente ~30 sec"),
]
data = [["Section", "Action"]] + [[s, a] for s, a in steps_vps]
t = Table(data, colWidths=[4*cm, 12*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ACCENT),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(ok(
    "Serveur cree : <b>sallycards-prod</b> | IP : <b>91.99.70.43</b> | "
    "Statut : Running. Test : <code>ssh root@91.99.70.43</code>"
))

# ===== 6. Etape 3 : Hardening =====
story.append(PageBreak())
story.append(Paragraph("6. Etape 3 — Hardening securite", h1))

story.append(Paragraph(
    "Le serveur fraichement cree est accessible uniquement par root. On applique le "
    "hardening standard :",
    body))

hardening = [
    "Update systeme + patches securite",
    "Creer user 'deploy' non-root, sans password (clef SSH only)",
    "Sudo NOPASSWD pour 'deploy' (necessaire pour deploiements GHA)",
    "Desactiver root SSH login + password authentication",
    "Configurer UFW (port 22 only, le reste bloque)",
    "Installer fail2ban (anti brute-force SSH)",
    "Activer unattended-upgrades (patches secu auto chaque jour)",
]
for h in hardening:
    story.append(Paragraph(f"  • {h}", body))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Commande unique :", h3))
story.append(code("""
# En tant que root sur le VPS
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
apt install -y ufw fail2ban unattended-upgrades
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw --force enable
systemctl enable --now fail2ban
"""))

story.append(note(
    "<b>Bug rencontre lors du deploiement</b> : <code>systemctl reload ssh</code> a "
    "echoue car Ubuntu 24.04 utilise <i>socket activation</i>. Correctif : utiliser "
    "<code>systemctl restart ssh</code> a la place. C'est ce qui est dans la commande "
    "ci-dessus."
))

# ===== 7. Etape 4 : Docker =====
story.append(PageBreak())
story.append(Paragraph("7. Etape 4 — Installation Docker", h1))

story.append(Paragraph(
    "Docker CE installe via le script officiel <i>get.docker.com</i>. "
    "L'utilisateur <b>deploy</b> est ajoute au groupe <i>docker</i> pour pouvoir "
    "lancer des containers sans sudo.",
    body))

story.append(code("""
# En tant que 'deploy' sur le VPS
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
sudo systemctl enable --now docker

# Deconnecter / reconnecter pour appliquer le groupe :
exit
ssh deploy@91.99.70.43

# Test :
docker --version
docker compose version
docker run --rm hello-world
"""))

story.append(ok(
    "Versions installees : Docker 29.4.3 + Compose v5.1.3. "
    "Test <i>hello-world</i> reussit -> Docker fonctionne correctement."
))

# ===== 8. Etape 5 : Cloudflare Tunnel =====
story.append(PageBreak())
story.append(Paragraph("8. Etape 5 — Cloudflare Tunnel", h1))

story.append(Paragraph(
    "Cloudflare Tunnel cree une connexion <b>sortante</b> du VPS vers Cloudflare, "
    "ce qui permet d'exposer des services HTTP <b>sans ouvrir de port</b> sur le VPS. "
    "Avantages : pas de NAT/firewall a gerer, SSL automatique, IP du VPS jamais "
    "exposee a Internet.",
    body))

story.append(Paragraph("8.1 Installation", h2))
story.append(code("""
# Sur le VPS en tant que 'deploy'
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Login (ouvre une URL dans le navigateur, selectionner salistar.com)
cloudflared tunnel login

# Creer le tunnel
cloudflared tunnel create sallycards-prod
# -> retourne un UUID, ex: a1b2c3d4-...
"""))

story.append(Paragraph("8.2 Configuration ingress", h2))
story.append(code("""
# Fichier de routing : ~/.cloudflared/config.yml
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: sallycards-prod
credentials-file: /home/deploy/.cloudflared/<UUID>.json

ingress:
  - hostname: api.salistar.com
    service: http://localhost:3000
  - hostname: ws.salistar.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - hostname: sallycards.salistar.com
    service: http://localhost:4000
  - hostname: salistar.com
    service: http://localhost:4000
  - service: http_status:404
EOF
"""))

story.append(Paragraph("8.3 DNS records (auto-genere)", h2))
story.append(code("""
cloudflared tunnel route dns sallycards-prod api.salistar.com
cloudflared tunnel route dns sallycards-prod ws.salistar.com
cloudflared tunnel route dns sallycards-prod sallycards.salistar.com
cloudflared tunnel route dns sallycards-prod salistar.com
"""))

story.append(Paragraph("8.4 Service systemd (auto-start au boot)", h2))
story.append(code("""
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
"""))

story.append(ok(
    "Apres ces commandes, tous les domaines pointent vers le VPS via Cloudflare Tunnel. "
    "HTTPS automatique, certificats geres par Cloudflare, DDoS protection active."
))

# ===== 9. Etape 6 : Repo GitHub =====
story.append(PageBreak())
story.append(Paragraph("9. Etape 6 — Repo GitHub backoffice", h1))

story.append(Paragraph("9.1 Creer le repo", h2))
story.append(Paragraph(
    "Aller sur https://github.com/new -> Owner: <b>salistar</b>, Name: "
    "<b>sallycards-backoffice</b>, Visibility: au choix (public = ghcr.io gratuit).",
    body))

story.append(Paragraph("9.2 Pousser le code (depuis le PC local)", h2))
story.append(code("""
cd C:\\Users\\21266\\Desktop\\sdk52\\SallyCards

# .gitignore-backoffice exclut apps/mobile/ et apps-deploy/ (deja deployes ailleurs)
# Le repo backoffice contient uniquement : api, socket-server, web, libs, docker

# Init git si pas deja fait
git init -b main
git add apps/api apps/web apps/socket-server libs docker docker-compose.yml \\
        docker-compose.prod.yml .github/workflows/deploy-prod.yml \\
        .env.production.example BACKOFFICE-DEPLOY.md package.json package-lock.json \\
        nx.json tsconfig.base.json tsconfig.json
git commit -m "feat: initial backoffice deployment setup"

# Connecter au repo distant
git remote add origin https://github.com/salistar/sallycards-backoffice.git
git push -u origin main
"""))

story.append(Paragraph("9.3 Cloner le repo sur le VPS", h2))
story.append(code("""
ssh deploy@91.99.70.43

# Generer une clef SSH dediee pour GitHub deploy
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
# -> copier cette clef dans GitHub : repo Settings > Deploy keys (read-only)

# Config SSH client
cat >> ~/.ssh/config <<EOF
Host github.com
  IdentityFile ~/.ssh/github_deploy
EOF
chmod 600 ~/.ssh/config

# Cloner
mkdir -p ~/apps && cd ~/apps
git clone git@github.com:salistar/sallycards-backoffice.git
cd sallycards-backoffice
"""))

story.append(Paragraph("9.4 Setup .env.production sur le VPS", h2))
story.append(code("""
# Generer des secrets robustes
JWT=$(openssl rand -hex 64)
JWT_REFRESH=$(openssl rand -hex 64)
MONGO_PWD=$(openssl rand -hex 32)

# Copier le template puis editer avec les vraies valeurs
cp .env.production.example .env.production
nano .env.production
# -> remplacer JWT_SECRET, JWT_REFRESH_SECRET, MONGO_PASSWORD

chmod 600 .env.production
"""))

# ===== 10. Etape 7 : GHA =====
story.append(PageBreak())
story.append(Paragraph("10. Etape 7 — GitHub Actions CI/CD", h1))

story.append(Paragraph("10.1 Workflow deploy-prod.yml", h2))
story.append(Paragraph(
    "Le fichier <code>.github/workflows/deploy-prod.yml</code> definit la pipeline. "
    "3 jobs s'executent en parallele puis sequentiellement :",
    body))

pipeline_steps = [
    ("1. build (parallele)", "Build des 3 images Docker (api, socket, web). "
     "Cache GitHub Actions pour acceleration. Push vers ghcr.io."),
    ("2. deploy (sequentiel)", "SSH vers le VPS, git pull, docker compose pull + up -d, "
     "docker image prune."),
    ("3. cloudflare-purge", "Purge le cache Cloudflare via API (1 ligne curl)."),
    ("4. health-check", "Curl sur les 3 endpoints publics pour valider le deploiement."),
]
for s, d in pipeline_steps:
    story.append(Paragraph(f"<b>{s}</b> : {d}", body))

story.append(Paragraph("10.2 Secrets GitHub Actions", h2))
story.append(Paragraph(
    "Aller dans le repo : Settings -> Secrets and variables -> Actions -> "
    "<b>New repository secret</b> :",
    body))

secrets_data = [
    ["Secret", "Valeur", "Comment l'obtenir"],
    ["VPS_HOST", "91.99.70.43", "IP du VPS Hetzner"],
    ["VPS_USER", "deploy", "User cree a l'etape 3"],
    ["VPS_SSH_KEY", "(contenu cle privee)", "cat ~/.ssh/id_ed25519 (sur PC)"],
    ["GHCR_PAT", "ghp_xxx...", "GitHub > Settings > Developer settings > Personal Access Tokens > scope read:packages"],
    ["CF_ZONE_ID", "(32 chars hex)", "Cloudflare > salistar.com > Overview (panneau droit)"],
    ["CF_API_TOKEN", "(token)", "Cloudflare > My Profile > API Tokens > Create Token > Zone:Cache Purge"],
]
t = Table(secrets_data, colWidths=[3*cm, 4*cm, 9*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

# ===== 11. Premier deploiement =====
story.append(PageBreak())
story.append(Paragraph("11. Etape 8 — Premier deploiement", h1))

story.append(Paragraph("11.1 Trigger manuel via push main", h2))
story.append(code("""
# Sur le PC local, premier push pour declencher la pipeline
git add .
git commit -m "feat: enable production deployment"
git push origin main

# Suivre le run sur :
# https://github.com/salistar/sallycards-backoffice/actions
"""))

story.append(Paragraph("11.2 Verifier le deploiement", h2))
story.append(code("""
# Sur le VPS
ssh deploy@91.99.70.43
cd ~/apps/sallycards-backoffice
docker compose ps

# Doit montrer 5 containers UP :
#   sallycards-api      Up (healthy)
#   sallycards-socket   Up (healthy)
#   sallycards-web      Up
#   sallycards-mongo    Up (healthy)
#   sallycards-redis    Up (healthy)

# Logs en cas de probleme
docker compose logs -f --tail 100 sallycards-api
"""))

story.append(Paragraph("11.3 Tests publics", h2))
story.append(code("""
# Depuis n'importe ou sur Internet
curl https://api.salistar.com/api/v1/health
curl https://ws.salistar.com/health
curl -I https://sallycards.salistar.com
"""))

story.append(ok(
    "Si les 3 curls repondent <b>200 OK</b> -> deploiement reussi. "
    "Le pipeline complet prend ~3-5 min (build) + ~10 sec (deploy)."
))

# ===== 12. Workflow quotidien =====
story.append(PageBreak())
story.append(Paragraph("12. Workflow quotidien developpeur", h1))

story.append(code("""
# 1. Creer une branche feature
git checkout -b feature/add-ranking-api

# 2. Coder
# ... edit files ...

# 3. Test local
docker compose up -d
# tester sur localhost:3000, :3001, :4000

# 4. Commit + push
git add .
git commit -m "feat(api): ranking endpoint"
git push origin feature/add-ranking-api

# 5. Pull request sur GitHub
gh pr create --base main --title "feat: ranking API"

# 6. Review + merge dans main
# -> declenche automatiquement le deploiement prod !

# 7. Verifier ~5 min plus tard
curl https://api.salistar.com/api/v1/ranking
"""))

story.append(Paragraph("12.1 Rollback rapide (si bug en prod)", h2))
story.append(code("""
# Option A : revert le commit
git revert <bad-sha>
git push origin main
# -> nouveau deploiement avec l'ancien code

# Option B : redeployer une image precedente
ssh deploy@91.99.70.43
cd ~/apps/sallycards-backoffice
# Editer docker-compose.prod.yml : changer ":latest" en ":<sha-precedent>"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
"""))

# ===== 13. Backups + Monitoring =====
story.append(PageBreak())
story.append(Paragraph("13. Backups et monitoring", h1))

story.append(Paragraph("13.1 Backups MongoDB automatiques", h2))
story.append(code("""
# Sur le VPS, creer le script
cat > ~/backup-mongo.sh <<'EOF'
#!/bin/bash
set -e
DATE=$(date +%Y-%m-%d)
docker exec sallycards-mongo mongodump --archive --gzip \\
  -u sallycards -p "$MONGO_PASSWORD" --authenticationDatabase admin \\
  > ~/backups/mongo-$DATE.gz
find ~/backups -name "mongo-*.gz" -mtime +14 -delete
EOF
chmod +x ~/backup-mongo.sh
mkdir -p ~/backups

# Cron 3h du matin
(crontab -l 2>/dev/null; echo "0 3 * * * source ~/apps/sallycards-backoffice/.env.production && ~/backup-mongo.sh") | crontab -
"""))

story.append(Paragraph("13.2 Sync vers Cloudflare R2 (optionnel, off-site)", h2))
story.append(code("""
sudo apt install -y rclone
rclone config  # configurer un remote 'r2' avec les credentials Cloudflare

# Ajouter au cron quotidien
echo "30 3 * * * rclone sync ~/backups r2:sallycards-backups" | crontab -
"""))

story.append(Paragraph("13.3 Monitoring uptime", h2))
story.append(Paragraph(
    "<b>UptimeRobot</b> (50 monitors gratuits) - https://uptimerobot.com :",
    body))
monitors = [
    "https://api.salistar.com/api/v1/health (HTTPS, every 5 min)",
    "https://ws.salistar.com/health (HTTPS, every 5 min)",
    "https://sallycards.salistar.com (HTTPS, every 5 min)",
    "91.99.70.43 (Ping, every 1 min) — check VPS up",
]
for m in monitors:
    story.append(Paragraph(f"  • {m}", body))

story.append(Paragraph("13.4 Logs centralises", h2))
story.append(code("""
# Logs Docker
docker compose logs -f --tail 100 sallycards-api
docker compose logs -f --tail 100 sallycards-socket

# Logs systeme
journalctl -u docker -f
journalctl -u cloudflared -f
journalctl -u fail2ban -f

# Logs auth (qui essaie de se connecter ?)
sudo tail -f /var/log/auth.log
sudo fail2ban-client status sshd  # IPs banies
"""))

# ===== 14. Troubleshooting =====
story.append(PageBreak())
story.append(Paragraph("14. Troubleshooting et incidents", h1))

troubleshoot = [
    ("Pipeline GHA en erreur sur 'docker login ghcr.io'",
     "Le secret GHCR_PAT n'a pas le scope read:packages. "
     "Regenerer le PAT sur GitHub > Developer settings."),
    ("'connection refused' sur api.salistar.com",
     "Cloudflared tunnel down. Verifier : "
     "<code>sudo systemctl status cloudflared</code>. "
     "Restart : <code>sudo systemctl restart cloudflared</code>."),
    ("API repond 500 'MongoDB connection failed'",
     "Mongo container down ou credentials .env.production incorrects. "
     "<code>docker compose ps</code> + <code>docker compose logs sallycards-mongo</code>."),
    ("'Permission denied (publickey)' sur SSH deploy",
     "Verifier que la clef publique du PC est bien dans /home/deploy/.ssh/authorized_keys. "
     "Si modifie root SSH par erreur : utiliser la console rescue Hetzner."),
    ("Build Docker echoue sur 'package.json not found'",
     "Le repo manque les fichiers libs/ ou package.json. "
     "Verifier <code>git status</code> en local + ce qui est commit."),
    ("VPS plein (disk full)",
     "<code>docker system prune -af --volumes</code> "
     "+ <code>du -sh ~/.gh-artifacts ~/backups</code> pour identifier le coupable."),
    ("Pic de trafic 5xx",
     "Cloudflare Analytics : verifier si DDoS. Activer 'Under Attack mode' "
     "sur le dashboard Cloudflare en cas d'urgence."),
]
data = [["Symptome", "Cause + fix"]] + [[s, c] for s, c in troubleshoot]
t = Table(data, colWidths=[5.5*cm, 10.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), DANGER),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#FDEDEC")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

# ===== 15. Annexe fichiers =====
story.append(PageBreak())
story.append(Paragraph("15. Annexe — Fichiers du repo", h1))

files_data = [
    ["Fichier", "Role"],
    ["docker-compose.yml", "Stack base : 5 services + reseaux + volumes"],
    ["docker-compose.prod.yml", "Overrides prod : ghcr.io images, no public ports, log rotation"],
    ["docker/api.Dockerfile", "Build NestJS API multi-stage"],
    ["docker/socket.Dockerfile", "Build Socket.IO server multi-stage"],
    ["docker/web.Dockerfile", "Build Next.js standalone multi-stage"],
    [".github/workflows/deploy-prod.yml", "Pipeline CI/CD : build 3 images + deploy SSH + Cloudflare purge + health check"],
    [".env.production.example", "Template des variables (a copier en .env.production sur VPS)"],
    [".gitignore-backoffice", "Exclut apps/mobile, apps-deploy, .env.*"],
    ["BACKOFFICE-DEPLOY.md", "Resume du setup pour developpeurs"],
    ["package.json", "Workspaces npm : apps/* + libs/*"],
    ["nx.json", "Config monorepo Nx"],
]
t = Table(files_data, colWidths=[6.5*cm, 9.5*cm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#999")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, HexColor("#F6F8FA")]),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t)

story.append(Spacer(1, 0.3*cm))
story.append(ok(
    "<b>Done.</b> Pour deployer une nouvelle version : <code>git push origin main</code> "
    "depuis ton PC. La pipeline GHA build, push, deploy, purge cache, et health check "
    "automatiquement en ~5 min."
))

# ===== Build PDF =====
doc.build(story)

import os
size = os.path.getsize(out) / 1024
print(f"PDF generated: {out}")
print(f"Size: {size:.1f} KB")
