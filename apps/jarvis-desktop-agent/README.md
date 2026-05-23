# Atlas Desktop Agent (local Windows)

Corre **solo en tu PC**. No expone control remoto desde Railway.

## Setup

```bash
cd apps/jarvis-desktop-agent
npm install
cp .env.example .env
# Editá JARVIS_DESKTOP_SECRET y MARKETPLACE_API_URL
npm run dev
```

Health: http://127.0.0.1:8787/health

## Seguridad

- Bind `127.0.0.1` únicamente
- Header `x-jarvis-secret` obligatorio si `JARVIS_DESKTOP_SECRET` está seteado
- Read-only por defecto en acciones de repo
- Confirmación para terminal, deploy, DB, etc.

## Voz

- **Micrófono (push-to-talk):** abrí http://127.0.0.1:8787/voice en Chrome/Edge (`npm run voice`)
- También podés enviar texto: `POST /voice/stop` con `{ "text": "Atlas, ..." }`
- TTS local Windows SAPI (voces del sistema; perfiles Atlas/Nova = estilo de texto, no clon)
- Wake word desactivado por defecto

## Comandos ejemplo

```bash
curl -X POST http://127.0.0.1:8787/command -H "Content-Type: application/json" -H "x-jarvis-secret: change-me" -d "{\"text\":\"abrir cursor\"}"
```

## Panel web

El agente envía heartbeat a `MARKETPLACE_API_URL/api/jarvis/desktop/heartbeat` para mostrar "Desktop conectado" en `/admin/jarvis`.
