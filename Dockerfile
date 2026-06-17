# Railway — Debian bookworm (misma libc que motores Prisma del trace standalone).
# Sin apt-get: los builders Metal de Railway a veces fallan con GPG "invalid signature"
# en deb.debian.org (incidente de infra). node:22-bookworm-slim ya trae libssl3 y ca-certificates.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_ENABLE_PROMOTIONS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ENABLE_PROMOTIONS=$NEXT_PUBLIC_ENABLE_PROMOTIONS

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN echo "=== Prisma generate ===" && npx prisma generate
RUN echo "=== Next build (standalone) ===" && \
    NODE_OPTIONS="--max-old-space-size=4096" npx next build && \
    echo "=== Build OK ==="

FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Prisma necesita el binario `openssl` para detectar la versión de libssl en runtime.
# bookworm-slim ya trae libssl3 pero no el CLI — instalarlo resuelve los warnings.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodeuser

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# No instalar `prisma` encima del standalone (deja @prisma/engines a medias y rompe el postinstall). Copiamos el árbol completo del builder + deps hoisted de @prisma/config.
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
RUN npm install c12@3.3.4 deepmerge-ts@7.1.5 effect@3.20.0 empathic@2.0.0 --omit=dev --no-audit --no-fund --legacy-peer-deps --no-save

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/migrate.mjs ./migrate.mjs
COPY --from=builder /app/docs ./docs

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Asegurar permisos correctos para el usuario no-root
RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
