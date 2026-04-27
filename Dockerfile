# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:22-alpine AS base

# Forzar rebuild limpio - cambiar este número para invalidar cache: 3

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Variables de entorno mínimas para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar solo package.json primero
COPY package.json ./

# Instalar dependencias con más memoria y logs
RUN echo "=== Instalando dependencias ===" && \
    npm install --production=false --no-audit --no-fund 2>&1 && \
    echo "=== Dependencias instaladas ==="

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN echo "=== Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "=== Prisma Client generado ==="

# Build de Next.js
RUN echo "=== Iniciando build de Next.js ===" && \
    npm run build && \
    echo "=== Build completado ==="

# Exponer puerto
EXPOSE 3000
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]
