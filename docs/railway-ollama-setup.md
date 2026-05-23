# Ollama en Railway (Bot WhatsApp)

## Importante

- **Madsjeez** (`railway.toml`) = solo Next.js. **Ollama es otro servicio** en el mismo proyecto Railway.
- `localhost:11434` en variables de Railway **no funciona** (el contenedor de Madsjeez no ve tu PC).
- Sin `OLLAMA_BASE_URL` válida → el bot usa **reglas + catálogo** (sigue funcionando).

## 1. Servicio Ollama en Railway

1. Mismo proyecto → **New** → Docker `ollama/ollama:latest` o template https://railway.com/deploy/ollama-or-self-host-open-source-llms  
2. **Volume** `/root/.ollama`  
3. **RAM ≥ 8 GB** para modelos 7B+  
4. Dominio público o red privada Railway  
5. En shell del servicio: `ollama pull qwen2.5:7b` (o el modelo que uses)

Verificar:

```bash
curl https://TU-OLLAMA.up.railway.app/api/tags
```

## 2. Variables en Madsjeez

```env
WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://TU-OLLAMA.up.railway.app
OLLAMA_MODEL=qwen2.5:7b
```

Red privada (recomendado):

```env
OLLAMA_BASE_URL=http://${{Ollama.RAILWAY_PRIVATE_DOMAIN}}:11434
```

Redeploy Madsjeez.

## 3. Verificar operativo

**Panel:** Bot de WhatsApp → Configuración → **Probar Ollama**.

**API** (logueado como vendedor):

`GET /api/seller/whatsapp-bot/health`

Campos clave:

- `ai.ollamaOk: true` → operativo  
- `ai.ollamaConfigIssue` → qué falta corregir  
- `ai.ollamaReachable` → el servidor responde `/api/tags`  
- `pipeline.ollamaOk` → listo para el pipeline del bot  

## 4. Local (tu PC)

```powershell
ollama serve
ollama pull qwen2.5:7b
```

`.env.local`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
WHATSAPP_AI_PROVIDER=ollama
```

## 5. Túnel desde PC a Railway (alternativa)

Si querés usar la GPU de tu PC en prod: Cloudflare Tunnel / ngrok al puerto 11434 y esa URL en `OLLAMA_BASE_URL` en Railway.
