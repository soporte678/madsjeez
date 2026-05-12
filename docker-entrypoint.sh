#!/bin/sh
set -e

# Next.js standalone usa la variable HOSTNAME para el bind. En Docker/K8s/Railway
# HOSTNAME suele ser el nombre del contenedor (p. ej. replica-xyz), no una interfaz
# válida → el servidor no escucha en 0.0.0.0 y el healthcheck da "service unavailable".
export HOSTNAME="0.0.0.0"

PORT="${PORT:-3000}"
export PORT

echo "=== Entrypoint standalone ==="
echo "=== Node $(node --version) · PORT=${PORT} · HOSTNAME=${HOSTNAME} ==="

if [ ! -f "./server.js" ]; then
  echo "ERROR: falta ./server.js (¿next.config output standalone y COPY .next/standalone?)"
  exit 1
fi

# Migraciones: por defecto `node migrate.mjs` (= prisma migrate deploy) si hay DATABASE_URL.
# Desactivar solo si corrés migrate en otro job: SKIP_DB_MIGRATIONS_ON_BOOT=true
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "INFO: SKIP_DB_MIGRATIONS_ON_BOOT=true — sin migrate en boot"
elif [ -n "$DATABASE_URL" ] && [ -f "./migrate.mjs" ]; then
  echo "INFO: aplicando migraciones Prisma antes de arrancar Next..."
  node ./migrate.mjs
elif [ -n "$DATABASE_URL" ]; then
  echo "WARN: DATABASE_URL definida pero falta ./migrate.mjs; omitiendo migrate"
fi

exec node server.js
