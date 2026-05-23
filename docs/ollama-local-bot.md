# Bot WhatsApp con Ollama local (32 GB RAM / GPU 12 GB)

En **desarrollo local**, el bot puede usar Ollama en tu PC en lugar de Gemini (Railway no alcanza `localhost:11434`).

## 1. Instalar Ollama (Windows)

1. Descargá desde [https://ollama.com/download](https://ollama.com/download)
2. Instalá y verificá: `ollama --version`
3. Ollama suele quedar como servicio en segundo plano (`http://127.0.0.1:11434`)

## 2. Modelos recomendados (GPU ~12 GB VRAM)

Probá en este orden (menor = más rápido, 7b = mejor calidad):

| Modelo | VRAM aprox. | Uso |
|--------|-------------|-----|
| `qwen3:14b` | ~9 GB | **Tu modelo actual** — mejor calidad closer (más lento) |
| `qwen2.5:7b` | ~4.5–6 GB | Balance calidad/velocidad |
| `qwen2.5:3b` | ~2 GB | Muy rápido, pruebas |

No cargues dos modelos 7B a la vez en 12 GB; Ollama descarga uno y libera el anterior al cambiar.

```powershell
ollama pull qwen2.5:3b
ollama pull qwen2.5:7b
ollama pull llama3.2:3b
ollama pull phi3:mini
ollama pull gemma2:2b
ollama pull mistral:7b
```

## 3. Variables en `.env.local` (madsjeez)

```env
WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:14b

# Evolution local o Railway (según pruebes)
EVOLUTION_API_URL=https://evolution-api-production-85514.up.railway.app
EVOLUTION_API_KEY=<tu clave>
```

Con `WHATSAPP_AI_PROVIDER=ollama` el bot **usa Ollama siempre** (no cae a Gemini salvo que Ollama falle y el fallback sea reglas).

## Producción (Railway + Ollama)

Railway **no puede** llamar a `localhost:11434` de tu PC. Tenés dos caminos:

### A) Ollama en Railway (recomendado para prod)

1. Creá un servicio Docker con imagen `ollama/ollama` + volume para modelos.
2. Dominio público: `https://ollama-xxx.up.railway.app`
3. En el servicio **Madsjeez** (variables):

```env
WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://ollama-xxx.up.railway.app
OLLAMA_MODEL=qwen2.5:7b
```

4. Entrá al contenedor Ollama y ejecutá `ollama pull qwen2.5:7b`.

Guía detallada: [railway-ollama-setup.md](./railway-ollama-setup.md)

### B) Ollama en tu PC + túnel (dev/staging con prod webhook)

1. Ollama corriendo en tu PC (`ollama serve`).
2. Túnel (Cloudflare Tunnel o ngrok) hacia el puerto 11434.
3. En Railway: `OLLAMA_BASE_URL=https://tu-tunel.ngrok-free.app`

### C) Solo desarrollo local

```powershell
npm run dev
# .env.local con WHATSAPP_AI_PROVIDER=ollama y OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Webhook Evolution puede apuntar a ngrok de tu `npm run dev` para probar Ollama end-to-end.

## 4. Benchmark de tiempos de respuesta

Con Ollama corriendo:

```powershell
cd madsjeez
npm run ollama:bench
```

Modelos custom:

```powershell
npm run ollama:bench -- --models=qwen2.5:3b,qwen2.5:7b,phi3:mini
```

El script imprime ranking por latencia y sugiere `OLLAMA_MODEL`.

## 5. Probar el bot end-to-end

1. `npm run dev`
2. Panel vendedor → Bot WhatsApp → Conectar → **Activar bot automático**
3. Mensaje de prueba desde otro celular
4. Revisá consola del dev server si hay `ollama_failed`

## 6. Ajustes GPU (opcional)

- Cerrá otros consumidores de VRAM (juegos, otros LLM)
- En Ollama, modelos cuantizados Q4_K_M son el sweet spot para 12 GB
- Si un 7B va lento, probá `qwen2.5:3b` para respuestas &lt; 3 s

## Producción sin Ollama remoto

Si no deployás Ollama accesible por red, **no** uses `WHATSAPP_AI_PROVIDER=ollama` en Railway — el panel mostrará el error en Config → Motor IA → Probar Ollama.
