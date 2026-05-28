#!/usr/bin/env bash
###############################################################################
# JARVIS Railway Logs - Linux/Mac
# Obtiene logs de Railway del proyecto madsjeez usando MCP/Railway CLI
# Uso:
#   ./jarvis-railway-logs.sh              # Logs recientes
#   ./jarvis-railway-logs.sh --tail       # Stream en tiempo real
#   ./jarvis-railway-logs.sh --lines 100  # Ultimas 100 lineas
#   ./jarvis-railway-logs.sh --save       # Guardar en archivo
###############################################################################

set -euo pipefail

# ── Colores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ── Configuracion ──
RAILWAY_CLI_PATH="${RAILWAY_CLI_PATH:-$HOME/.npm-global/bin/railway}"
PROJECT_NAME="brilliant-elegance"
SERVICE_NAME="madsjeez"
ENVIRONMENT="production"
DEFAULT_LINES=50

# ── Parametros ──
TAIL=false
LINES=$DEFAULT_LINES
SAVE=false
SAVE_PATH=""
JSON=false

# ── Parse args ──
while [[ $# -gt 0 ]]; do
    case $1 in
        --tail|-t)
            TAIL=true
            shift
            ;;
        --lines|-n)
            LINES="$2"
            shift 2
            ;;
        --save|-s)
            SAVE=true
            SAVE_PATH="${2:-}"
            shift
            [[ -n "${SAVE_PATH:-}" && ! "$SAVE_PATH" =~ ^-- ]] || { SAVE_PATH=""; }
            [[ -n "$SAVE_PATH" ]] && shift || true
            ;;
        --json|-j)
            JSON=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Opcion desconocida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# ── Helpers ──
show_help() {
    cat << 'HELP'
Uso: jarvis-railway-logs.sh [OPCIONES]

Obtiene logs del servicio madsjeez en Railway.

OPCIONES:
    --tail, -t          Stream logs en tiempo real
    --lines N, -n N     Numero de lineas a mostrar (default: 50)
    --save [PATH], -s   Guardar logs en archivo
    --json, -j          Formato JSON
    --help, -h          Mostrar esta ayuda

EJEMPLOS:
    ./jarvis-railway-logs.sh                    # 50 lineas recientes
    ./jarvis-railway-logs.sh --tail             # Stream en vivo
    ./jarvis-railway-logs.sh --lines 200        # 200 lineas
    ./jarvis-railway-logs.sh --save logs.txt    # Guardar a archivo

VARIABLES DE ENTORNO:
    RAILWAY_CLI_PATH    Ruta al binario railway (default: ~/.npm-global/bin/railway)
    RAILWAY_TOKEN       Token de autenticacion de Railway
HELP
}

print_header() {
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║           JARVIS RAILWAY LOGS                                 ║${NC}"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "  ${DIM}Project:${NC}  ${YELLOW}$PROJECT_NAME${NC}"
    echo -e "  ${DIM}Service:${NC}  ${YELLOW}$SERVICE_NAME${NC}"
    echo -e "  ${DIM}Env:${NC}      ${YELLOW}$ENVIRONMENT${NC}"
    echo ""
}

# ── Detectar Railway CLI ──
detect_railway() {
    local candidates=(
        "$RAILWAY_CLI_PATH"
        "$HOME/.npm-global/bin/railway"
        "$HOME/.nvm/current/bin/railway"
        "/usr/local/bin/railway"
        "/usr/bin/railway"
    )

    # Buscar en PATH
    if command -v railway &>/dev/null; then
        echo "$(command -v railway)"
        return 0
    fi

    for cand in "${candidates[@]}"; do
        if [[ -x "$cand" ]]; then
            echo "$cand"
            return 0
        fi
    done

    return 1
}

# ── Formatear log line ──
format_log_line() {
    local line="$1"

    # Detectar timestamps ISO 8601
    if [[ "$line" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T ]]; then
        local timestamp="${line%%Z*}"
        timestamp="${timestamp:0:19}"
        local rest="${line#*Z }"

        # Nivel de log
        local level_color="$NC"
        if [[ "$rest" =~ [Ee][Rr][Rr][Oo][Rr] ]]; then
            level_color="$RED"
        elif [[ "$rest" =~ [Ww][Aa][Rr][Nn]([Ii][Nn][Gg])? ]]; then
            level_color="$YELLOW"
        elif [[ "$rest" =~ [Ii][Nn][Ff][Oo] ]]; then
            level_color="$GREEN"
        elif [[ "$rest" =~ [Dd][Ee][Bb][Uu][Gg] ]]; then
            level_color="$DIM"
        fi

        echo -e "${DIM}${timestamp}${NC}  ${level_color}${rest}${NC}"
    else
        echo "$line"
    fi
}

