# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar los archivos de dependencias de la raíz
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Build de Next.js
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
