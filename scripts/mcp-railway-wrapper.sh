#!/bin/bash
# Railway MCP Server Wrapper (Linux/macOS)
# Verifica que Railway CLI esté instalada antes de ejecutar

if ! command -v railway &> /dev/null; then
  echo "[ERROR] Railway CLI no está instalada" >&2
  echo "[INFO] Instalala con: npm install -g @railway/cli" >&2
  echo "[INFO] O descargala desde: https://docs.railway.app/guides/cli" >&2
  exit 1
fi

if ! railway whoami &> /dev/null; then
  echo "[ERROR] No hay sesión activa en Railway" >&2
  echo "[INFO] Ejecuta: railway login" >&2
  exit 1
fi

exec railway mcp run
