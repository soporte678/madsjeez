# Dockerfile para Railway - MADSJEEZ Marketplace
FROM node:22-alpine AS base

# Forzar rebuild limpio - cambiar este número para invalidar cache: 4

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

# Variables con valores por defecto para el build (se sobreescriben en runtime)
ENV MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN:-TEST-dummy-token}
ENV MERCADOPAGO_PUBLIC_KEY=${MERCADOPAGO_PUBLIC_KEY:-TEST-dummy-key}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_dummy}
ENV STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-pk_test_dummy}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-dummy-secret}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-dummy-id}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-dummy-secret-for-build}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-https://www.madsjeez.com.ar}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://www.madsjeez.com.ar}
ENV DATABASE_URL=${DATABASE_URL:-postgresql://dummy}
ENV DIRECT_URL=${DIRECT_URL:-postgresql://dummy}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy-key}

# Build de Next.js
RUN echo "=== Iniciando build de Next.js ===" && \
    echo "MERCADOPAGO_ACCESS_TOKEN: $MERCADOPAGO_ACCESS_TOKEN" && \
    npm run build && \
    echo "=== Build completado ==="

# Exponer puerto
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio - usar npm run start para que encuentre next en node_modules
CMD ["npm", "run", "start"]
