# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Variables de entorno para el build (evitan errores durante prerender)
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

# --- URL PARA EL BUILD DE NEXT.JS ---
ENV NEXT_PUBLIC_APP_URL="https://www.madsjeez.com.ar"
ENV NEXT_PUBLIC_SITE_URL="https://www.madsjeez.com.ar"
ENV APP_URL="https://www.madsjeez.com.ar"

# --- SUPABASE (valores por defecto para build, se sobreescriben en runtime) ---
ENV NEXT_PUBLIC_SUPABASE_URL="https://svbzmvmmzaqkepeysjyk.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_3tpcnJT3gHBNC4bfJ79yAg_rcq3FBtK"

# --- GOOGLE AUTH (valores por defecto para build, se sobreescriben en runtime) ---
ENV GOOGLE_CLIENT_ID="dummy-google-client-id"
ENV GOOGLE_CLIENT_SECRET="dummy-google-client-secret"

# --- NEXTAUTH (valores por defecto para build, se sobreescriben en runtime) ---
ENV NEXTAUTH_SECRET="dummy-nextauth-secret-for-build-only"
ENV NEXTAUTH_URL="https://www.madsjeez.com.ar"

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
