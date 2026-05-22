# Evolution API en Railway (solo Railway)

Madsjeez y Evolution son **dos servicios distintos** en el mismo proyecto Railway. El bot de WhatsApp no funciona si `EVOLUTION_API_URL` apunta a `www.madsjeez.com.ar` (eso es Next.js → error **HTTP 404**).

## Arquitectura

```
┌─────────────────────┐     apikey + REST      ┌──────────────────────┐
│  Madsjeez (Next.js) │ ─────────────────────► │  Evolution API :8080 │
│  www.madsjeez.com.ar│ ◄── webhook mensajes ── │  *.up.railway.app    │
└─────────────────────┘                        │  + Postgres + Redis  │
                                               │  + Volume /instances│
                                               └──────────────────────┘
```

**Ollama:** en Railway no es obligatorio. Sin Ollama el bot usa reglas + catálogo. Ollama en tu PC solo sirve para pruebas locales.

---

## Paso 1 — Crear Evolution en el mismo proyecto Railway

1. Entrá a [Railway Dashboard](https://railway.app) → proyecto donde está **Madsjeez**.
2. **+ New** → **Template** o **Deploy from template**.
3. Buscá **Evolution API** (oficial, incluye Postgres + Redis), por ejemplo:
   - https://railway.com/template/self-host-evolution-api  
   - o https://railway.com/deploy/evolution-api-4  
4. Deploy. Esperá que queden **4 servicios** (aprox.): Evolution, Postgres, Redis, y tu Madsjeez existente.

---

## Paso 2 — Variables en el servicio Evolution

En el servicio **Evolution API** → **Variables**, verificá (el template suele prellenarlas):

| Variable | Valor típico |
|----------|----------------|
| `AUTHENTICATION_API_KEY` | Generá una clave larga (guardala, es `EVOLUTION_API_KEY` en Madsjeez) |
| `SERVER_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` del **servicio Evolution** |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_CONNECTION_URI` | `${{Postgres.DATABASE_URL}}` (referencia interna) |
| `CACHE_REDIS_ENABLED` | `true` |
| `CACHE_REDIS_URI` | `${{Redis.REDIS_URL}}` |

**Volume (importante):** montá un volumen en `/evolution/instances` para que el QR/WhatsApp no se pierda en cada redeploy.

**Dominio público:** en Evolution → **Settings** → **Networking** → **Generate Domain**.  
Copiá esa URL, ej. `https://evolution-api-production-a1b2.up.railway.app`.

---

## Paso 3 — Variables en el servicio Madsjeez

En el servicio **Madsjeez** (Next.js) → **Variables**:

```env
EVOLUTION_API_URL=https://evolution-api-production-a1b2.up.railway.app
EVOLUTION_API_KEY=<misma que AUTHENTICATION_API_KEY de Evolution>
EVOLUTION_WEBHOOK_SECRET=<string aleatorio, ej. openssl rand -hex 32>
EVOLUTION_DEFAULT_INSTANCE_PREFIX=madsjeez_seller_

NEXT_PUBLIC_APP_URL=https://www.madsjeez.com.ar
NEXTAUTH_URL=https://www.madsjeez.com.ar
```

**Sin** barra final en `EVOLUTION_API_URL`.

Opcional (IA en la nube más adelante; no hace falta para QR):

```env
OLLAMA_BASE_URL=
OLLAMA_MODEL=qwen2.5:7b
```

Redeploy **Madsjeez** después de guardar.

---

## Paso 4 — Probar Evolution antes del QR

En PowerShell (reemplazá URL y clave):

```powershell
curl "https://TU-EVOLUTION.up.railway.app/instance/fetchInstances" -H "apikey: TU_CLAVE"
```

- Si ves **JSON** (lista/array) → Evolution OK.  
- Si ves **HTML** de Madsjeez o 404 → `EVOLUTION_API_URL` sigue mal.

Desde el panel (logueado como vendedor):

`GET https://www.madsjeez.com.ar/api/seller/whatsapp-bot/health`  
→ debe devolver `{ "evolution": { "ok": true } }`.

---

## Paso 5 — Webhook (mensajes entrantes)

Evolution debe poder llamar a Madsjeez:

```
https://www.madsjeez.com.ar/api/webhooks/evolution
```

Al crear la instancia, Madsjeez ya envía esta URL en el payload. Confirmá que:

1. `EVOLUTION_WEBHOOK_SECRET` está definido en Madsjeez (obligatorio en producción).
2. El mismo valor llega en el header `x-madsjeez-webhook-secret` (lo configura el código al crear instancia).

---

## Paso 6 — Usar el bot

1. Dashboard → **Marketing** → **Bot de WhatsApp**  
2. **Conectar WhatsApp** → **Mostrar QR** → escanear  
3. Activar bot  
4. Probar mensaje al número vinculado  

---

## Errores frecuentes

| Síntoma | Causa | Solución |
|---------|--------|----------|
| `evolution_error:HTTP 404` | `EVOLUTION_API_URL` = URL de Madsjeez | Usar dominio del **servicio Evolution** |
| QR no aparece | Evolution caído o sin volumen | Revisar logs Evolution, montar volume |
| Bot no responde mensajes | Webhook no llega | Dominio público Madsjeez + `EVOLUTION_WEBHOOK_SECRET` |
| P1000 Postgres en Evolution | URI incorrecta | Usar `${{Postgres.DATABASE_URL}}` interno del template |

---

## Costo aproximado

- Evolution + Postgres + Redis consumen recursos aparte de Madsjeez.  
- Empezá con el plan que ya usás; monitoreá **Usage** en Railway.

---

## Local vs Railway

| Entorno | Madsjeez | Evolution | Ollama |
|---------|----------|-----------|--------|
| **Tu PC** | `localhost:3000` | `localhost:8080` Docker | `localhost:11434` ✓ |
| **Railway** | `www.madsjeez.com.ar` | 2º servicio Railway | Opcional / no incluido |

No mezcles URLs: en Railway, Ollama de tu PC **no** lo ve Madsjeez salvo que expongas túnel (ngrok); para prod no hace falta.
