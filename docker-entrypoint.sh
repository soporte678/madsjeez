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
#
# Importante: con `set -e`, si migrate falla o se cuelga (p. ej. pooler Supabase :6543), el contenedor
# nunca llega a `server.js` y Railway marca "Healthcheck failure". Por eso migrate no aborta el arranque.
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "INFO: SKIP_DB_MIGRATIONS_ON_BOOT=true — sin migrate en boot"
elif [ -n "$DATABASE_URL" ] && [ -f "./migrate.mjs" ]; then
  echo "INFO: aplicando migraciones Prisma antes de arrancar Next (máx ~180s si hay timeout)..."
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout 180 node ./migrate.mjs
  else
    node ./migrate.mjs
  fi
  mig=$?
  set -e
  if [ "$mig" != 0 ]; then
    echo "WARN: migrate deploy terminó con código $mig (timeout=124). Arrancando Next igual; revisá DATABASE_URL (URL directa :5432 para migrar) o ejecutá migrate a mano."
  fi
elif [ -n "$DATABASE_URL" ]; then
  echo "WARN: DATABASE_URL definida pero falta ./migrate.mjs; omitiendo migrate"
fi

exec node server.js
