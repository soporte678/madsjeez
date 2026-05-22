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
| `qwen2.5:3b` | ~2 GB | Muy rápido, bueno para pruebas |
| `llama3.2:3b` | ~2 GB | Rápido, inglés/español OK |
| `gemma2:2b` | ~1.5 GB | Ultra rápido |
| `phi3:mini` | ~2.5 GB | Compacto Microsoft |
| `qwen2.5:7b` | ~4.5–6 GB | **Recomendado** calidad/velocidad |
| `mistral:7b` | ~4.5 GB | Alternativa 7B |

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
OLLAMA_MODEL=qwen2.5:3b

# Evolution local o Railway (según pruebes)
EVOLUTION_API_URL=https://evolution-api-production-85514.up.railway.app
EVOLUTION_API_KEY=<tu clave>
```

Con `WHATSAPP_AI_PROVIDER=ollama` el bot **no usa Gemini** aunque exista `GEMINI_API_KEY`.

En **producción (Railway)** dejá `WHATSAPP_AI_PROVIDER` vacío o `gemini` y **no** pongas `OLLAMA_BASE_URL=localhost`.

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

## Producción

Railway → `GEMINI_API_KEY` + `WHATSAPP_AI_PROVIDER=gemini` (default). Ollama local solo para dev en tu PC.
