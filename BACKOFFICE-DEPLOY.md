# SallyCards Backoffice — Déploiement Hetzner + Cloudflare

Stack complète back-office (API NestJS, Socket.IO, Next.js Web, MongoDB, Redis) déployée sur un VPS Hetzner avec exposition par Cloudflare Tunnel et CI/CD GitHub Actions.

## URLs publiques

| Service | URL | Description |
|---|---|---|
| API REST | https://api.salistar.com/api/v1 | NestJS, auth JWT, MongoDB |
| WebSocket | https://ws.salistar.com | Socket.IO, multi-joueur temps réel |
| Web | https://sallycards.salistar.com | Next.js 15 + React 19 |
| Backoffice | https://backoffice.salistar.com | Console admin |
| Domaine racine | https://salistar.com | Landing page |
| TURN/STUN | turn.salistar.com | WebRTC media relay (séparé) |

## Pipeline complet

```
[Local] git push origin main
    │
    ▼
[GitHub] Repository: salistar/sallycards-backoffice
    │
    ▼
[GitHub Actions] .github/workflows/deploy-prod.yml
    ├─ Build 3 Docker images (api, socket, web) en parallèle (~3 min)
    ├─ Push vers ghcr.io/salistar/sallycards-{api,socket,web}:sha
    └─ SSH vers VPS Hetzner → docker compose pull && up -d
    │
    ▼
[Hetzner VPS] 91.99.70.43 (Nuremberg)
    ├─ Cloudflare Tunnel (cloudflared)
    └─ Docker compose stack (5 conteneurs)
    │
    ▼
[Cloudflare] DNS + CDN + WAF
    ├─ api.salistar.com
    ├─ ws.salistar.com
    ├─ sallycards.salistar.com
    └─ salistar.com
    │
    ▼
[Internet] Utilisateurs
```

## Coûts mensuels

| Poste | Coût |
|---|---|
| Hetzner CPX22 (2 vCPU, 4 GB, 80 GB SSD) | €7.99 |
| Backups Hetzner (+20 %) | €1.60 |
| Cloudflare DNS, CDN, Tunnel, WAF | €0 |
| GitHub Actions + ghcr.io (public repo) | €0 |
| Domaine salistar.com (Cloudflare Registrar at-cost) | €0.75 |
| **Total** | **~€10.34 / mois** |

Voir le PDF [`reports/SallyCards-Backoffice-Deploy-Report.pdf`](reports/SallyCards-Backoffice-Deploy-Report.pdf) pour le guide détaillé étape par étape.
