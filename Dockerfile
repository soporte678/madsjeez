# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package.json raíz
COPY package*.json ./

# Copiar package.json de la app web
COPY apps/web/package*.json ./apps/web/

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Build de Next.js - usar el next instalado localmente
WORKDIR /app/apps/web
RUN ../../node_modules/.bin/next build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio - usar el next instalado localmente
CMD ["../../node_modules/.bin/next", "start", "-p", "3000"]
