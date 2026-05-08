# SallyCards Backoffice

Stack back-office pour SallyCards : 11 jeux de cartes mobiles (Belote, Concentration, Kant Copy, Kdoub, Okey, Poker, Qui Est-Ce ?, Ronda, Scopa, Solitaire, Tarot).

[![Deploy Status](https://github.com/salistar/sallycards-backoffice/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/salistar/sallycards-backoffice/actions/workflows/deploy-prod.yml)

## Stack

| Composant | Tech | Port interne | URL publique |
|---|---|---|---|
| API REST | NestJS 11 + MongoDB + JWT | 3000 | https://api.salistar.com/api/v1 |
| WebSocket | NestJS + Socket.IO + Redis adapter | 3001 | https://ws.salistar.com |
| Web | Next.js 15 + React 19 + Tailwind 4 | 4000 | https://sallycards.salistar.com |
| Database | MongoDB 7 | 27017 | (interne) |
| Cache + PubSub | Redis 7 | 6379 | (interne) |

## Infrastructure

- **VPS** : Hetzner CPX22 (Nuremberg) — 2 vCPU, 4 GB, 80 GB SSD — €7.99/mois
- **Domain** : Cloudflare Registrar `salistar.com` — at-cost ~€9/an
- **CDN/WAF/SSL** : Cloudflare (gratuit)
- **Tunnel** : Cloudflare Tunnel (zéro port exposé sur le VPS)
- **CI/CD** : GitHub Actions + ghcr.io (gratuit)
- **Total** : ~€10/mois tout compris

## URLs publiques

| Service | URL |
|---|---|
| API REST | https://api.salistar.com/api/v1 |
| WebSocket | https://ws.salistar.com |
| Web app | https://sallycards.salistar.com |
| Backoffice | https://backoffice.salistar.com |
| Landing | https://salistar.com |
| TURN/STUN | turn.salistar.com |

## Architecture

```
                   Internet
                      │
                      ▼
         ┌────────────────────────┐
         │ Cloudflare             │
         │  - DNS, CDN, WAF       │
         │  - SSL/TLS auto        │
         └──────────┬─────────────┘
                    │ Cloudflare Tunnel
                    │ (outbound only)
                    ▼
       ┌──────────────────────────┐
       │ Hetzner CPX22 - DE       │
       │  IP 91.99.70.43          │
       ├──────────────────────────┤
       │ cloudflared (systemd)    │
       │  → :3000 api             │
       │  → :3001 ws              │
       │  → :4000 web             │
       ├──────────────────────────┤
       │ Docker Compose stack:    │
       │  - sallycards-api        │
       │  - sallycards-socket     │
       │  - sallycards-web        │
       │  - sallycards-mongo      │
       │  - sallycards-redis      │
       └──────────────────────────┘
```

## Pipeline CI/CD

```
git push origin main
   │
   ▼ (.github/workflows/deploy-prod.yml)
┌──────────────────────────────────────┐
│ GitHub Actions                       │
├──────────────────────────────────────┤
│ Job 1: build (matrix: api/socket/web)│
│   - Docker buildx avec cache GHA     │
│   - Push vers ghcr.io                │
├──────────────────────────────────────┤
│ Job 2: deploy                        │
│   - SSH vers VPS                     │
│   - docker compose pull && up -d     │
│   - docker image prune               │
├──────────────────────────────────────┤
│ Job 3: cloudflare-purge              │
│   - curl POST /purge_cache           │
├──────────────────────────────────────┤
│ Job 4: health-check                  │
│   - curl api / ws / web              │
└──────────────────────────────────────┘
   │
   ▼ ~5 min après le push
✅ Live en production
```

## Développement local

### Prérequis

- Node 20+
- Docker Desktop ou Docker Engine
- npm 10+

### Setup

```bash
git clone https://github.com/salistar/sallycards-backoffice.git
cd sallycards-backoffice
npm install

# Lancer la stack complète localement
docker compose up -d

# OU lancer chaque service individuellement
npm run dev:api      # http://localhost:3000
npm run dev:socket   # http://localhost:3001
npm run dev:web      # http://localhost:4000
```

### Tests

```bash
npm test                 # tous les tests
npm run lint             # lint + format check
```

## Déploiement

Le déploiement est **automatique** à chaque push sur `main`. La pipeline GitHub Actions :

1. Build 3 images Docker (api, socket, web) en parallèle
2. Push vers `ghcr.io/salistar/sallycards-{api,socket,web}`
3. SSH sur le VPS Hetzner → `docker compose pull && up -d`
4. Purge cache Cloudflare
5. Health check sur les 3 endpoints publics

Documentation détaillée :
- 📄 [reports/SallyCards-Backoffice-Deploy-Report.pdf](reports/SallyCards-Backoffice-Deploy-Report.pdf) — Guide complet 15 sections
- 📝 [BACKOFFICE-DEPLOY.md](BACKOFFICE-DEPLOY.md) — Résumé pour développeurs

## Secrets requis (GitHub Actions)

Repo → Settings → Secrets and variables → Actions :

| Secret | Source |
|---|---|
| `VPS_HOST` | IP du VPS (`91.99.70.43`) |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Clé privée SSH du compte deploy |
| `GHCR_PAT` | GitHub PAT scope `read:packages` + `write:packages` |
| `CF_ZONE_ID` | Cloudflare → salistar.com → Overview |
| `CF_API_TOKEN` | Cloudflare → My Profile → API Tokens (Cache Purge) |

## Variables d'environnement (sur le VPS)

Le fichier `.env.production` (chmod 600, jamais commit) doit contenir :

```bash
NODE_ENV=production
MONGO_USER=sallycards
MONGO_PASSWORD=<openssl rand -hex 32>
MONGO_DB=sallycards
JWT_SECRET=<openssl rand -hex 64>
JWT_REFRESH_SECRET=<openssl rand -hex 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://sallycards.salistar.com,https://salistar.com
NEXT_PUBLIC_API_URL=https://api.salistar.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://ws.salistar.com
```

Voir `.env.production.example` pour le template complet.

## Commandes opérationnelles

### Sur le VPS

```bash
# Logs en live
docker compose logs -f --tail 100 sallycards-api
docker compose logs -f --tail 100 sallycards-socket

# Restart un service
docker compose restart sallycards-api

# Stats
docker stats

# Backup MongoDB manuel
docker exec sallycards-mongo mongodump --archive --gzip \
  -u sallycards -p "$MONGO_PASSWORD" --authenticationDatabase admin \
  > backup-$(date +%F).gz

# État Cloudflare Tunnel
sudo systemctl status cloudflared
journalctl -u cloudflared -f
```

### Rollback rapide

```bash
# Option A : revert le commit
git revert <bad-sha> && git push origin main

# Option B : forcer une image précédente
ssh deploy@91.99.70.43
cd ~/apps/sallycards-backoffice
# Editer docker-compose.prod.yml : changer ":latest" en ":<sha-précédent>"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Sécurité

- ✅ SSH par clé uniquement, root login désactivé, fail2ban actif
- ✅ UFW : seul le port 22 ouvert
- ✅ Cloudflare Tunnel : aucun port HTTP/HTTPS direct sur le VPS
- ✅ Cloudflare WAF : DDoS protection, bot fight mode
- ✅ JWT secrets dans `.env.production` (chmod 600, gitignored)
- ✅ MongoDB et Redis bind sur `127.0.0.1` uniquement
- ✅ Images Docker pinned par SHA, signées GitHub
- ✅ Auto-update sécurité Ubuntu via unattended-upgrades

## Monitoring

- **UptimeRobot** (gratuit, 50 monitors) — health checks toutes les 5 min
- **Cloudflare Analytics** — trafic, erreurs, bots bloqués
- **Hetzner Cloud Console** — graphes CPU/RAM/réseau

## Backups

- **Hetzner snapshots** : 7 quotidiens automatiques (configuré au provisioning)
- **MongoDB** : `mongodump` cron quotidien à 3h, rotation 14 jours dans `~/backups`
- **Off-site** (optionnel) : sync vers Cloudflare R2 via `rclone` (10 GB gratuits)

## Licence

Propriétaire — © SallyStar 2026

## Contact

- Email : salistarcompany@gmail.com
- Issues : https://github.com/salistar/sallycards-backoffice/issues
