# Madsjeez TWA — Trusted Web Activity (APK para Android)

## Qué es esto

La APK de Madsjeez es una **Trusted Web Activity (TWA)** generada con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
No es una app nativa: es la misma web `www.madsjeez.com.ar` empaquetada como app Android.

- Mismo backend, misma cuenta, mismo carrito
- Sin duplicar código
- Actualizaciones automáticas al actualizar la web
- Firma digital que hace que Chrome no muestre la barra de navegación

---

## Requisitos previos (una sola vez)

1. **Java JDK 17** — descargar de [adoptium.net](https://adoptium.net/)
   - Verificar: `java -version`
2. **Android SDK** — Bubblewrap lo instala automáticamente la primera vez
3. **Node.js 18+** — ya instalado (`node --version`)
4. **@bubblewrap/cli** — el script lo instala si no está

---

## Cómo hacer el build

### Opción A — Linux / Mac

```bash
# Desde la raíz del proyecto:
bash twa/build.sh
```

### Opción B — Windows (PowerShell)

```powershell
# Desde la raíz del proyecto:
.\twa\build.ps1
```

El script hace automáticamente:
1. Instala `@bubblewrap/cli` si no está
2. Genera el keystore `twa/android.keystore` si no existe
3. Obtiene el SHA-256 fingerprint y actualiza `public/.well-known/assetlinks.json`
4. Inicializa el proyecto Android con Bubblewrap
5. Construye la APK y la copia a `public/downloads/madsjeez.apk`

---

## Después del primer build

### 1. Verificar Digital Asset Links

Una vez que el `assetlinks.json` tenga el fingerprint real (lo pone el script):

```
https://www.madsjeez.com.ar/.well-known/assetlinks.json
```

Debe responder con el JSON correcto. Podés verificarlo con:
```
https://developers.google.com/digital-asset-links/tools/generator
```

### 2. Deploy del assetlinks.json

Hacer deploy a Railway/producción para que el archivo esté disponible en la URL pública.

### 3. La APK ya está lista para distribuir

El archivo `public/downloads/madsjeez.apk` es la APK firmada lista para:
- Descarga directa desde `www.madsjeez.com.ar/downloads/madsjeez.apk`
- Distribución manual

---

## Para publicar en Google Play

1. El build también genera `twa/android/app-release-bundle.aab` (Android App Bundle)
2. Crear cuenta de desarrollador en [Google Play Console](https://play.google.com/console) (~$25 USD pago único)
3. Crear nueva aplicación → subir el `.aab`
4. Completar ficha: ícono, capturas de pantalla, descripción
5. Publicar en "Acceso de prueba" (alpha) → luego "Producción"

**Package ID:** `com.ar.madsjeez`  
**Versión inicial:** `1.0.0` (versionCode: 1)

---

## Archivos generados

```
twa/
├── twa-manifest.json       # Config Bubblewrap
├── android.keystore        # Keystore de firma (NO subir a git — está en .gitignore)
├── android/                # Proyecto Android generado (NO subir a git)
├── build.sh                # Script build Linux/Mac
├── build.ps1               # Script build Windows
└── README.md               # Este archivo

public/
├── .well-known/
│   └── assetlinks.json     # Digital Asset Links (se actualiza con el build)
└── downloads/
    └── madsjeez.apk        # APK lista para descargar (se actualiza con cada build)
```

---

## .gitignore recomendado para este directorio

```gitignore
# TWA build artifacts
twa/android.keystore
twa/android/
public/downloads/madsjeez.apk
```

El keystore es sensible — guardarlo en un lugar seguro (1Password, Bitwarden, o similar).
Si se pierde el keystore, no se puede actualizar la app en Google Play.

---

## Variables de entorno útiles

| Variable | Descripción |
|---|---|
| `ANDROID_SHA256` | SHA-256 fingerprint del keystore (para referencia) |
| `ANDROID_KEYSTORE_PASSWORD` | Password del keystore (si lo guardás en Railway) |

---

## Soporte

- Documentación Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- Digital Asset Links: https://developers.google.com/digital-asset-links
- TWA en Google Developers: https://developer.chrome.com/docs/android/trusted-web-activity
