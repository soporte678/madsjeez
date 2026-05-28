#!/usr/bin/env bash
###############################################################################
# JARVIS MCP Doctor - Linux/Mac
# Verifica el estado completo del entorno JARVIS MCP
# Uso: ./jarvis-doctor.sh
###############################################################################

set -euo pipefail

# ── Colores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Configuracion ──
RAILWAY_CLI_PATH="${RAILWAY_CLI_PATH:-$HOME/.npm-global/bin/railway}"
MCP_CONFIGS=(
    "$HOME/.cursor/mcp.json"
    "$HOME/.claude.json"
    "$HOME/.codex/config.toml"
    "$HOME/.config/mcp/servers.json"
)
MCP_PACKAGES=(
    "chrome-devtools-mcp"
    "@playwright/mcp"
)
PROJECT_NAME="brilliant-elegance"
SERVICE_NAME="madsjeez"

PASS=0
FAIL=0
WARN=0

# ── Helpers ──
print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║           JARVIS MCP DOCTOR - Linux/Mac Edition               ║${NC}"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "\n${BLUE}${BOLD}▶ $1${NC}"
    echo -e "${BLUE}$(printf '%.s─' $(seq 1 60))${NC}"
}

check_pass() {
    echo -e "  ${GREEN}✅${NC} $1"
    ((PASS++)) || true
}

check_fail() {
    echo -e "  ${RED}❌${NC} $1"
    ((FAIL++)) || true
}

check_warn() {
    echo -e "  ${YELLOW}⚠️${NC}  $1"
    ((WARN++)) || true
}

# Verifica si un comando existe
command_exists() {
    command -v "$1" &>/dev/null
}

# ── 1. Railway CLI ──
check_railway_cli() {
    print_section "Railway CLI"

    if [[ -x "$RAILWAY_CLI_PATH" ]]; then
        local version
        version=$("$RAILWAY_CLI_PATH" --version 2>/dev/null || echo "unknown")
        check_pass "Railway CLI encontrado: ${YELLOW}$version${NC}"

        # Verificar autenticacion
        if "$RAILWAY_CLI_PATH" whoami &>/dev/null; then
            local user
            user=$("$RAILWAY_CLI_PATH" whoami 2>/dev/null | head -1)
            check_pass "Railway autenticado: ${YELLOW}$user${NC}"
        else
            check_fail "Railway CLI no autenticado. Ejecuta: railway login"
        fi
    else
        check_fail "Railway CLI no encontrado en: ${YELLOW}$RAILWAY_CLI_PATH${NC}"
        check_warn "Instalar: npm install -g @railway/cli"
    fi
}

# ── 2. MCP Packages ──
check_mcp_packages() {
    print_section "MCP Packages (npm)"

    local npm_root
    npm_root=$(npm root -g 2>/dev/null || echo "")

    for pkg in "${MCP_PACKAGES[@]}"; do
        local pkg_path=""
        if [[ -n "$npm_root" && -d "$npm_root/$pkg" ]]; then
            pkg_path="$npm_root/$pkg"
        elif command_exists npx && npx --no-install "$pkg" --version &>/dev/null 2>&1; then
            pkg_path="(via npx)"
        fi

        if [[ -n "$pkg_path" ]]; then
            check_pass "${YELLOW}$pkg${NC} instalado"
        else
            # Buscar en node_modules globales alternativos
            local alt_paths=(
                "$HOME/.npm-global/lib/node_modules/$pkg"
                "$HOME/.nvm/current/lib/node_modules/$pkg"
                "/usr/local/lib/node_modules/$pkg"
                "/usr/lib/node_modules/$pkg"
            )
            local found=0
            for alt in "${alt_paths[@]}"; do
                if [[ -d "$alt" ]]; then
                    check_pass "${YELLOW}$pkg${NC} instalado en: ${YELLOW}$alt${NC}"
                    found=1
                    break
                fi
            done
            if [[ $found -eq 0 ]]; then
                check_fail "${YELLOW}$pkg${NC} no instalado"
                check_warn "Instalar: npm install -g $pkg"
            fi
        fi
    done
}

