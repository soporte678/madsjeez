#!/usr/bin/env bash
# =============================================================
# Madsjeez TWA — Build script para generar APK + AAB
# Requiere: Node.js 18+, Java JDK 17, Android SDK
# Uso: bash twa/build.sh
# =============================================================
set -e

KEYSTORE="twa/android.keystore"
ALIAS="madsjeez"
STOREPASS="madsjeez2026"
KEYPASS="madsjeez2026"

echo ""
echo "=== Madsjeez TWA Build Script ==="
echo ""

# 1. Instalar @bubblewrap/cli si no está
if ! npx @bubblewrap/cli --version &>/dev/null; then
  echo "[1/5] Instalando @bubblewrap/cli..."
  npm install -g @bubblewrap/cli
else
  echo "[1/5] @bubblewrap/cli ya instalado."
fi

# 2. Generar keystore si no existe
if [ ! -f "$KEYSTORE" ]; then
  echo "[2/5] Generando keystore..."
  keytool -genkeypair \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STOREPASS" \
    -keypass "$KEYPASS" \
    -dname "CN=Madsjeez, OU=App, O=Madsjeez Commerce Group, L=Buenos Aires, ST=Buenos Aires, C=AR"
  echo "[2/5] Keystore generado en $KEYSTORE"
else
  echo "[2/5] Keystore ya existe."
fi

# 3. Obtener fingerprint SHA-256 y actualizar assetlinks.json
echo "[3/5] Obteniendo fingerprint SHA-256..."
FINGERPRINT=$(keytool -list -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -storepass "$STOREPASS" 2>/dev/null \
  | grep "SHA256" \
  | sed 's/.*SHA256: //' \
  | tr -d ' ')

echo "     SHA-256: $FINGERPRINT"

# Actualizar public/.well-known/assetlinks.json
cat > public/.well-known/assetlinks.json << ASSETLINKS
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ar.madsjeez",
    "sha256_cert_fingerprints": ["$FINGERPRINT"]
  }
}]
ASSETLINKS
echo "[3/5] assetlinks.json actualizado."

# 4. Inicializar proyecto Bubblewrap (solo si no existe android/)
if [ ! -d "twa/android" ]; then
  echo "[4/5] Inicializando proyecto Android con Bubblewrap..."
  cd twa
  npx @bubblewrap/cli init \
    --manifest https://www.madsjeez.com.ar/manifest.json \
    --directory android
  cd ..
else
  echo "[4/5] Proyecto Android ya inicializado."
fi

# 5. Build APK + AAB
echo "[5/5] Construyendo APK y AAB..."
cd twa/android
bubblewrap build \
  --skipPwaValidation
cd ../..

# Copiar APK al directorio de descarga
if [ -f "twa/android/app-release-signed.apk" ]; then
  cp twa/android/app-release-signed.apk public/downloads/madsjeez.apk
  echo ""
  echo "=== Build exitoso! ==="
  echo "APK: public/downloads/madsjeez.apk"
  echo "AAB: twa/android/app-release-bundle.aab (para Google Play)"
elif [ -f "twa/android/app/build/outputs/apk/release/app-release.apk" ]; then
  cp twa/android/app/build/outputs/apk/release/app-release.apk public/downloads/madsjeez.apk
  echo ""
  echo "=== Build exitoso! ==="
  echo "APK: public/downloads/madsjeez.apk"
fi

echo ""
echo "IMPORTANTE: Despues del primer build, copiá el fingerprint SHA-256"
echo "a Railway como variable de entorno ANDROID_SHA256 y hacé deploy."
echo "Eso activa la verificación de Digital Asset Links en la app."
echo ""
