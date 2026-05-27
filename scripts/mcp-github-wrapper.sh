#!/bin/bash
# GitHub MCP Server Wrapper
# Lee GITHUB_PERSONAL_ACCESS_TOKEN del entorno o lo extrae de git remote

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  # Intentar extraer del remote de git
  REMOTE_URL=$(git -C "$(dirname "$0")/.." remote get-url origin 2>/dev/null)
  if [ -n "$REMOTE_URL" ]; then
    TOKEN=$(echo "$REMOTE_URL" | grep -oP 'ghp_[A-Za-z0-9_]+' | head -1)
    if [ -n "$TOKEN" ]; then
      export GITHUB_PERSONAL_ACCESS_TOKEN="$TOKEN"
    fi
  fi
fi

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[ERROR] GITHUB_PERSONAL_ACCESS_TOKEN no esta configurado" >&2
  echo "[INFO] Seteala con: export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_tu_token" >&2
  exit 1
fi

exec npx -y @github/mcp-server
