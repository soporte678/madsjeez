#!/bin/bash

# Script de despliegue para Railway
# Uso: ./deploy-railway.sh

set -e

echo "🚂 MADSJEEZ Marketplace - Despliegue en Railway"
echo "================================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI no está instalado"
    echo "Instálalo con: npm install -g @railway/cli"
    exit 1
fi

log_info "✓ Railway CLI detectado"

# Verificar login
if ! railway whoami &> /dev/null; then
    log_warn "No has iniciado sesión en Railway"
    echo "Ejecuta: railway login"
    exit 1
fi

log_info "✓ Sesión activa en Railway"

# Verificar archivo .env.production
if [ ! -f "apps/web/.env.production" ]; then
    log_warn "No se encontró apps/web/.env.production"
    if [ -f "apps/web/.env.local" ]; then
        log_info "Copiando .env.local a .env.production"
        cp apps/web/.env.local apps/web/.env.production
    else
        log_error "Crea el archivo apps/web/.env.production con tus variables"
        exit 1
    fi
fi

# Verificar si el proyecto está inicializado
if [ ! -f ".railway/config.json" ]; then
    log_step "Inicializando proyecto en Railway..."
    railway init
else
    log_info "✓ Proyecto ya inicializado"
fi

# Verificar variables de entorno
log_step "Verificando variables de entorno..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! railway variables get "$var" > /dev/null 2>&1; then
        log_warn "Variable $var no está configurada"
        
        # Leer del archivo .env.production
        value=$(grep "^$var=" apps/web/.env.production | cut -d'=' -f2-)
        
        if [ -n "$value" ]; then
            log_info "Configurando $var desde .env.production"
            railway variables set "$var=$value"
        else
            log_error "No se encontró valor para $var"
            exit 1
        fi
    fi
done

log_info "✓ Variables de entorno configuradas"

# Desplegar
log_step "Iniciando despliegue..."
railway up --detach

# Verificar estado
log_step "Verificando despliegue..."
sleep 5

if railway status | grep -q "DEPLOYED"; then
    log_info "✓ Despliegue exitoso!"
    
    # Obtener URL
    URL=$(railway domain)
    if [ -n "$URL" ]; then
        echo ""
        echo "🌐 Tu aplicación está disponible en:"
        echo "   $URL"
        echo ""
    fi
    
    echo "📋 Próximos pasos:"
    echo "   1. Configura tu dominio personalizado en Railway"
    echo "   2. Actualiza los DNS en DonWeb"
    echo "   3. Configura Supabase con la nueva URL"
    echo ""
    echo "📖 Ver guía completa: RAILWAY_DEPLOYMENT.md"
    
else
    log_error "El despliegue falló"
    echo "Revisa los logs: railway logs"
    exit 1
fi
