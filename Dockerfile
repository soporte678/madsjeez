# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Variables de entorno dummy para el build (evitan errores durante prerender)
# --- MATA-TOPOS DE MERCADO PAGO ---
ENV MERCADOPAGO_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MERCADOPAGO_PUBLIC_KEY="TEST-dummy-public-key"
ENV MP_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MP_PUBLIC_KEY="TEST-dummy-public-key"
ENV MERCADO_PAGO_ACCESS_TOKEN="TEST-dummy-token-para-build"
ENV MERCADO_PAGO_PUBLIC_KEY="TEST-dummy-public-key"

# --- MATA-TOPOS DE STRIPE ---
ENV STRIPE_SECRET_KEY="sk_test_dummy_key_para_build"
ENV STRIPE_PUBLISHABLE_KEY="pk_test_dummy_key_para_build"

# --- ANTENAS PARA SUPABASE DESDE RAILWAY ---
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL

ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copiar los archivos de dependencias de la raíz
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Build de Next.js
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
