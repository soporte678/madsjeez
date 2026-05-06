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

# Permite mitigar incidentes de arranque si la DB está inestable
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
    echo "WARNING: SKIP_DB_MIGRATIONS_ON_BOOT=true, saltando migraciones"
elif [ -n "$DATABASE_URL" ]; then
    echo "=== DATABASE_URL configurada (runtime) ==="
    echo "=== Ejecutando migraciones de Prisma ==="
    # Prisma 7 lee DATABASE_URL desde prisma.config.ts (datasource.url). No ignorar fallos.
    export DATABASE_URL
    if ! npx prisma migrate deploy; then
        echo "ERROR: prisma migrate deploy falló — revisá logs y _prisma_migrations"
        exit 1
    fi

    echo "=== Verificando/creado columna access_key via fallback SQL ==="
    node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$executeRawUnsafe('ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"access_key\" VARCHAR(191);')
  .then(() => { console.log('OK: columna access_key verificada'); return prisma.\$disconnect(); })
  .catch(e => { console.log('INFO:', e.message); return prisma.\$disconnect().catch(() => {}); });
" || echo "WARNING: Fallback SQL fallo (ignorado)"
else
    echo "WARNING: DATABASE_URL no configurada en runtime, saltando migraciones"
fi

# Iniciar Next.js (siempre el puerto que Railway inyecta en PORT)
PORT="${PORT:-3000}"
export PORT
echo "=== Iniciando Next.js en 0.0.0.0:${PORT} (healthcheck /api/health) ==="
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "$PORT"
