# ============================================================================
# mcp-railway-wrapper.ps1
# Wrapper para Railway MCP con Device Authorization Grant (OAuth PKCE)
# Autentica automaticamente y ejecuta: railway mcp run
# ============================================================================

param(
    [string]$ClientId = $env:RAILWAY_CLIENT_ID
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuracion
# ============================================================================
$TokenFile = Join-Path $env:USERPROFILE ".jarvis\railway-token.json"
$TokenDir  = Split-Path $TokenFile -Parent
if (!(Test-Path $TokenDir)) {
    New-Item -ItemType Directory -Path $TokenDir -Force | Out-Null
}

# ============================================================================
# Funciones
# ============================================================================

function Write-Log([string]$msg) {
    Add-Content -Path (Join-Path $TokenDir "railway-mcp.log") -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg" -ErrorAction SilentlyContinue
}

function Get-StoredToken() {
    if (Test-Path $TokenFile) {
        try {
            $data = Get-Content $TokenFile -Raw | ConvertFrom-Json
            $expiry = [datetime]::Parse($data.expires_at)
            if ($expiry -gt (Get-Date).AddMinutes(5)) {
                return $data.access_token
            }
        } catch { }
    }
    return $null
}

function Save-Token($accessToken, $refreshToken, $expiresIn) {
    $expiresAt = (Get-Date).AddSeconds($expiresIn).ToString("o")
    $data = @{
        access_token  = $accessToken
        refresh_token = $refreshToken
        expires_at    = $expiresAt
    }
    $data | ConvertTo-Json | Set-Content $TokenFile -Force
}

# ============================================================================
# Device Authorization Grant (PKCE para CLI/MCP)
# ============================================================================

function Start-DeviceFlow() {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  JARVIS Railway Authentication" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Step 1: Request device code
    $deviceBody = @{
        client_id = $ClientId
        scope     = "project:read project:write environment:read environment:write service:read service:write deployment:read deployment:write"
    }

    try {
        $deviceResp = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql/internal/device_authorization" `
            -Method POST -ContentType "application/json" `
            -Body ($deviceBody | ConvertTo-Json) -TimeoutSec 30
    } catch {
        # Fallback: try direct Railway login
        Write-Host "Starting Railway CLI login..." -ForegroundColor Yellow
        & railway login 2>&1 | Out-Null
        return
    }

    $verificationUri = $deviceResp.verification_uri_complete
    $userCode        = $deviceResp.user_code
    $deviceCode      = $deviceResp.device_code
    $expiresIn       = $deviceResp.expires_in
    $interval        = $deviceResp.interval

    Write-Host "1. Abri esta URL en tu navegador:" -ForegroundColor White
    Write-Host "   $verificationUri" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. O anda a: $($deviceResp.verification_uri)" -ForegroundColor White
    Write-Host "   y ingresa el codigo: $userCode" -ForegroundColor Yellow
    Write-Host ""

    # Try to open browser automatically
    try { Start-Process $verificationUri } catch { }

    # Step 2: Poll for token
    $startTime = Get-Date
    Write-Host "Esperando autorizacion..." -ForegroundColor Cyan

    while ((Get-Date) -lt $startTime.AddSeconds($expiresIn)) {
        Start-Sleep -Seconds $interval

        $tokenBody = @{
            client_id   = $ClientId
            device_code = $deviceCode
            grant_type  = "urn:ietf:params:oauth:grant-type:device_code"
        }

        try {
            $tokenResp = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql/internal/token" `
                -Method POST -ContentType "application/json" `
                -Body ($tokenBody | ConvertTo-Json) -TimeoutSec 15

            if ($tokenResp.access_token) {
                Save-Token $tokenResp.access_token $tokenResp.refresh_token $tokenResp.expires_in
                $env:RAILWAY_TOKEN = $tokenResp.access_token
                Write-Host ""
                Write-Host "Autenticacion exitosa!" -ForegroundColor Green
                return
            }
        } catch {
            $err = $_.Exception.Response
            if ($err -and $err.StatusCode -eq 400) {
                $body = $err.GetResponseStream() | ForEach-Object { $_ }
                if ($body -like "*authorization_pending*") { continue }
                if ($body -like "*slow_down*") { $interval += 5; continue }
                if ($body -like "*expired_token*") { throw "Token expirado. Reintenta." }
                if ($body -like "*access_denied*") { throw "Acceso denegado por el usuario." }
            }
        }
    }

    throw "Timeout esperando autorizacion."
}

# ============================================================================
# MAIN
# ============================================================================

Write-Log "Iniciando Railway MCP wrapper"

# Check stored token
$token = Get-StoredToken
if ($token) {
    Write-Log "Usando token almacenado"
    $env:RAILWAY_TOKEN = $token
} else {
    Write-Log "Token no encontrado o expirado, iniciando Device Flow"
    Start-DeviceFlow
}

# Run Railway MCP
Write-Log "Ejecutando: railway mcp run"
& railway mcp run
