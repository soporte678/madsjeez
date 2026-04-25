# Dockerfile para Railway
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js con variables de entorno dummy para el build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV STRIPE_SECRET_KEY="sk_test_dummy"
ENV STRIPE_PUBLIC_KEY="pk_test_dummy"
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