# ── 3. Playwright Browsers ──
check_playwright_browsers() {
    print_section "Playwright Browsers"

    local playwright_chromium_path="$HOME/.cache/ms-playwright/chromium-*"
    local playwright_firefox_path="$HOME/.cache/ms-playwright/firefox-*"
    local playwright_webkit_path="$HOME/.cache/ms-playwright/webkit-*"

    # macOS usa Library en vez de .cache
    if [[ "$OSTYPE" == "darwin"* ]]; then
        playwright_chromium_path="$HOME/Library/Caches/ms-playwright/chromium-*"
        playwright_firefox_path="$HOME/Library/Caches/ms-playwright/firefox-*"
        playwright_webkit_path="$HOME/Library/Caches/ms-playwright/webkit-*"
    fi

    local browsers_found=0

    if ls $playwright_chromium_path 1>/dev/null 2>&1; then
        check_pass "Chromium instalado"
        ((browsers_found++)) || true
    else
        check_fail "Chromium no instalado"
    fi

    if ls $playwright_firefox_path 1>/dev/null 2>&1; then
        check_pass "Firefox instalado"
        ((browsers_found++)) || true
    else
        check_fail "Firefox no instalado"
    fi

    if ls $playwright_webkit_path 1>/dev/null 2>&1; then
        check_pass "WebKit instalado"
        ((browsers_found++)) || true
    else
        check_fail "WebKit no instalado"
    fi

    if [[ $browsers_found -eq 0 ]]; then
        check_warn "Instalar browsers: npx playwright install"
    fi
}

# ── 4. MCP Config Files ──
check_mcp_configs() {
    print_section "MCP Config Files"

    local any_found=0
    for cfg in "${MCP_CONFIGS[@]}"; do
        if [[ -f "$cfg" ]]; then
            check_pass "Config encontrado: ${YELLOW}$cfg${NC}"
            ((any_found++)) || true
        else
            check_fail "Config NO encontrado: ${YELLOW}$cfg${NC}"
        fi
    done

    if [[ $any_found -eq 0 ]]; then
        check_warn "Ningun archivo MCP config encontrado"
    fi
}

# ── 5. GitHub MCP ──
check_github_mcp() {
    print_section "GitHub MCP"

    local gh_found=0
    for cfg in "${MCP_CONFIGS[@]}"; do
        if [[ -f "$cfg" ]]; then
            if grep -qi "github" "$cfg" 2>/dev/null; then
                check_pass "GitHub MCP configurado en: ${YELLOW}$cfg${NC}"
                gh_found=1
                break
            fi
        fi
    done

    if [[ $gh_found -eq 0 ]]; then
        check_fail "GitHub MCP no configurado en ningun config file"
    fi

    # Verificar CLI de GitHub
    if command_exists gh; then
        local gh_version
        gh_version=$(gh --version 2>/dev/null | head -1)
        check_pass "GitHub CLI: ${YELLOW}$gh_version${NC}"
        if gh auth status &>/dev/null; then
            check_pass "GitHub CLI autenticado"
        else
            check_warn "GitHub CLI no autenticado. Ejecuta: gh auth login"
        fi
    else
        check_warn "GitHub CLI (gh) no instalado"
    fi
}

# ── 6. Supabase MCP ──
check_supabase_mcp() {
    print_section "Supabase MCP"

    local sb_found=0
    for cfg in "${MCP_CONFIGS[@]}"; do
        if [[ -f "$cfg" ]]; then
            if grep -qi "supabase" "$cfg" 2>/dev/null; then
                check_pass "Supabase MCP configurado en: ${YELLOW}$cfg${NC}"
                sb_found=1
                break
            fi
        fi
    done

    if [[ $sb_found -eq 0 ]]; then
        check_fail "Supabase MCP no configurado en ningun config file"
    fi

    # Verificar CLI de Supabase
    if command_exists supabase; then
        local sb_version
        sb_version=$(supabase --version 2>/dev/null | head -1)
        check_pass "Supabase CLI: ${YELLOW}$sb_version${NC}"
    else
        check_warn "Supabase CLI no instalada"
    fi
}

