#!/bin/sh
set -e

# Next.js standalone usa la variable HOSTNAME para el bind. En Docker/K8s/Railway
# HOSTNAME suele ser el nombre del contenedor (p. ej. replica-xyz), no una interfaz
# valida -> el servidor no escucha en 0.0.0.0 y el healthcheck da "service unavailable".
export HOSTNAME="0.0.0.0"

PORT="${PORT:-3000}"
export PORT

echo "=== Entrypoint standalone ==="
echo "=== Node $(node --version) · PORT=${PORT} · HOSTNAME=${HOSTNAME} ==="

if [ ! -f "./server.js" ]; then
  echo "ERROR: falta ./server.js (¿next.config output standalone y COPY .next/standalone?)"
  exit 1
fi

# Graceful shutdown: capturar SIGTERM para cerrar conexiones limpiamente
cleanup() {
  echo "INFO: Señal de terminación recibida. Cerrando servidor..."
  kill -TERM "$child" 2>/dev/null || true
  wait "$child" 2>/dev/null || true
  echo "INFO: Servidor cerrado correctamente."
  exit 0
}
trap cleanup TERM INT

# Migraciones: por defecto ejecutar ANTES de arrancar el servidor.
# Si necesitas que el proceso no bloquee en migrate: SKIP_DB_MIGRATIONS_ON_BOOT=true
# y ejecuta migrate en un job aparte con URL directa :5432.
MIGRATE_EXIT_CODE=0
if [ "$SKIP_DB_MIGRATIONS_ON_BOOT" = "true" ]; then
  echo "INFO: SKIP_DB_MIGRATIONS_ON_BOOT=true — sin migrate en boot"
elif [ -n "$DATABASE_URL" ] && [ -f "./migrate.mjs" ]; then
  echo "INFO: Ejecutando migraciones (max 300s)..."
  if command -v timeout >/dev/null 2>&1; then
    timeout 300 node ./migrate.mjs
    MIGRATE_EXIT_CODE=$?
  else
    node ./migrate.mjs
    MIGRATE_EXIT_CODE=$?
  fi

  if [ "$MIGRATE_EXIT_CODE" -eq 124 ]; then
    echo "WARN: migrate timeout (124). El servidor arrancara con schema posiblemente desactualizado."
    echo "      Considera usar SKIP_DB_MIGRATIONS_ON_BOOT=true y ejecutar migrate manualmente."
  elif [ "$MIGRATE_EXIT_CODE" -ne 0 ]; then
    echo "ERROR: migrate deploy fallo con codigo $MIGRATE_EXIT_CODE."
    echo "       El servidor NO arrancara para prevenir corrupcion de datos."
    echo "       Revisa logs: si ves db.*.supabase.co y P1001, quita DIRECT_DATABASE_URL con host db.*"
    echo "       o redeploy con migrate.mjs actual (session pooler :5432)."
    exit $MIGRATE_EXIT_CODE
  else
    echo "INFO: migrate deploy completo OK."
  fi
elif [ -n "$DATABASE_URL" ]; then
  echo "WARN: DATABASE_URL definida pero falta ./migrate.mjs; omitiendo migrate"
fi

# Si llegamos aqui, las migraciones fueron exitosas (o skippeadas). Arrancar servidor.
echo "INFO: Iniciando servidor Next.js standalone..."
node server.js &
child=$!
wait "$child"
