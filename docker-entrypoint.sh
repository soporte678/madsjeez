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
    npx prisma migrate deploy 2>&1 || {
        echo "WARNING: Migraciones fallaron o ya estaban aplicadas, continuando..."
    }
    echo "=== Migraciones completadas ==="
else
    echo "WARNING: DATABASE_URL no configurada, saltando migraciones"
fi

# Iniciar la aplicación
echo "=== Iniciando aplicación ==="
echo "=== Comando: $@ ==="
exec "$@"
