# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:22-alpine AS base

# Forzar rebuild limpio - cambiar este número para invalidar cache: 8

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Variables de entorno mínimas para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Baselining: mark initial migration as applied, then deploy new migrations
RUN echo "=== Baselining Prisma migrations ===" && \
    npx prisma migrate resolve --applied 20250426170000_initial_setup 2>/dev/null || true && \
    npx prisma migrate deploy && \
    echo "=== Migraciones aplicadas ==="

# Build de Next.js
RUN echo "=== Iniciando build de Next.js ===" && \
    npx next build && \
    echo "=== Build completado ==="

# Exponer puerto
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio - usar npm run start para que encuentre next en node_modules
CMD ["npm", "run", "start"]
