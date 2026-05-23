# Jarvis Orchestrator

Asistente personal aislado del bot WhatsApp. Orquesta Cursor, Claude Code, Windsurf y Codex.

## Activar

```env
JARVIS_ENABLED=true
JARVIS_READ_ONLY=true
JARVIS_ALLOW_AGENT_TASKS=true
JARVIS_API_SECRET=your-secret   # opcional; sin secret = solo admin logueado

# Ollama router
JARVIS_MODEL_FAST=qwen2.5:3b
JARVIS_MODEL_NORMAL=qwen2.5:7b
JARVIS_MODEL_SMART=qwen3:14b
JARVIS_MODEL_ROUTER_ENABLED=true

# Cursor auto-dispatch (opcional)
CURSOR_API_KEY=
JARVIS_CURSOR_DISPATCH=false
JARVIS_AUTO_DISPATCH=false
```

Migraciones:

```bash
npx prisma migrate deploy
```

## Panel

`/admin/jarvis` — health, orquestar, tareas, hallazgos.

## API

| Endpoint | Uso |
|----------|-----|
| `GET /api/jarvis/status` | Dashboard |
| `GET /api/jarvis/health` | Health check |
| `POST /api/jarvis/orchestrate` | Auditoría + tareas auto-routed |
| `POST /api/jarvis/command` | Comandos individuales |
| `POST /api/jarvis/tasks` | Crear tarea para agente |
| `POST /api/jarvis/dispatch` | Lanzar tarea (Cursor SDK si configurado) |

### Orquestar (recomendado)

```json
POST /api/jarvis/orchestrate
{
  "scope": "all",
  "detail": "normal",
  "agentTarget": "auto"
}
```

Flujo: health → errores → mejoras → router elige agente(s) → escribe `.agent-tasks/*.md`.

## Agent router

| Agente | Cuándo |
|--------|--------|
| **Cursor** | Repo, Next.js, TypeScript, multi-file |
| **Claude Code** | Estrategia, seguridad, arquitectura, análisis profundo |
| **Windsurf** | n8n, workflows, integraciones, refactors medios |
| **Codex** | Scripts, CLI, benchmarks, ops |

## Manual dispatch

```bash
npm run jarvis:dispatch
npm run jarvis:dispatch -- --agent cursor --path .agent-tasks/cursor-task.md
```

## Aislamiento

- No hook en `bot-engine`
- `JARVIS_ENABLED=false` apaga todo
- Read-only por defecto
- No deploy sin confirmación
