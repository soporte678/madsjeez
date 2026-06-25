# Configurar GitHub Secrets para el build de APK

Ir a: GitHub → soporte678/madsjeez → Settings → Secrets and variables → Actions → New repository secret

## Secrets requeridos

| Secret | Descripción | Cómo obtenerlo |
|--------|-------------|----------------|
| `ANDROID_KEYSTORE_BASE64` | Keystore codificado en base64 | Ver instrucciones abajo |
| `KEYSTORE_PASSWORD` | Password del keystore | `madsjeez2026` (o el que usaste) |
| `KEY_PASSWORD` | Password de la key | `madsjeez2026` (o el que usaste) |

## Generar el keystore localmente (primera vez)

Si ya lo generaste con `twa/build.sh` o `twa/build.ps1`, codificarlo:

```bash
# Linux/Mac:
base64 -i twa/android.keystore | pbcopy   # Copia al clipboard

# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("twa\android.keystore")) | Set-Clipboard
```

Pegar ese valor como secret `ANDROID_KEYSTORE_BASE64`.

## Generarlo desde cero (si no existe)

```bash
keytool -genkeypair \
  -keystore twa/android.keystore \
  -alias madsjeez \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass madsjeez2026 \
  -keypass madsjeez2026 \
  -dname "CN=Madsjeez, OU=App, O=Madsjeez, L=Buenos Aires, ST=Buenos Aires, C=AR" \
  -noprompt
```

Luego codificarlo y subirlo como secret.

## Sin keystore configurado

Si no configurás los secrets, el workflow genera un keystore temporal en cada build.
Esto funciona pero el SHA-256 cambia en cada build, lo que rompe el Digital Asset Links.
Para producción real, siempre usar el mismo keystore.

## Verificar que funciona

1. Ir a GitHub → soporte678/madsjeez → Actions → Build Madsjeez APK
2. Click en "Run workflow"
3. Ingresar una versión (ej: `1.0.0`)
4. Verificar que el job termina en verde
5. Bajar el artifact `madsjeez-apk-*` y probarlo en un Android
