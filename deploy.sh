#!/bin/bash
# Script de deploy para Railway

echo "🚀 Iniciando deploy de MadsJeez..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

# Seed de datos iniciales (opcional)
# echo "🌱 Cargando datos iniciales..."
# npx prisma db seed

# Build de Next.js
echo "🏗️ Building Next.js..."
npm run build

echo "✅ Deploy completado!"
