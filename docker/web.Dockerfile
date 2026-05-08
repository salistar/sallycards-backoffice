# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install jq to manipulate package.json
RUN apk add --no-cache jq

# Copy root package files
COPY package*.json ./

# Remove workspaces from root package.json to avoid mobile React 18 conflicts
RUN jq 'del(.workspaces)' package.json > package.tmp.json && mv package.tmp.json package.json

# Copy web app package.json
COPY apps/web/package.json apps/web/package.json

# Install web app dependencies directly
RUN cd apps/web && npm install

# Copy source
COPY apps/web/ apps/web/
COPY libs/ libs/
COPY tsconfig.base.json nx.json ./

ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/web && npx next build

# ---- Runner ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (includes server.js at apps/web/server.js)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files RELATIVE to where server.js is (apps/web/)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets RELATIVE to where server.js is (apps/web/)
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
