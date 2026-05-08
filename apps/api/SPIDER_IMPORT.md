# Import des deals Spider Solitaire (v2 — pré-générés)

100 deals Spider Solitaire pré-générés (avec leur séquence complète de coups) sont stockés dans le fichier
`C:/Users/21266/Downloads/spider_deals_with_distributions.json` (~47 MB).

Ce document explique comment les pousser dans la collection MongoDB `spider_deals_v2`,
et comment l'API les expose au client mobile.

---

## 1. Préparer l'API

Le code source du module `deal-seeds` a été mis à jour avec :

- nouveau schéma `spider-deal-v2.schema.ts` (collection `spider_deals_v2`)
- nouveaux endpoints `/deal-seeds/spider-v2/*`
- limite du body parser bumpée à 60 MB (cf `apps/api/src/main.ts`)

Avant de lancer l'import, **rebuild l'API** pour intégrer ces changements :

```bash
# arrête l'ancien container
docker compose down sallycards-api

# rebuild
pnpm nx build api
docker compose build sallycards-api

# relance
docker compose up -d sallycards-api
```

Le container API est nommé `sallycards-api` (cf `docker-compose.yml`).

---

## 2. Lancer l'import

### Option A — depuis le host (recommandé en dev)

```bash
pnpm ts-node apps/api/scripts/import-spider-deals.ts
```

Le script tente plusieurs URIs Mongo dans cet ordre :

1. `process.env.MONGODB_URI` (si défini)
2. `mongodb://sallycards:sallycards_dev@sallycards-mongo:27017/sallycards` (réseau Docker)
3. `mongodb://mongo:27017/sallycards`
4. `mongodb://sallycards:sallycards_dev@localhost:27017/sallycards` (localhost auth)
5. `mongodb://localhost:27017/sallycards` (localhost no-auth)

### Option B — depuis le container API (après build)

```bash
# 1. build l'API (le script TS sera transpilé en JS dans dist/)
pnpm nx build api

# 2. exécute le JS compilé dans le container
docker exec sallycards-api node dist/apps/api/scripts/import-spider-deals.js
```

### Option C — via ts-node dans le container

```bash
docker exec sallycards-api pnpm ts-node apps/api/scripts/import-spider-deals.ts
```

---

## 3. Vérifier l'import

```bash
# Compter les deals importés
docker exec sallycards-mongo mongosh --quiet \
  -u sallycards -p sallycards_dev --authenticationDatabase admin \
  sallycards --eval 'db.spider_deals_v2.countDocuments({})'

# Lister un échantillon
docker exec sallycards-mongo mongosh --quiet \
  -u sallycards -p sallycards_dev --authenticationDatabase admin \
  sallycards --eval 'db.spider_deals_v2.find({}, {_id:1, variant:1, difficulty:1, total_turns:1}).limit(5).toArray()'
```

Ou via les endpoints API :

```bash
# Random deal
curl http://localhost:3000/api/v1/deal-seeds/spider-v2/random?difficulty=easy

# Lister 10 deals (juste id + difficulty)
curl 'http://localhost:3000/api/v1/deal-seeds/spider-v2/list?difficulty=easy&limit=10'

# Récupérer un deal complet (avec turns)
curl http://localhost:3000/api/v1/deal-seeds/spider-v2/spider_1suit_easy_001
```

---

## 4. Endpoints exposés

| Méthode | Route                                   | Description                                       |
|---------|-----------------------------------------|---------------------------------------------------|
| POST    | `/deal-seeds/spider-v2/import`          | Importe un batch de deals (body : `{deals:[…]}`)  |
| GET     | `/deal-seeds/spider-v2/random`          | Un deal aléatoire (filtre `?difficulty=easy`)      |
| GET     | `/deal-seeds/spider-v2/list`            | Liste N deals (`?difficulty=easy&limit=10`)       |
| GET     | `/deal-seeds/spider-v2/:dealId`         | Un deal spécifique (avec tous les turns)          |

Le POST `/import` accepte des payloads jusqu'à **60 MB**, donc le JSON entier
peut être envoyé d'une traite si on préfère cette voie au script direct :

```bash
curl -X POST http://localhost:3000/api/v1/deal-seeds/spider-v2/import \
  -H 'Content-Type: application/json' \
  --data @"C:/Users/21266/Downloads/spider_deals_with_distributions.json"
```

NB : le wrapper du JSON contient un objet `{metadata, deals: [...]}` ;
l'API attend `{deals: [...]}` directement. Si tu utilises `curl`, transforme
d'abord le payload (ou utilise plutôt le script `import-spider-deals.ts`).