# ── Obtener logs via Railway CLI ──
get_logs_cli() {
    local railway_bin="$1"
    local output=""

    echo -e "  ${DIM}Obteniendo logs via Railway CLI...${NC}"

    # Construir comando
    local cmd=("$railway_bin" "logs")

    if $TAIL; then
        echo -e "  ${CYAN}📡 Modo streaming activado (Ctrl+C para salir)${NC}"
        echo ""
    fi

    # Ejecutar
    if $TAIL; then
        "$railway_bin" logs 2>&1 | while IFS= read -r line; do
            format_log_line "$line"
        done
    else
        # Para logs historicos, intentar con --lines
        local raw_logs
        raw_logs=$("$railway_bin" logs --lines "$LINES" 2>&1) || {
            # Fallback: railway logs sin filtro y head
            raw_logs=$("$railway_bin" logs 2>&1 | head -n "$LINES")
        }

        if [[ -z "$raw_logs" ]]; then
            echo -e "${YELLOW}  ⚠️  No se obtuvieron logs${NC}"
            return 1
        fi

        if $SAVE; then
            if [[ -z "$SAVE_PATH" ]]; then
                SAVE_PATH="railway-logs-$(date +%Y%m%d-%H%M%S).txt"
            fi
            echo "$raw_logs" > "$SAVE_PATH"
            echo -e "${GREEN}  ✅ Logs guardados en: ${YELLOW}$SAVE_PATH${NC}"
        fi

        echo "$raw_logs" | while IFS= read -r line; do
            format_log_line "$line"
        done
    fi
}

# ── Obtener deployments ──
show_deployments() {
    local railway_bin="$1"

    echo -e "\n${BLUE}${BOLD}📦 Ultimos deployments${NC}"
    echo -e "${DIM}────────────────────────────────────────${NC}"

    local deps
    deps=$("$railway_bin" deployments list 2>&1 | head -20) || {
        echo -e "${YELLOW}  ⚠️  No se pudieron obtener deployments${NC}"
        return
    }

    echo "$deps" | while IFS= read -r line; do
        if [[ "$line" =~ SUCCESS ]]; then
            echo -e "  ${GREEN}✓${NC} $line"
        elif [[ "$line" =~ FAILED|ERROR ]]; then
            echo -e "  ${RED}✗${NC} $line"
        elif [[ "$line" =~ BUILDING|DEPLOYING ]]; then
            echo -e "  ${YELLOW}⟳${NC} $line"
        else
            echo "     $line"
        fi
    done
}

# ── Obtener status del servicio ──
show_service_status() {
    local railway_bin="$1"

    echo -e "\n${BLUE}${BOLD}📊 Estado del servicio${NC}"
    echo -e "${DIM}────────────────────────────────────────${NC}"

    local status
    status=$("$railway_bin" status 2>&1) || {
        echo -e "${YELLOW}  ⚠️  No se pudo obtener status${NC}"
        return
    }

    echo "$status" | while IFS= read -r line; do
        if [[ "$line" =~ project|Project ]]; then
            echo -e "  ${CYAN}▸${NC} $line"
        elif [[ "$line" =~ service|Service ]]; then
            echo -e "  ${MAGENTA}▸${NC} $line"
        elif [[ "$line" =~ production|Production ]]; then
            echo -e "  ${GREEN}▸${NC} $line"
        else
            echo "     $line"
        fi
    done
}

# ── Main ──
main() {
    print_header

    # Verificar CLI
    local railway_bin
    railway_bin=$(detect_railway) || {
        echo -e "${RED}❌ Railway CLI no encontrado${NC}"
        echo -e "${YELLOW}   Ruta esperada: $RAILWAY_CLI_PATH${NC}"
        echo -e "${YELLOW}   Instalar: npm install -g @railway/cli${NC}"
        exit 1
    }

    echo -e "  ${GREEN}✅ Railway CLI encontrado:${NC} ${YELLOW}$railway_bin${NC}"

    # Verificar autenticacion
    if ! "$railway_bin" whoami &>/dev/null; then
        echo -e "${RED}❌ Railway CLI no autenticado${NC}"
        echo -e "${YELLOW}   Ejecuta: railway login${NC}"
        exit 1
    fi

    echo -e "  ${GREEN}✅ Railway autenticado${NC}"

    # Mostrar status
    show_service_status "$railway_bin"

    # Mostrar deployments
    show_deployments "$railway_bin"

    # Obtener logs
    echo -e "\n${BLUE}${BOLD}📝 Logs${NC}"
    echo -e "${DIM}────────────────────────────────────────${NC}"

    if $TAIL; then
        echo -e "${CYAN}Iniciando stream de logs...${NC}"
        get_logs_cli "$railway_bin"
    else
        echo -e "  ${DIM}Mostrando ultimas $LINES lineas...${NC}\n"
        get_logs_cli "$railway_bin"
    fi

    echo ""
}

main "$@"
