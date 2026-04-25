# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package.json y package-lock.json de la app web
COPY apps/web/package*.json ./apps/web/

# Instalar dependencias en apps/web (usar npm install porque no tenemos package-lock.json en el contexto)
WORKDIR /app/apps/web
RUN npm install

# Copiar el resto del código
WORKDIR /app
COPY . .

# Build de Next.js
WORKDIR /app/apps/web
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
