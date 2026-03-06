# STAGE 1: Pruning - Riduce il monorepo ai soli file necessari per il frontend
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .

# Usa --docker che crea automaticamente la sottocartella /out
RUN turbo prune @adhr/welcome-frontend --docker

# STAGE 2: Installer - Installa le dipendenze
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm@10.30.1
RUN pnpm install --frozen-lockfile

# STAGE 3: Builder - Compila l'applicazione
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

#--- AMBIENTE PER IL BUILDING  ---

ARG NEXT_PUBLIC_NODE_ENV
ARG NEXT_PUBLIC_PORT
ARG NEXT_PUBLIC_LOG_LEVEL
ARG NEXT_PUBLIC_DATABASE_URL


# Passiamo l'ARG a ENV così che Next.js possa leggerlo durante 'pnpm turbo build'
ENV NEXT_PUBLIC_NODE_ENV=${NEXT_PUBLIC_NODE_ENV}
ENV NEXT_PUBLIC_PORT=${NEXT_PUBLIC_PORT}
ENV NEXT_PUBLIC_LOG_LEVEL=${NEXT_PUBLIC_LOG_LEVEL}
ENV NEXT_PUBLIC_DATABASE_URL=${NEXT_PUBLIC_DATABASE_URL}

RUN npm install -g pnpm@10.30.1
RUN pnpm turbo build --filter=@adhr/welcome-frontend

# STAGE 4: Runner - Immagine finale super leggera
FROM node:20-alpine AS runner
WORKDIR /app

# Creiamo un utente non-root per sicurezza
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamo solo i file necessari generati dalla modalità standalone
COPY --from=builder /app/apps/welcome-frontend/public ./apps/welcome-frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/welcome-frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/welcome-frontend/.next/static ./apps/welcome-frontend/.next/static

USER nextjs
EXPOSE 3000
# Il file server.js viene creato automaticamente dalla modalità standalone
CMD ["node", "apps/welcome-frontend/server.js"]