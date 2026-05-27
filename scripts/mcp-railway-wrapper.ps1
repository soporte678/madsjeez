# Railway MCP Server Wrapper (Windows)
# Verifica que Railway CLI este instalada antes de ejecutar

$ErrorActionPreference = "Stop"

try {
    $version = railway --version 2>$null
    if (-not $version) {
        throw "Railway CLI no encontrada"
    }
} catch {
    Write-Error "Railway CLI no esta instalada"
    Write-Host "Instalala con: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "O descargala desde: https://docs.railway.app/guides/cli" -ForegroundColor Yellow
    exit 1
}

try {
    $whoami = railway whoami 2>$null
    if (-not $whoami) {
        throw "No hay sesion"
    }
} catch {
    Write-Error "No hay sesion activa en Railway"
    Write-Host "Ejecuta: railway login" -ForegroundColor Yellow
    exit 1
}

& railway mcp run
