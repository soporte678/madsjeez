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

# Build de Next.js
WORKDIR /app/apps/web
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio - ejecutar directamente next start
CMD ["npx", "next", "start", "-p", "3000"]
