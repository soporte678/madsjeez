# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar los archivos de dependencias de la raíz
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Variables de entorno dummy para el build (Mercado Pago necesita un token para no llorar durante el prerender)
# --- MATA-TOPOS DE MERCADO PAGO: Todas las variantes posibles ---
ENV MERCADOPAGO_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MERCADOPAGO_PUBLIC_KEY="TEST-dummy-public-key"
ENV MP_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MP_PUBLIC_KEY="TEST-dummy-public-key"
ENV MERCADO_PAGO_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MERCADO_PAGO_PUBLIC_KEY="TEST-dummy-public-key"

# Build de Next.js
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
