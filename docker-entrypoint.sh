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

# Migraciones: en la imagen standalone no incluimos el CLI completo de Prisma.
# Usá Railway → una vez: `railway run npx prisma migrate deploy` o variable SKIP_DB_MIGRATIONS_ON_BOOT en dashboard.
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "INFO: SKIP_DB_MIGRATIONS_ON_BOOT=true — sin migrate en boot"
elif [ -n "$DATABASE_URL" ]; then
  echo "WARNING: migrate en boot desactivado en imagen standalone; ejecutá prisma migrate deploy fuera del container o montá CLI Prisma."
fi

exec node server.js
