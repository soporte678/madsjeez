#!/bin/sh
set -e

echo "=== Entrypoint iniciado ==="
echo "=== Node version: $(node --version) ==="
echo "=== NPM version: $(npm --version) ==="

# Verificar que existen archivos necesarios
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json no encontrado"
    exit 1
fi

# Ejecutar migraciones y fallback si DATABASE_URL está configurada
if [ -n "$DATABASE_URL" ]; then
    echo "=== DATABASE_URL configurada ==="
    echo "=== Ejecutando migraciones de Prisma ==="
    npx prisma migrate deploy --datasource-url="$DATABASE_URL" 2>&1 || echo "WARNING: Prisma migrate deploy fallo (ignorado)"

    echo "=== Verificando/creado columna access_key via fallback SQL ==="
    node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$executeRawUnsafe('ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"access_key\" VARCHAR(191);')
  .then(() => { console.log('OK: columna access_key verificada'); return prisma.\$disconnect(); })
  .catch(e => { console.log('INFO:', e.message); return prisma.\$disconnect().catch(() => {}); });
" || echo "WARNING: Fallback SQL fallo (ignorado)"
else
    echo "WARNING: DATABASE_URL no configurada, saltando migraciones"
fi

# Iniciar la aplicación
echo "=== Iniciando aplicación ==="
echo "=== Comando: $@ ==="
exec "$@"
