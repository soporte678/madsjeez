# Qué puede hacer el agente solo vs qué necesitás vos

## Ya hecho automáticamente (sin secretos)

| Hecho | Detalle |
|-------|---------|
| Ollama verificado | v0.24.0, modelos `qwen2.5:3b` y `qwen2.5:7b` |
| Benchmark | `qwen2.5:3b` ~1s, `qwen2.5:7b` ~73s (primera carga) → dev usa **3b** |
| `.env.local` base | Ollama + Evolution URL; faltan claves `REPLACE_*` |
| Script setup | `scripts/setup-whatsapp-bot-local.ps1` |
| Railway audit (MCP) | Evolution online + volume; madsjeez deploy OK; vars Evolution/Gemini/Ollama definidas |

## Lo que el agente SÍ puede hacer con tus órdenes

| Herramienta | Uso |
|-------------|-----|
| **Railway MCP** (`user-railway`) | Ver proyectos, deploy, logs, redeploy, pedir al agente Railway cambios de variables **si vos confirmás valores** |
| **GitHub MCP** | PRs, issues, CI (con PAT configurado) |
| **Código local** | Editar bot, webhooks, UI, docs, scripts |
| **Shell en tu PC** | `ollama`, `npm run dev`, benchmark, tests |
| **Supabase MCP** | DB, migraciones (con permiso) |

## Lo que el agente NO puede hacer solo (límite de seguridad)

| Acción | Por qué | Qué hacer vos |
|--------|---------|----------------|
| Leer `EVOLUTION_API_KEY` / webhook secret en Railway | MCP oculta valores | Una vez: script setup o pegar en `.env.local` |
| Escanear QR de WhatsApp | Requiere tu teléfono | Dashboard → Conectar → QR |
| Activar bot en tu cuenta vendedor | Sesión tuya | Dashboard → Activar bot automático |
| Enviar mensaje de prueba | Tu celular | Mensaje desde otro número |
| Instalar Railway CLI / login | Credencial humana | Ver abajo |
| Ollama en **producción** desde tu GPU | Railway no ve `localhost` | Túnel Cloudflare o usar Gemini en prod |

## Para que el agente sea más autosuficiente (instalá una vez)

### 1. Railway CLI (recomendado)

```powershell
winget install Railway.Railway
railway login
cd "C:\Users\Mi Pc\.cursor\projects\empty-window\madsjeez"
railway link
# Elegí: grand-education → madsjeez → production
```

Después el agente puede ejecutar `railway variables` / redeploy sin que copies claves al chat (siguen en tu máquina).

### 2. Token Railway en Cursor (opcional)

En `C:\Users\Mi Pc\.cursor\mcp.json` → `railway-mcp` → `RAILWAY_API_TOKEN` con token de https://railway.com/account/tokens

### 3. Ollama en producción (opcional)

```powershell
winget install Cloudflare.cloudflared
# Túnel hacia :11434 → URL pública en OLLAMA_BASE_URL (Railway)
```

Sin túnel: en prod dejá `WHATSAPP_AI_PROVIDER` vacío y `GEMINI_API_KEY` (ya está en Railway).

### 4. Reglas Cursor ya activas

- `railway-auto.mdc`, `supabase-auto.mdc`, `github-auto.mdc`, `resend-marketing-auto.mdc`

## Comando único para terminar setup local

```powershell
cd "C:\Users\Mi Pc\.cursor\projects\empty-window\madsjeez"
powershell -ExecutionPolicy Bypass -File scripts/setup-whatsapp-bot-local.ps1
npm run dev
```

Luego solo vos: QR + activar bot + mensaje de prueba.
