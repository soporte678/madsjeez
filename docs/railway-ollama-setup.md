# Ollama en Railway (prod)

Para que el bot WhatsApp use **Ollama en producción**, Madsjeez (Railway) necesita una URL pública de Ollama. `localhost` no funciona entre servicios.

## 1. Nuevo servicio Ollama

En Railway (proyecto `overflowing-charm` o uno dedicado):

1. **New Service** → **Docker Image** → `ollama/ollama:latest`
2. **Volume** montado en `/root/.ollama` (persistir modelos)
3. Variable: `OLLAMA_HOST=0.0.0.0:11434`
4. **Networking** → generar dominio público (ej. `ollama-production-xxxx.up.railway.app`)
5. Deploy

## 2. Descargar modelo

Desde Railway shell del servicio Ollama, o one-off:

```bash
ollama pull qwen2.5:7b
# o más liviano: ollama pull qwen2.5:3b
```

Verificá:

```bash
curl https://ollama-production-xxxx.up.railway.app/api/tags
```

## 3. Variables en Madsjeez (servicio web)

```env
WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://ollama-production-xxxx.up.railway.app
OLLAMA_MODEL=qwen2.5:7b
```

Redeploy Madsjeez.

## 4. Probar desde el panel

Configuración → Motor IA → **Probar Ollama** y **Probar respuesta IA**.

Debe decir `provider: ollama` y una respuesta en español argentino.

## 5. Alternativa: Ollama en tu PC + túnel

Si tenés GPU local (32 GB / 12 GB VRAM):

1. `ollama serve` en Windows
2. Cloudflare Tunnel o ngrok al puerto 11434
3. `OLLAMA_BASE_URL=https://tu-tunel.example.com` en Railway

Útil para staging; para prod 24/7 preferí Ollama en Railway o un VPS.

## Notas

- Modelos 7B necesitan RAM/VRAM suficiente en el servicio Railway (plan con memoria adecuada).
- Timeout del bot: 120 s por respuesta Ollama (`OllamaProvider`).
- Si Ollama falla, el bot usa **reglas de fallback** (closer básico), no Gemini, cuando `WHATSAPP_AI_PROVIDER=ollama`.