# ── 7. Railway Project Linked ──
check_railway_project() {
    print_section "Railway Project Link"

    if [[ ! -x "$RAILWAY_CLI_PATH" ]]; then
        check_fail "Railway CLI no disponible para verificar proyecto"
        return
    fi

    # Verificar si hay un project linkeado en el directorio actual o global
    local project_info
    if "$RAILWAY_CLI_PATH" status 2>/dev/null | grep -qi "project\|brilliant-elegance\|madsjeez"; then
        project_info=$("$RAILWAY_CLI_PATH" status 2>/dev/null | head -20)
        if echo "$project_info" | grep -q "$PROJECT_NAME" 2>/dev/null; then
            check_pass "Proyecto linkeado: ${YELLOW}$PROJECT_NAME${NC}"
        else
            check_warn "Proyecto Railway linkeado (nombre diferente a $PROJECT_NAME)"
        fi

        if "$RAILWAY_CLI_PATH" status 2>/dev/null | grep -q "$SERVICE_NAME"; then
            check_pass "Service detectado: ${YELLOW}$SERVICE_NAME${NC}"
        else
            check_warn "Service '$SERVICE_NAME' no detectado en Railway status"
        fi
    else
        # Intentar verificar via railway link directamente
        if "$RAILWAY_CLI_PATH" status &>/dev/null; then
            check_pass "Railway project linkeado"
        else
            check_fail "Railway project no linkeado"
            check_warn "Ejecuta: railway link (en el directorio del proyecto)"
        fi
    fi
}

# ── 8. JSON Valid in Configs ──
check_json_valid() {
    print_section "JSON Valid en Configs MCP"

    for cfg in "${MCP_CONFIGS[@]}"; do
        if [[ ! -f "$cfg" ]]; then
            continue
        fi

        local ext="${cfg##*.}"
        if [[ "$ext" == "json" ]]; then
            if python3 -c "import json; json.load(open('$cfg'))" 2>/dev/null; then
                check_pass "JSON valido: ${YELLOW}$cfg${NC}"
            else
                check_fail "JSON INVALIDO: ${YELLOW}$cfg${NC}"
            fi
        elif [[ "$ext" == "toml" ]]; then
            if python3 -c "import tomllib; tomllib.load(open('$cfg','rb'))" 2>/dev/null || \
               python3 -c "import toml; toml.load('$cfg')" 2>/dev/null; then
                check_pass "TOML valido: ${YELLOW}$cfg${NC}"
            else
                check_fail "TOML INVALIDO: ${YELLOW}$cfg${NC}"
            fi
        fi
    done
}

# ── Summary ──
print_summary() {
    echo ""
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║                      RESUMEN                                  ║${NC}"
    echo -e "${CYAN}${BOLD}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${GREEN}✅ $PASS checks pasaron${NC}$(printf '%*s' $((45 - ${#PASS})) '')${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${RED}❌ $FAIL checks fallaron${NC}$(printf '%*s' $((44 - ${#FAIL})) '')${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}║${NC}  ${YELLOW}⚠️  $WARN advertencias${NC}$(printf '%*s' $((44 - ${#WARN})) '')${CYAN}${BOLD}║${NC}"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"

    if [[ $FAIL -gt 0 ]]; then
        echo ""
        echo -e "${RED}${BOLD}⚠️  Hay $FAIL problema(s) que requieren atencion.${NC}"
        echo -e "${YELLOW}   Revisa los checks fallidos arriba y sigue las sugerencias.${NC}"
        return 1
    elif [[ $WARN -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}${BOLD}ℹ️  Hay $WARN advertencia(s) a revisar.${NC}"
        return 0
    else
        echo ""
        echo -e "${GREEN}${BOLD}🎉 ¡Todo listo! JARVIS MCP esta completamente configurado.${NC}"
        return 0
    fi
}

# ── Main ──
main() {
    print_header

    check_railway_cli
    check_mcp_packages
    check_playwright_browsers
    check_mcp_configs
    check_github_mcp
    check_supabase_mcp
    check_railway_project
    check_json_valid

    print_summary
}

main "$@"
