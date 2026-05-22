# Railway — proyectos y servicios Madsjeez

| Proyecto Railway | ID | Servicios | Uso |
|------------------|-----|-----------|-----|
| **grand-education** | `eaaefe73-f2b1-46fb-b79b-1e46ac62bd77` | `madsjeez` (Next.js, repo `soporte678/madsjeez`) | Producción web: `www.madsjeez.com.ar`, `madsjeez-production-9f46.up.railway.app` |
| **overflowing-charm** | `72e16e9f-256f-4b5f-8357-9e1dd670cfce` | `EVOLUTION-API`, `Postgres`, `Redis` | WhatsApp Evolution API: `evolution-api-production-85514.up.railway.app` |

Variables Evolution en **madsjeez** (`grand-education`):

- `EVOLUTION_API_URL` → `https://evolution-api-production-85514.up.railway.app`
- `EVOLUTION_API_KEY` → mismo valor que `AUTHENTICATION_API_KEY` en **EVOLUTION-API** (`overflowing-charm`)

El agente Railway MCP debe usar el proyecto correcto según la tarea (app vs Evolution).
