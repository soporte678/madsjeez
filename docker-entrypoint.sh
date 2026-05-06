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
    export DATABASE_URL
    set +e
    npx prisma migrate deploy
    mig_exit=$?
    set -e
    if [ "$mig_exit" -ne 0 ]; then
        echo "ERROR: prisma migrate deploy falló (código $mig_exit) — revisá DATABASE_URL y _prisma_migrations"
        if [ "${BOOT_CONTINUE_ON_MIGRATE_FAIL:-}" = "true" ]; then
            echo "WARNING: BOOT_CONTINUE_ON_MIGRATE_FAIL=true — arrancando Next igual (corregí migraciones cuanto antes)"
        else
            exit 1
        fi
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

PORT="${PORT:-3000}"
export PORT

NEXT_CLI="./node_modules/next/dist/bin/next"
if [ ! -f "$NEXT_CLI" ]; then
    echo "ERROR: No se encuentra Next en $NEXT_CLI"
    exit 1
fi

echo "=== Iniciando Next.js en 0.0.0.0:${PORT} (healthcheck: GET /railway-health.txt) ==="
exec node "$NEXT_CLI" start -H 0.0.0.0 -p "$PORT"
