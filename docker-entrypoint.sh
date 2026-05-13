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

# Migraciones: por defecto `node migrate.mjs` en **segundo plano** para que Next escuche
# de inmediato y el healthcheck de Railway (`/railway-health.txt`) no falle mientras migrate
# corre (puede tardar hasta ~300s con pooler o red lenta).
#
# Si necesitás que el proceso no sirva tráfico hasta tener schema al día: SKIP_DB_MIGRATIONS_ON_BOOT=true
# y ejecutá migrate en un job aparte con URL directa :5432.
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "INFO: SKIP_DB_MIGRATIONS_ON_BOOT=true — sin migrate en boot"
elif [ -n "$DATABASE_URL" ] && [ -f "./migrate.mjs" ]; then
  echo "INFO: migrate en background (máx ~300s); Next arranca ya para healthchecks."
  (
    set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout 300 node ./migrate.mjs
  else
    node ./migrate.mjs
  fi
    mig=$?
    if [ "$mig" != 0 ]; then
      echo "WARN: migrate deploy terminó con código $mig (timeout=124). Revisá DIRECT_DATABASE_URL (:5432) o DATABASE_URL directa; pooler :6543 suele colgar. O ejecutá migrate a mano."
    else
      echo "INFO: migrate deploy completó OK."
    fi
  ) &
elif [ -n "$DATABASE_URL" ]; then
  echo "WARN: DATABASE_URL definida pero falta ./migrate.mjs; omitiendo migrate"
fi

exec node server.js
