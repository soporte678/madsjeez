# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:22-alpine AS base

# Forzar rebuild limpio - cambiar este número para invalidar cache: 15

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Variables de entorno mínimas para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Railway passes env vars as build args - declare them so they're available during next build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_ENABLE_PROMOTIONS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ENABLE_PROMOTIONS=$NEXT_PUBLIC_ENABLE_PROMOTIONS

# Copiar package.json e instalar dependencias
COPY package.json ./

RUN echo "=== Instalando dependencias ===" && \
    npm install --production=false --no-audit --no-fund 2>&1 && \
    echo "=== Dependencias instaladas ==="

# Copiar el resto del código (incluye prisma/schema.prisma)
COPY . .

# Generar cliente de Prisma
RUN echo "=== Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "=== Prisma Client generado ==="

# Migraciones en runtime: docker-entrypoint.sh ejecuta `prisma migrate deploy`
# (prisma.config.ts define datasource.url = DATABASE_URL de Railway).

# Build de Next.js (bypass package.json cached script)
RUN echo "=== Iniciando build de Next.js ===" && \
    NODE_OPTIONS="--max-old-space-size=4096" npx next build && \
    echo "=== Build completado ==="

# Copiar entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Railway inyecta PORT en runtime (p. ej. 8080). No fijar HOSTNAME: puede interferir con Next.
EXPOSE 3000

# Usar entrypoint para migraciones y arranque.
# Importante: `npm run start` no siempre expande ${PORT} igual en Alpine; arrancamos Next con `sh -c` para que escuche en $PORT.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "exec ./node_modules/.bin/next start -H 0.0.0.0 -p \"${PORT:-3000}\""]
