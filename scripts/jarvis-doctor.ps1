#Requires -Version 5.1
###############################################################################
# JARVIS MCP Doctor - Windows PowerShell 5.1
# Verifica el estado completo del entorno JARVIS MCP
# Uso: .\jarvis-doctor.ps1
# NOTA: Usa ; como separador (PowerShell 5.1 compatible)
###############################################################################

# ── Configuracion ──
$RAILWAY_CLI_PATH = if ($env:RAILWAY_CLI_PATH) { $env:RAILWAY_CLI_PATH } else { "$env:USERPROFILE\.npm-global\bin\railway.cmd" }
$MCP_CONFIGS = @(
    "$env:USERPROFILE\.cursor\mcp.json",
    "$env:USERPROFILE\.claude.json",
    "$env:USERPROFILE\.codex\config.toml",
    "$env:LOCALAPPDATA\mcp\servers.json",
    "$env:USERPROFILE\.config\mcp\servers.json"
)
$MCP_PACKAGES = @(
    "chrome-devtools-mcp",
    "@playwright/mcp"
)
$PROJECT_NAME = "brilliant-elegance"
$SERVICE_NAME = "madsjeez"

$script:PASS = 0
$script:FAIL = 0
$script:WARN = 0

# ── Helpers ──
function Write-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           JARVIS MCP DOCTOR - Windows Edition                  ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "> $Title" -ForegroundColor Blue
    Write-Host ("─" * 60) -ForegroundColor Blue
}

function Write-Pass {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
    $script:PASS++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor Red
    $script:FAIL++
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  ⚠️  $Message" -ForegroundColor Yellow
    $script:WARN++
}

function Test-CommandExists {
    param([string]$Cmd)
    $null = Get-Command $Cmd -ErrorAction SilentlyContinue
    return $? -and (Get-Command $Cmd -ErrorAction SilentlyContinue)
}

# ── 1. Railway CLI ──
function Check-RailwayCLI {
    Write-Section "Railway CLI"

    $railwayExists = $false
    $railwayPath = $null

    # Buscar railway en varias ubicaciones
    $candidates = @(
        $RAILWAY_CLI_PATH,
        "$env:USERPROFILE\.npm-global\bin\railway.cmd",
        "$env:USERPROFILE\.npm-global\bin\railway.exe",
        "$env:USERPROFILE\.npm-global\bin\railway",
        "$env:APPDATA\npm\railway.cmd",
        "$env:LOCALAPPDATA\railway\bin\railway.exe"
    )

    # Buscar en PATH tambien
    $pathRailway = Get-Command railway -ErrorAction SilentlyContinue
    if ($pathRailway) {
        $candidates += $pathRailway.Source
    }

    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $railwayExists = $true
            $railwayPath = $cand
            break
        }
    }

    if ($railwayExists) {
        try {
            $version = & $railwayPath --version 2>$null
            if (-not $version) { $version = "unknown" }
        } catch {
            $version = "unknown"
        }
        Write-Pass "Railway CLI encontrado: $version"

        # Verificar autenticacion
        try {
            $whoami = & $railwayPath whoami 2>$null
            if ($whoami) {
                Write-Pass "Railway autenticado: $whoami"
            } else {
                Write-Fail "Railway CLI no autenticado. Ejecuta: railway login"
            }
        } catch {
            Write-Fail "Railway CLI no autenticado. Ejecuta: railway login"
        }
    } else {
        Write-Fail "Railway CLI no encontrado"
        Write-Warn "Instalar: npm install -g @railway/cli"
    }
}

# ── 2. MCP Packages ──
function Check-McpPackages {
    Write-Section "MCP Packages (npm)"

    $npmRoot = $null
    try {
        $npmRoot = & npm root -g 2>$null
    } catch {
        $npmRoot = $null
    }

    foreach ($pkg in $MCP_PACKAGES) {
        $pkgFound = $false
        $safePkg = $pkg -replace "^@", "" -replace "/", "-"

        # Verificar en npm root global
        if ($npmRoot -and (Test-Path "$npmRoot\$pkg")) {
            Write-Pass "$pkg instalado"
            $pkgFound = $true
        }

        # Verificar en ubicaciones alternativas
        if (-not $pkgFound) {
            $altPaths = @(
                "$env:USERPROFILE\.npm-global\node_modules\$pkg",
                "$env:APPDATA\npm\node_modules\$pkg",
                "$env:ProgramFiles\nodejs\node_modules\$pkg",
                "$env:LOCALAPPDATA\nvm\current\node_modules\$pkg"
            )
            foreach ($alt in $altPaths) {
                if (Test-Path $alt) {
                    Write-Pass "$pkg instalado en: $alt"
                    $pkgFound = $true
                    break
                }
            }
        }

        # Verificar via npx
        if (-not $pkgFound) {
            try {
                $npxCheck = & npx --no-install $pkg --version 2>$null
                if ($npxCheck) {
                    Write-Pass "$pkg disponible via npx"
                    $pkgFound = $true
                }
            } catch {
                # npx no disponible o paquete no encontrado
            }
        }

        if (-not $pkgFound) {
            Write-Fail "$pkg no instalado"
            Write-Warn "Instalar: npm install -g $pkg"
        }
    }
}

