# Configura .env.local para Bot WhatsApp + Ollama (Windows)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/setup-whatsapp-bot-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root ".env.local"

Write-Host "=== Madsjeez — setup Bot WhatsApp local ===" -ForegroundColor Cyan

# Ollama
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host "Ollama no está en PATH. Instalá: winget install Ollama.Ollama -e" -ForegroundColor Red
  exit 1
}
$ver = ollama --version 2>&1
Write-Host "Ollama: $ver" -ForegroundColor Green

try {
  $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
  $names = @($tags.models | ForEach-Object { $_.name })
  Write-Host "Modelos: $($names -join ', ')" -ForegroundColor Green
  if ($names -notcontains "qwen2.5:3b") { Write-Host "Descargando qwen2.5:3b..."; ollama pull qwen2.5:3b }
} catch {
  Write-Host "Ollama no responde en :11434. Abrí la app Ollama o ejecutá: ollama serve" -ForegroundColor Red
  exit 1
}

# Railway CLI opcional
$evoKey = $null
$webhookSecret = $null
if (Get-Command railway -ErrorAction SilentlyContinue) {
  Write-Host "`nRailway CLI detectado. ¿Sincronizar EVOLUTION_* desde proyecto linked? (s/N)" -ForegroundColor Yellow
  $sync = Read-Host
  if ($sync -match '^[sSyY]') {
    Push-Location $root
    try {
      $vars = railway variables --json 2>$null | ConvertFrom-Json
      if ($vars.EVOLUTION_API_KEY) { $evoKey = $vars.EVOLUTION_API_KEY }
      if ($vars.EVOLUTION_WEBHOOK_SECRET) { $webhookSecret = $vars.EVOLUTION_WEBHOOK_SECRET }
      Write-Host "Variables Evolution leídas desde Railway." -ForegroundColor Green
    } catch {
      Write-Host "No se pudieron leer variables. Ejecutá: railway link (proyecto grand-education, servicio madsjeez)" -ForegroundColor Yellow
    }
    Pop-Location
  }
}

if (-not $evoKey) {
  Write-Host "`nPegá EVOLUTION_API_KEY (misma que AUTHENTICATION_API_KEY en Evolution Railway):" -ForegroundColor Yellow
  $evoKey = Read-Host -AsSecureString
  $evoKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($evoKey))
}
if (-not $webhookSecret) {
  Write-Host "Pegá EVOLUTION_WEBHOOK_SECRET (Railway madsjeez):" -ForegroundColor Yellow
  $webhookSecret = Read-Host -AsSecureString
  $webhookSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($webhookSecret))
}

$content = @"
# .env.local — Bot WhatsApp + Ollama ($(Get-Date -Format 'yyyy-MM-dd'))
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b

EVOLUTION_API_URL=https://evolution-api-production-85514.up.railway.app
EVOLUTION_API_KEY=$evoKey
EVOLUTION_WEBHOOK_SECRET=$webhookSecret
EVOLUTION_DEFAULT_INSTANCE_PREFIX=madsjeez_seller_
"@

Set-Content -Path $envFile -Value $content -Encoding UTF8
Write-Host "`nGuardado: $envFile" -ForegroundColor Green
Write-Host "Siguiente: cd madsjeez && npm run dev" -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:3000/dashboard#whatsapp-bot" -ForegroundColor Cyan
