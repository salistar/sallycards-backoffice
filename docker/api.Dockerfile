# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/socket-server/package.json apps/socket-server/package.json
COPY libs/ai/package.json libs/ai/package.json
COPY libs/audio/package.json libs/audio/package.json
COPY libs/auth/package.json libs/auth/package.json
COPY libs/card-assets/package.json libs/card-assets/package.json
COPY libs/game-engine/package.json libs/game-engine/package.json
COPY libs/i18n/package.json libs/i18n/package.json
COPY libs/networking/package.json libs/networking/package.json
COPY libs/social/package.json libs/social/package.json
COPY libs/storage/package.json libs/storage/package.json
COPY libs/ui/package.json libs/ui/package.json
COPY libs/ads/package.json libs/ads/package.json
COPY libs/shared/types/package.json libs/shared/types/package.json

RUN npm ci

COPY apps/api/ apps/api/
COPY libs/ libs/
COPY tsconfig.base.json nx.json ./

RUN cd apps/api && npx nest build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 3000
CMD ["node", "dist/apps/api/src/main"]
