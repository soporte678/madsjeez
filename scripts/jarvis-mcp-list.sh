#!/usr/bin/env bash
###############################################################################
# JARVIS MCP List - Linux/Mac
# Lista todos los MCP servers configurados y sus tools disponibles
# Uso: ./jarvis-mcp-list.sh [--json] [--raw]
###############################################################################

set -euo pipefail

# ── Colores ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m'
DIM='\033[2m'

# ── Configuracion ──
MCP_CONFIGS=(
    "$HOME/.cursor/mcp.json"
    "$HOME/.claude.json"
    "$HOME/.codex/config.toml"
    "$HOME/.config/mcp/servers.json"
)
OUTPUT_JSON=false
OUTPUT_RAW=false

# ── Parse args ──
for arg in "$@"; do
    case $arg in
        --json) OUTPUT_JSON=true ;;
        --raw)  OUTPUT_RAW=true ;;
    esac
done

# ── Helpers ──
print_header() {
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║           JARVIS MCP SERVER LIST                              ║${NC}"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_server_header() {
    local name="$1"
    local type="$2"
    local source="$3"
    echo -e "\n${WHITE}${BOLD}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${WHITE}${BOLD}│ 🔌 Server: ${CYAN}${BOLD}${name}${NC}${WHITE}${BOLD}$(printf '%*s' $((46 - ${#name})) '')│${NC}"
    echo -e "${WHITE}${BOLD}│${DIM}    Type: ${type}$(printf '%*s' $((54 - ${#type})) '')${NC}${WHITE}${BOLD}│${NC}"
    echo -e "${WHITE}${BOLD}│${DIM}    Source: ${source}$(printf '%*s' $((52 - ${#source})) '')${NC}${WHITE}${BOLD}│${NC}"
    echo -e "${WHITE}${BOLD}└────────────────────────────────────────────────────────────┘${NC}"
}

# ── Detectar tools de un package MCP ──
detect_tools_from_package() {
    local pkg="$1"
    local tools=()

    case "$pkg" in
        *chrome-devtools-mcp*)
            tools=("chrome_navigate" "chrome_click" "chrome_type" "chrome_screenshot" "chrome_evaluate" "chrome_get_dom")
            ;;
        *playwright-mcp*)
            tools=("browser_navigate" "browser_click" "browser_type" "browser_screenshot" "browser_select_option" "browser_evaluate")
            ;;
        *github*)
            tools=("github_search_repos" "github_get_repo" "github_list_issues" "github_create_issue" "github_list_pulls" "github_create_pull")
            ;;
        *supabase*)
            tools=("supabase_query" "supabase_insert" "supabase_update" "supabase_delete" "supabase_rpc")
            ;;
        *railway*)
            tools=("railway_deployments" "railway_logs" "railway_variables" "railway_status")
            ;;
        *)
            tools=("<tools no detectados - revisar documentacion del package>")
            ;;
    esac

    printf '%s\n' "${tools[@]}"
}

# ── Extraer servers de JSON ──
parse_json_config() {
    local file="$1"
    local source_name="$2"

    if ! command -v python3 &>/dev/null; then
        echo -e "${RED}  ❌ python3 no disponible para parsear JSON${NC}"
        return
    fi

    python3 << PYEOF
import json, sys

try:
    with open("$file", "r") as f:
        data = json.load(f)
except Exception as e:
    sys.exit(0)

# Estructura: { "mcpServers": { "name": { ... } } }
servers = data.get("mcpServers", {})
if not servers:
    # Probar estructura plana { "name": { ... } }
    if isinstance(data, dict):
        # Buscar keys que parezcan servers (tienen command o url)
        for k, v in data.items():
            if isinstance(v, dict) and ("command" in v or "url" in v or "type" in v):
                servers[k] = v

for name, config in servers.items():
    cmd = config.get("command", "N/A")
    args = config.get("args", [])
    env = config.get("env", {})
    server_type = config.get("type", "stdio")
    url = config.get("url", "")
    transport = "SSE" if url else "stdio"

    args_str = " ".join(str(a) for a in args)
    env_str = ", ".join(f"{k}={v[:10]}..." if len(str(v)) > 10 else f"{k}={v}" for k, v in env.items()) if env else "<none>"

    print(f"SERVER_START|{name}|{server_type}|{transport}|{source_name}")
    print(f"CMD|{cmd} {args_str}")
    if env_str != "<none>":
        print(f"ENV|{env_str}")
PYEOF
}

# ── Extraer servers de TOML ──
parse_toml_config() {
    local file="$1"
    local source_name="$2"

    if ! command -v python3 &>/dev/null; then
        echo -e "${RED}  ❌ python3 no disponible para parsear TOML${NC}"
        return
    fi

    python3 << PYEOF
import sys

try:
    import tomllib
    with open("$file", "rb") as f:
        data = tomllib.load(f)
except Exception:
    try:
        import toml
        with open("$file", "r") as f:
            data = toml.load(f)
    except Exception:
        sys.exit(0)

# Buscar seccion [mcp.servers] o similar
servers = {}
if "mcp" in data and isinstance(data["mcp"], dict):
    if "servers" in data["mcp"]:
        servers = data["mcp"]["servers"]

for name, config in servers.items():
    if isinstance(config, dict):
        cmd = config.get("command", "N/A")
        args = config.get("args", [])
        env = config.get("env", {})
        server_type = config.get("type", "stdio")
        url = config.get("url", "")
        transport = "SSE" if url else "stdio"

        args_str = " ".join(str(a) for a in args)
        env_str = ", ".join(f"{k}={v}" for k, v in env.items()) if env else "<none>"

        print(f"SERVER_START|{name}|{server_type}|{transport}|{source_name}")
        print(f"CMD|{cmd} {args_str}")
        if env_str != "<none>":
            print(f"ENV|{env_str}")
PYEOF
}

