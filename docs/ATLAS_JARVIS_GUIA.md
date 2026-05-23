# Atlas Orchestrator + Desktop Agent

Guía completa de uso (marca MadsJeez — voces propias Atlas/Nova, sin clonar personajes).

## Por qué el panel dice "apagado"

`/admin/jarvis` llama a `GET /api/jarvis/status`, que **siempre carga** si sos admin.

- **Orchestrator web OFF** = `JARVIS_ENABLED=false` en Railway (intencional y seguro).
- **Desktop OFF** = el agente local no está corriendo o no envió heartbeat.

El panel ya no se rompe cuando web está apagado: muestra instrucciones + podés usar desktop.

---

## Parte A — Orchestrator web (Railway)

### Activar (producción)

En Railway → servicio **madsjeez** → Variables:

```env
JARVIS_ENABLED=true
JARVIS_READ_ONLY=true
JARVIS_ALLOW_AGENT_TASKS=true
JARVIS_ALLOW_CODE_CHANGES=false
JARVIS_ALLOW_DEPLOY=false
JARVIS_REQUIRE_CONFIRMATION=true
JARVIS_MODEL_ROUTER_ENABLED=true
JARVIS_DESKTOP_PORT=8787
```

Redeploy. Panel: https://www.madsjeez.com.ar/admin/jarvis

### Uso panel

1. Login admin
2. **Orquestar** → auditoría + tareas en `.agent-tasks/`
3. Abrí `cursor-task.md` (etc.) en cada IDE

---

## Parte B — Desktop Agent (tu PC Windows)

### Instalación

```powershell
cd apps\jarvis-desktop-agent
npm install
copy .env.example .env
# Editá JARVIS_DESKTOP_SECRET y MARKETPLACE_API_URL
npm run dev
```

Desde la raíz del repo:

```powershell
npm run jarvis:desktop
```

### Verificar

```powershell
curl http://127.0.0.1:8787/health -H "x-jarvis-secret: change-me"
```

### Comandos de voz (push-to-talk)

```powershell
curl -X POST http://127.0.0.1:8787/voice/stop `
  -H "Content-Type: application/json" `
  -H "x-jarvis-secret: change-me" `
  -d "{\"text\":\"Atlas, estado del sistema\"}"
```

### Ejemplos de frases

- Atlas, estado del sistema
- Atlas, abrí Cursor
- Atlas, creá una tarea para Cursor para revisar el bot de WhatsApp
- Atlas, revisá el Marketplace
- Atlas, leéme el informe

### Conexión con el panel

El desktop envía heartbeat cada 60s a:

`POST /api/jarvis/desktop/heartbeat`

Configurá el mismo secreto en Railway (`JARVIS_DESKTOP_SECRET`) y en `.env` local.

---

## Seguridad

| Regla | Default |
|-------|---------|
| Read-only web | true |
| Desktop solo localhost | 127.0.0.1:8787 |
| Confirmación acciones riesgosas | true |
| Bot WhatsApp | no toca Jarvis |

---

## Voces Atlas / Nova

- **Atlas**: guion masculino calmado/tecnológico (TTS Windows)
- **Nova**: guion femenino profesional/cálido
- No imitan voces de películas ni actores

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Panel "web OFF" | `JARVIS_ENABLED=true` + redeploy |
| Desktop OFF en panel | `npm run dev` en desktop-agent |
| 401 desktop API | Mismo `x-jarvis-secret` en .env y requests |
| Comandos web 503 | Normal si `JARVIS_ENABLED=false` |
