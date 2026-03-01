# --- STAGE 1: PRUNER -------------------------------------------------------------
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .

# "Dammi una versione ridotta del monorepo contenente solo ciò che serve per 
# buildare @adhr/onboarding-backend, ottimizzata per Docker."

RUN turbo prune --scope=@adhr/onboarding-backend --docker

# Genera una cartella out/ con:
# out/
#  ├── json/              ← tutti i package.json necessari
#  ├── pnpm-lock.yaml     ← lockfile ridotto
#  └── full/              ← codice sorgente completo (serve dopo)

# In un monorepo pnpm, esiste un solo pnpm-lock.yaml globale. Turbo lo ha "potato" 
# e lo ha messo dentro in out/pnpm-lock.yaml includendo solo i riferimenti ai pacchetti 
# necessari per far girare il tuo backend specifico.

# --- STAGE 2: BUILDER -------------------------------------------------------------
FROM node:20-alpine AS builder
# Corepack permette di usare pnpm senza installarlo globalmente.
RUN npm install -g turbo
RUN corepack enable
WORKDIR /app

# 1. Copia i file JSON e il lockfile generati da turbo prune
COPY --from=pruner /app/out/json .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 3. Copia il codice sorgente (il "full" generato da turbo )
COPY --from=pruner /app/out/full .

# 4. Builda il progetto usando turbo (sfruttando la cache se possibile)
RUN turbo build --filter=@adhr/onboarding-backend

# --- STAGE 3: RUNNER ------------------------------------------------------------------
FROM node:20-alpine AS runner 

WORKDIR /app

# AMBIENTE
ARG DOMENICO_ENV
ARG DATABASE_URL 
ARG NODE_ENV 

ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL = ${DATABASE_URL}
ENV DOMENICO_ENV = ${DOMENICO_ENV}

RUN apk update && apk upgrade && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify
RUN corepack enable

# 1. Copia i file JSON e il lockfile direttamente dal PRUNER (dove la cartella out/ esiste ancora)
COPY --from=pruner /app/out/json .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 2 Installa le dipendenze di produzione ignorando gli script di prepare/husky
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 3. Copia i file compilati dallo stage BUILDER
# Qui devi puntare a dove il comando 'turbo build' ha creato la cartella dist
COPY --from=builder /app/apps/onboarding-backend/dist ./apps/onboarding-backend/dist

USER fastify

EXPOSE 3001
ENV PORT=3001

# 4. Avvia
CMD ["node", "apps/onboarding-backend/dist/app.js"]