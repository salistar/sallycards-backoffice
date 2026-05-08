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
# Install socket-server deps that aren't hoisted to root
RUN cd apps/socket-server && npm install --install-strategy=shallow

COPY apps/socket-server/ apps/socket-server/
COPY libs/ libs/
COPY tsconfig.base.json nx.json ./

RUN cd apps/socket-server && npx nest build

# Merge socket-server node_modules into root for a single flat tree
RUN cp -r apps/socket-server/node_modules/@nestjs/platform-socket.io node_modules/@nestjs/platform-socket.io 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/@nestjs/websockets node_modules/@nestjs/websockets 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/@socket.io node_modules/@socket.io 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/ioredis node_modules/ioredis 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/socket.io node_modules/socket.io 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/socket.io-adapter node_modules/socket.io-adapter 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/socket.io-parser node_modules/socket.io-parser 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/engine.io node_modules/engine.io 2>/dev/null || true && \
    cp -r apps/socket-server/node_modules/engine.io-parser node_modules/engine.io-parser 2>/dev/null || true

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/apps/socket-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 3001
CMD ["node", "dist/apps/socket-server/src/main"]
