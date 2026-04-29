# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:22-alpine AS base

# Forzar rebuild limpio - cambiar este número para invalidar cache: 11

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
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_ENABLE_PROMOTIONS=$NEXT_PUBLIC_ENABLE_PROMOTIONS
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

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

# Baselining: mark all existing migrations as applied, then deploy new ones
RUN echo "=== Baselining Prisma migrations ===" && \
    npx prisma migrate resolve --applied 20250426170000_initial_setup 2>/dev/null || true && \
    npx prisma migrate resolve --applied 20250427200000_add_favorites_table 2>/dev/null || true && \
    npx prisma migrate deploy && \
    echo "=== Migraciones aplicadas ==="

# Build de Next.js (bypass package.json cached script)
RUN echo "=== Iniciando build de Next.js ===" && \
    NODE_OPTIONS="--max-old-space-size=4096" npx next build && \
    echo "=== Build completado ==="

# Exponer puerto
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio - usar npm run start para que encuentre next en node_modules
CMD ["npm", "run", "start"]
