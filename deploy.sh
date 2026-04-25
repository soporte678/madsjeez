#!/bin/bash
# Script de deploy para Railway - MADSJEEZ Marketplace

set -e

echo "🚀 Iniciando deploy de MadsJeez..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Build de Next.js
echo "🏗️ Building Next.js..."
npm run build

# Verificar build
if [ ! -d ".next" ]; then
    log_error "El build falló - no se encontró directorio .next"
    exit 1
fi

log_info "✓ Build completado exitosamente"

echo "✅ Deploy completado!"
