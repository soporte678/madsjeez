#!/bin/bash

# Script de despliegue para MADSJEEZ Marketplace
# Uso: ./deploy.sh [produccion|desarrollo]

set -e

ENV=${1:-produccion}
echo "🚀 Iniciando despliegue en modo: $ENV"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
command -v node >/dev/null 2>&1 || { log_error "Node.js no está instalado"; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm no está instalado"; exit 1; }

# Verificar versión de Node
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "Se requiere Node.js 20 o superior. Versión actual: $(node -v)"
    exit 1
fi

log_info "✓ Node.js versión: $(node -v)"

# Ir al directorio de la app
cd apps/web

# Instalar dependencias
log_info "📦 Instalando dependencias..."
npm ci

# Verificar variables de entorno
if [ ! -f .env.production ] && [ "$ENV" = "produccion" ]; then
    log_warn "No se encontró .env.production"
    if [ -f .env.local ]; then
        log_info "Copiando .env.local a .env.production"
        cp .env.local .env.production
    else
        log_error "No se encontró archivo de entorno"
        exit 1
    fi
fi

# Build
log_info "🔨 Compilando aplicación..."
if [ "$ENV" = "produccion" ]; then
    npm run build
else
    npm run build
fi

# Verificar build
if [ ! -d ".next" ]; then
    log_error "El build falló - no se encontró directorio .next"
    exit 1
fi

log_info "✓ Build completado exitosamente"

# Si es producción y está en VPS con PM2
if [ "$ENV" = "produccion" ] && command -v pm2 >/dev/null 2>&1; then
    log_info "🔄 Reiniciando aplicación con PM2..."
    
    if pm2 list | grep -q "madsjeez"; then
        pm2 restart madsjeez
    else
        pm2 start npm --name "madsjeez" -- start
        pm2 save
    fi
    
    log_info "✓ Aplicación reiniciada"
    pm2 status
fi

# Verificar salud del sitio (si es producción)
if [ "$ENV" = "produccion" ]; then
    log_info "🔍 Verificando salud del sitio..."
    
    # Esperar a que el servidor inicie
    sleep 3
    
    # Intentar hacer request al sitio
    if command -v curl >/dev/null 2>&1; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            log_info "✓ Sitio respondiendo correctamente (HTTP 200)"
        else
            log_warn "El sitio respondió con código HTTP: $HTTP_CODE"
        fi
    fi
fi

log_info "🎉 Despliegue completado exitosamente!"

if [ "$ENV" = "produccion" ]; then
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Verificar que el sitio esté accesible en tu dominio"
    echo "   2. Revisar logs: pm2 logs madsjeez"
    echo "   3. Monitorear métricas: pm2 monit"
fi