# ── 3. Playwright Browsers ──
function Check-PlaywrightBrowsers {
    Write-Section "Playwright Browsers"

    $cachePaths = @(
        "$env:LOCALAPPDATA\ms-playwright",
        "$env:USERPROFILE\AppData\Local\ms-playwright",
        "$env:USERPROFILE\.cache\ms-playwright"
    )

    $browsersFound = 0

    # Chromium
    $chromiumFound = $false
    foreach ($cp in $cachePaths) {
        if (Test-Path "$cp\chromium-*") {
            $chromiumFound = $true
            break
        }
    }
    if ($chromiumFound) {
        Write-Pass "Chromium instalado"
        $browsersFound++
    } else {
        Write-Fail "Chromium no instalado"
    }

    # Firefox
    $firefoxFound = $false
    foreach ($cp in $cachePaths) {
        if (Test-Path "$cp\firefox-*") {
            $firefoxFound = $true
            break
        }
    }
    if ($firefoxFound) {
        Write-Pass "Firefox instalado"
        $browsersFound++
    } else {
        Write-Fail "Firefox no instalado"
    }

    # WebKit
    $webkitFound = $false
    foreach ($cp in $cachePaths) {
        if (Test-Path "$cp\webkit-*") {
            $webkitFound = $true
            break
        }
    }
    if ($webkitFound) {
        Write-Pass "WebKit instalado"
        $browsersFound++
    } else {
        Write-Fail "WebKit no instalado"
    }

    if ($browsersFound -eq 0) {
        Write-Warn "Instalar browsers: npx playwright install"
    }
}

# ── 4. MCP Config Files ──
function Check-McpConfigs {
    Write-Section "MCP Config Files"

    $anyFound = 0
    foreach ($cfg in $MCP_CONFIGS) {
        if (Test-Path $cfg) {
            Write-Pass "Config encontrado: $cfg"
            $anyFound++
        } else {
            Write-Fail "Config NO encontrado: $cfg"
        }
    }

    if ($anyFound -eq 0) {
        Write-Warn "Ningun archivo MCP config encontrado"
    }
}

# ── 5. GitHub MCP ──
function Check-GithubMcp {
    Write-Section "GitHub MCP"

    $ghFound = $false
    foreach ($cfg in $MCP_CONFIGS) {
        if (Test-Path $cfg) {
            try {
                $content = Get-Content $cfg -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match "github") {
                    Write-Pass "GitHub MCP configurado en: $cfg"
                    $ghFound = $true
                    break
                }
            } catch {
                # Ignorar errores de lectura
            }
        }
    }

    if (-not $ghFound) {
        Write-Fail "GitHub MCP no configurado en ningun config file"
    }

    # Verificar CLI de GitHub
    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghCmd) {
        try {
            $ghVersion = & gh --version 2>$null | Select-Object -First 1
            Write-Pass "GitHub CLI: $ghVersion"
        } catch {
            Write-Pass "GitHub CLI instalado"
        }

        try {
            $ghStatus = & gh auth status 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Pass "GitHub CLI autenticado"
            } else {
                Write-Warn "GitHub CLI no autenticado. Ejecuta: gh auth login"
            }
        } catch {
            Write-Warn "GitHub CLI no autenticado. Ejecuta: gh auth login"
        }
    } else {
        Write-Warn "GitHub CLI (gh) no instalado"
    }
}

# ── 6. Supabase MCP ──
function Check-SupabaseMcp {
    Write-Section "Supabase MCP"

    $sbFound = $false
    foreach ($cfg in $MCP_CONFIGS) {
        if (Test-Path $cfg) {
            try {
                $content = Get-Content $cfg -Raw -ErrorAction SilentlyContinue
                if ($content -and $content -match "supabase") {
                    Write-Pass "Supabase MCP configurado en: $cfg"
                    $sbFound = $true
                    break
                }
            } catch {
                # Ignorar errores de lectura
            }
        }
    }

    if (-not $sbFound) {
        Write-Fail "Supabase MCP no configurado en ningun config file"
    }

    # Verificar CLI de Supabase
    $sbCmd = Get-Command supabase -ErrorAction SilentlyContinue
    if ($sbCmd) {
        try {
            $sbVersion = & supabase --version 2>$null | Select-Object -First 1
            Write-Pass "Supabase CLI: $sbVersion"
        } catch {
            Write-Pass "Supabase CLI instalado"
        }
    } else {
        Write-Warn "Supabase CLI no instalada"
    }
}

