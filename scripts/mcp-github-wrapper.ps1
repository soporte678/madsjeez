# GitHub MCP Server Wrapper (Windows)
# Lee GITHUB_PERSONAL_ACCESS_TOKEN del entorno o lo extrae de git remote

$ErrorActionPreference = "Stop"

$token = $env:GITHUB_PERSONAL_ACCESS_TOKEN
if (-not $token) {
    $remoteUrl = git -C (Split-Path $PSScriptRoot) remote get-url origin 2>$null
    if ($remoteUrl -match 'ghp_[A-Za-z0-9_]+') {
        $token = $Matches[0]
    }
}

if (-not $token) {
    Write-Error "GITHUB_PERSONAL_ACCESS_TOKEN no esta configurado"
    Write-Host "Seteala con: `$env:GITHUB_PERSONAL_ACCESS_TOKEN = 'ghp_tu_token'" -ForegroundColor Yellow
    exit 1
}

$env:GITHUB_PERSONAL_ACCESS_TOKEN = $token
& npx -y @github/mcp-server
