# Dockerfile para Railway
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --no-cache

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
