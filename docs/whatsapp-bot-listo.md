# Bot WhatsApp — estado final

## Completado automáticamente

- UI premium (sidebar, inbox, configuración, pipeline) en producción tras deploy
- GitHub `main`: commits `d6f1014a`, `14d04e2f`
- Railway: `WHATSAPP_AI_PROVIDER=gemini`, `OLLAMA_BASE_URL` limpiado en prod, redeploy disparado
- Evolution API: online con volume en `overflowing-charm`
- Build local: OK

## Solo vos (2 minutos)

1. **Producción** — https://www.madsjeez.com.ar/dashboard → Bot de WhatsApp  
   - Configuración → Conectar → QR → Activar bot automático  
2. **Local (Ollama)** — PowerShell:
   ```powershell
   cd "C:\Users\Mi Pc\.cursor\projects\empty-window\madsjeez"
   powershell -ExecutionPolicy Bypass -File scripts\setup-whatsapp-bot-local.ps1
   npm run dev
   ```
   El script pide `EVOLUTION_API_KEY` y `EVOLUTION_WEBHOOK_SECRET` (copiá de Railway, no al chat).

3. **Prueba** — mensaje nuevo desde otro celular al número conectado.

## IA

| Entorno | Motor |
|---------|--------|
| Railway / prod | Gemini (`GEMINI_API_KEY`) |
| Tu PC + `.env.local` | Ollama `qwen2.5:3b` |