# ── Output JSON ──
output_json() {
    if ! command -v python3 &>/dev/null; then
        echo '{"error": "python3 requerido para output JSON"}'
        return
    fi

    python3 << 'PYEOF'
import json, os, glob

mcp_configs = [
    os.path.expanduser("~/.cursor/mcp.json"),
    os.path.expanduser("~/.claude.json"),
    os.path.expanduser("~/.codex/config.toml"),
    os.path.expanduser("~/.config/mcp/servers.json"),
]

servers = []
for cfg in mcp_configs:
    if not os.path.exists(cfg):
        continue
    source = os.path.basename(cfg)
    try:
        if cfg.endswith(".json"):
            with open(cfg) as f:
                data = json.load(f)
            svrs = data.get("mcpServers", {})
            if not svrs and isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, dict) and ("command" in v or "url" in v):
                        svrs[k] = v
            for name, config in svrs.items():
                servers.append({
                    "name": name,
                    "source": source,
                    "config_file": cfg,
                    **config
                })
        elif cfg.endswith(".toml"):
            try:
                import tomllib
                with open(cfg, "rb") as f:
                    data = tomllib.load(f)
            except Exception:
                import toml
                with open(cfg) as f:
                    data = toml.load(f)
            mcp_data = data.get("mcp", {})
            if isinstance(mcp_data, dict) and "servers" in mcp_data:
                for name, config in mcp_data["servers"].items():
                    if isinstance(config, dict):
                        servers.append({
                            "name": name,
                            "source": source,
                            "config_file": cfg,
                            **config
                        })
    except Exception as e:
        pass

print(json.dumps({"servers": servers, "count": len(servers)}, indent=2))
PYEOF
}

# ── Output Raw ──
output_raw() {
    for cfg in "${MCP_CONFIGS[@]}"; do
        if [[ -f "$cfg" ]]; then
            echo "=== $cfg ==="
            cat "$cfg"
            echo ""
        fi
    done
}

# ── Main ──
main() {
    if $OUTPUT_JSON; then
        output_json
        return
    fi

    if $OUTPUT_RAW; then
        output_raw
        return
    fi

    print_header

    local total_servers=0
    local total_configs=0

    for cfg in "${MCP_CONFIGS[@]}"; do
        local source_name
        source_name=$(basename "$cfg")

        if [[ -f "$cfg" ]]; then
            ((total_configs++)) || true
            local ext="${cfg##*.}"

            if [[ "$ext" == "json" ]]; then
                while IFS='|' read -r key val1 val2 val3 val4 val5; do
                    if [[ "$key" == "SERVER_START" ]]; then
                        print_server_header "$val1" "$val2 ($val3)" "$val4"
                        ((total_servers++)) || true
                    elif [[ "$key" == "CMD" ]]; then
                        echo -e "  ${DIM}Command:${NC}  ${YELLOW}$val1${NC}"
                    elif [[ "$key" == "ENV" ]]; then
                        echo -e "  ${DIM}Env:${NC}      ${MAGENTA}$val1${NC}"
                    fi
                done < <(parse_json_config "$cfg" "$source_name")
            elif [[ "$ext" == "toml" ]]; then
                while IFS='|' read -r key val1 val2 val3 val4 val5; do
                    if [[ "$key" == "SERVER_START" ]]; then
                        print_server_header "$val1" "$val2 ($val3)" "$val4"
                        ((total_servers++)) || true
                    elif [[ "$key" == "CMD" ]]; then
                        echo -e "  ${DIM}Command:${NC}  ${YELLOW}$val1${NC}"
                    elif [[ "$key" == "ENV" ]]; then
                        echo -e "  ${DIM}Env:${NC}      ${MAGENTA}$val1${NC}"
                    fi
                done < <(parse_toml_config "$cfg" "$source_name")
            fi
        fi
    done

    # Resumen
    echo ""
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  RESUMEN${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}Configs encontrados:${NC}  ${BOLD}$total_configs${NC}"
    echo -e "  ${GREEN}Servers configurados:${NC} ${BOLD}$total_servers${NC}"

    # Tools disponibles conocidos
    echo ""
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  TOOLS CONOCIDOS POR SERVERS COMUNES${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"

    local known_packages=("chrome-devtools-mcp" "@playwright/mcp" "github" "supabase" "railway")
    for pkg in "${known_packages[@]}"; do
        echo -e "\n  ${YELLOW}${BOLD}$pkg${NC}"
        detect_tools_from_package "$pkg" | while read -r tool; do
            echo -e "     ${GREEN}▸${NC} ${DIM}$tool${NC}"
        done
    done

    echo ""
}

main "$@"
