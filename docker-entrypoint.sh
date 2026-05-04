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

# Ejecutar migraciones de Prisma si DATABASE_URL está configurada
if [ -n "$DATABASE_URL" ]; then
    echo "=== DATABASE_URL configurada ==="
    echo "=== Ejecutando migraciones de Prisma ==="
    if npx prisma migrate deploy --datasource-url="$DATABASE_URL" 2>&1; then
        echo "=== Migraciones completadas ==="
    else
        echo "ERROR: Las migraciones fallaron. El deploy se detendra."
        exit 1
    fi
else
    echo "WARNING: DATABASE_URL no configurada, saltando migraciones"
fi

# Iniciar la aplicación
echo "=== Iniciando aplicación ==="
echo "=== Comando: $@ ==="
exec "$@"
