# =============================================================
# Madsjeez TWA — Build script para Windows (PowerShell)
# Requiere: Node.js 18+, Java JDK 17, Android SDK
# Uso: desde la raiz del proyecto: .\twa\build.ps1
# =============================================================

$KEYSTORE = "twa\android.keystore"
$ALIAS = "madsjeez"
$STOREPASS = "madsjeez2026"
$KEYPASS = "madsjeez2026"

Write-Host ""
Write-Host "=== Madsjeez TWA Build Script (Windows) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Instalar @bubblewrap/cli si no esta
try {
    $bwVersion = & npx @bubblewrap/cli --version 2>$null
    Write-Host "[1/5] @bubblewrap/cli ya instalado." -ForegroundColor Green
} catch {
    Write-Host "[1/5] Instalando @bubblewrap/cli..." -ForegroundColor Yellow
    npm install -g @bubblewrap/cli
}

# 2. Generar keystore si no existe
if (-not (Test-Path $KEYSTORE)) {
    Write-Host "[2/5] Generando keystore..." -ForegroundColor Yellow
    keytool -genkeypair `
        -keystore $KEYSTORE `
        -alias $ALIAS `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $STOREPASS `
        -keypass $KEYPASS `
        -dname "CN=Madsjeez, OU=App, O=Madsjeez Commerce Group, L=Buenos Aires, ST=Buenos Aires, C=AR"
    Write-Host "[2/5] Keystore generado en $KEYSTORE" -ForegroundColor Green
} else {
    Write-Host "[2/5] Keystore ya existe." -ForegroundColor Green
}

# 3. Obtener fingerprint SHA-256
Write-Host "[3/5] Obteniendo fingerprint SHA-256..." -ForegroundColor Yellow
$keytoolOutput = & keytool -list -v -keystore $KEYSTORE -alias $ALIAS -storepass $STOREPASS 2>$null
$fingerprintLine = $keytoolOutput | Where-Object { $_ -match "SHA256:" }
$fingerprint = ($fingerprintLine -replace ".*SHA256:\s*", "").Trim()
Write-Host "     SHA-256: $fingerprint" -ForegroundColor Cyan

# Actualizar assetlinks.json
$assetlinks = @"
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ar.madsjeez",
    "sha256_cert_fingerprints": ["$fingerprint"]
  }
}]
"@
New-Item -ItemType Directory -Force -Path "public\.well-known" | Out-Null
Set-Content -Path "public\.well-known\assetlinks.json" -Value $assetlinks -Encoding utf8
Write-Host "[3/5] assetlinks.json actualizado." -ForegroundColor Green

# 4. Inicializar Bubblewrap
if (-not (Test-Path "twa\android")) {
    Write-Host "[4/5] Inicializando proyecto Android..." -ForegroundColor Yellow
    Set-Location twa
    npx @bubblewrap/cli init --manifest https://www.madsjeez.com.ar/manifest.json --directory android
    Set-Location ..
} else {
    Write-Host "[4/5] Proyecto Android ya inicializado." -ForegroundColor Green
}

# 5. Build
Write-Host "[5/5] Construyendo APK y AAB..." -ForegroundColor Yellow
Set-Location "twa\android"
& bubblewrap build --skipPwaValidation
Set-Location "..\..\"

# Copiar APK
$apkPath = "twa\android\app-release-signed.apk"
if (Test-Path $apkPath) {
    New-Item -ItemType Directory -Force -Path "public\downloads" | Out-Null
    Copy-Item $apkPath -Destination "public\downloads\madsjeez.apk" -Force
    Write-Host ""
    Write-Host "=== Build exitoso! ===" -ForegroundColor Green
    Write-Host "APK: public\downloads\madsjeez.apk"
    Write-Host "AAB: twa\android\app-release-bundle.aab (para Google Play)"
}

Write-Host ""
Write-Host "IMPORTANTE: Copiá el fingerprint SHA-256 a Railway como ANDROID_SHA256" -ForegroundColor Yellow
Write-Host "y hace deploy. Eso activa Digital Asset Links en la app." -ForegroundColor Yellow
Write-Host ""