# ── 7. Railway Project Linked ──
function Check-RailwayProject {
    Write-Section "Railway Project Link"

    $railwayPath = $null
    $candidates = @(
        $RAILWAY_CLI_PATH,
        "$env:USERPROFILE\.npm-global\bin\railway.cmd",
        "$env:APPDATA\npm\railway.cmd"
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            $railwayPath = $cand
            break
        }
    }

    if (-not $railwayPath) {
        Write-Fail "Railway CLI no disponible para verificar proyecto"
        return
    }

    try {
        $status = & $railwayPath status 2>$null
        $statusText = $status -join " "

        if ($statusText -match $PROJECT_NAME -or $statusText -match "brilliant-elegance") {
            Write-Pass "Proyecto linkeado: $PROJECT_NAME"
        } elseif ($status -and ($status -match "project" -or $status -match "Project")) {
            Write-Warn "Proyecto Railway linkeado (nombre diferente a $PROJECT_NAME)"
        } elseif ($status) {
            Write-Pass "Railway project linkeado"
        } else {
            Write-Fail "Railway project no linkeado"
            Write-Warn "Ejecuta: railway link (en el directorio del proyecto)"
        }

        if ($statusText -match $SERVICE_NAME) {
            Write-Pass "Service detectado: $SERVICE_NAME"
        } else {
            Write-Warn "Service '$SERVICE_NAME' no detectado en Railway status"
        }
    } catch {
        Write-Fail "Railway project no linkeado"
        Write-Warn "Ejecuta: railway link (en el directorio del proyecto)"
    }
}

# ── 8. JSON Valid in Configs ──
function Check-JsonValid {
    Write-Section "JSON Valid en Configs MCP"

    foreach ($cfg in $MCP_CONFIGS) {
        if (-not (Test-Path $cfg)) {
            continue
        }

        $ext = [System.IO.Path]::GetExtension($cfg).ToLower()

        if ($ext -eq ".json") {
            try {
                $content = Get-Content $cfg -Raw -ErrorAction Stop
                $null = $content | ConvertFrom-Json
                Write-Pass "JSON valido: $cfg"
            } catch {
                Write-Fail "JSON INVALIDO: $cfg"
            }
        } elseif ($ext -eq ".toml") {
            try {
                # PowerShell no tiene parser TOML nativo, verificamos estructura basica
                $content = Get-Content $cfg -Raw -ErrorAction Stop
                if ($content -match "\[.*\]" -or $content -match ".*=.*") {
                    Write-Pass "TOML presente: $cfg"
                } else {
                    Write-Warn "TOML posiblemente invalido: $cfg"
                }
            } catch {
                Write-Fail "Error leyendo TOML: $cfg"
            }
        }
    }
}

# ── Summary ──
function Write-Summary {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                      RESUMEN                                   ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host ("║  ✅ {0} checks pasaron{1}║" -f $script:PASS, (" " * (45 - $script:PASS.ToString().Length))) -ForegroundColor Cyan
    Write-Host ("║  ❌ {0} checks fallaron{1}║" -f $script:FAIL, (" " * (44 - $script:FAIL.ToString().Length))) -ForegroundColor Cyan
    Write-Host ("║  ⚠️  {0} advertencias{1}║" -f $script:WARN, (" " * (44 - $script:WARN.ToString().Length))) -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    if ($script:FAIL -gt 0) {
        Write-Host ""
        Write-Host "⚠️  Hay $script:FAIL problema(s) que requieren atencion." -ForegroundColor Red
        Write-Host "   Revisa los checks fallidos arriba y sigue las sugerencias." -ForegroundColor Yellow
        exit 1
    } elseif ($script:WARN -gt 0) {
        Write-Host ""
        Write-Host "ℹ️  Hay $script:WARN advertencia(s) a revisar." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host ""
        Write-Host "🎉 ¡Todo listo! JARVIS MCP esta completamente configurado." -ForegroundColor Green
        exit 0
    }
}

# ── Main ──
function Main {
    Write-Header

    Check-RailwayCLI
    Check-McpPackages
    Check-PlaywrightBrowsers
    Check-McpConfigs
    Check-GithubMcp
    Check-SupabaseMcp
    Check-RailwayProject
    Check-JsonValid

    Write-Summary
}

# Ejecutar
Main
