# Atlas Orchestrator + Desktop Agent



Guía completa de uso (marca MadsJeez — voces propias Atlas/Nova, sin clonar personajes).



## Por qué el panel dice "apagado"



`/admin/jarvis` llama a `GET /api/jarvis/status`, que **siempre carga** si sos admin.



- **Orchestrator web OFF** = `JARVIS_ENABLED=false` en Railway (intencional y seguro).

- **Desktop OFF** = el agente local no está corriendo o no envió heartbeat (401 por secreto distinto también cuenta).



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

JARVIS_DESKTOP_SECRET=<mismo valor que en tu PC>

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

# Editá JARVIS_DESKTOP_SECRET (igual que Railway) y MARKETPLACE_API_URL

npm run dev

```



Desde la raíz del repo:



```powershell

npm run jarvis:desktop

```



### Verificar salud



```powershell

Invoke-RestMethod -Uri "http://127.0.0.1:8787/health" -Headers @{"x-jarvis-secret"="TU_SECRETO"}

```



Debe responder `status: ok` y `voicePanelUrl`.



### Widget web (admin — Chrome/Edge)

Desde cualquier página del admin aparece un **botón flotante de micrófono** (esquina inferior derecha). También hay un panel embebido en `/admin/jarvis`.

1. Login admin en Chrome o Edge.
2. Permití acceso al micrófono.
3. Mantené el botón y decí: «Atlas, estado del sistema» o «Atlas, orquestar».
4. Comandos **web** (health, orquestar, reporte) van a `/api/jarvis/*` con tu sesión admin.
5. Comandos **desktop** (abrir Cursor, etc.): expandí «Puente desktop local», pegá `JARVIS_DESKTOP_SECRET`, probá localhost:8787.

> El panel `/voice` del agente local sigue siendo la opción más fiable para voz + TTS Windows. El widget web usa TTS del navegador para respuestas.

### Voz con micrófono (push-to-talk) — desktop



1. Con el agente corriendo, abrí **Chrome o Edge** (Web Speech API):

   ```powershell

   start http://127.0.0.1:8787/voice?secret=TU_SECRETO

   ```

   O desde la carpeta del agente: `npm run voice`



2. Permití acceso al **micrófono** cuando el navegador lo pida.



3. **Mantené** el botón (o la barra espaciadora), hablá, y soltá.

   - Ejemplo: «Atlas, estado del sistema»

   - Ejemplo: «Atlas, abrí Cursor»



4. Atlas transcribe en el navegador, envía el texto al agente local, ejecuta el comando y **lee la respuesta** con TTS de Windows.



> El panel web `/admin/jarvis` no captura micrófono de tu PC (CORS/localhost). La voz local va siempre por `http://127.0.0.1:8787/voice`.



### Widget de voz en el admin (Chrome/Edge)



1. En cualquier página `/admin/*` (excepto login) aparece el botón flotante **micrófono** (esquina inferior derecha).

2. En `/admin/jarvis` también hay un panel **Voz web** embebido.

3. **Mantené** el botón, hablá «Atlas, estado del sistema» y soltá.

4. Requiere `JARVIS_ENABLED=true` en Railway para comandos web (`POST /api/jarvis/voice-command` o rutas equivalentes).

5. Comandos que abren apps en tu PC (Cursor, etc.) usan el **puente desktop**: expandí «Puente desktop local», pegá el mismo `JARVIS_DESKTOP_SECRET` que en `.env` del agente, y probá `localhost:8787`. Si el orchestrator web está apagado, el widget intenta el agente local automáticamente.

6. Wake word **Atlas** (o Jarvis) es obligatorio por defecto; desactivar con `JARVIS_WAKE_WORD_ENABLED=false` en Railway.



### Comandos de voz (curl / prueba manual)



```powershell

Invoke-RestMethod -Uri "http://127.0.0.1:8787/voice/stop" -Method POST `

  -Headers @{"Content-Type"="application/json"; "x-jarvis-secret"="TU_SECRETO"} `

  -Body '{"text":"Atlas, estado del sistema"}'

```



### Ejemplos de frases



- Atlas, estado del sistema

- Atlas, abrí Cursor

- Atlas, creá una tarea para Cursor para revisar el bot de WhatsApp

- Atlas, revisá el Marketplace

- Atlas, leéme el informe



### Conexión con el panel (heartbeat)



El desktop envía heartbeat cada 60s a:



`POST https://www.madsjeez.com.ar/api/jarvis/desktop/heartbeat`



**Crítico:** `JARVIS_DESKTOP_SECRET` en Railway y en `apps/jarvis-desktop-agent/.env` deben ser **idénticos**. Si no, el panel muestra Desktop OFF y verás `heartbeat HTTP 401` en la consola del agente.



`MARKETPLACE_JARVIS_SECRET` es opcional y distinto: solo para orquestación remota con `JARVIS_API_SECRET` del backend.



---



## Parte C — n8n (webhook 502)



Si Jarvis emite `jarvis.health_check_completed` y n8n responde **502**, el workflow no está importado o activo.



### Importar en Railway n8n



1. Entrá a https://n8n-production-73fd.up.railway.app (Basic Auth de Railway).

2. **Workflows → Import from File** → `n8n/workflows/jarvis-health-check-completed.json`

3. Activá el workflow (toggle **Active**).

4. Confirmá que el webhook queda en:

   `https://n8n-production-73fd.up.railway.app/webhook/jarvis-health-check-completed`



### Variables backend (madsjeez en Railway)



```env

N8N_ENABLED=true

N8N_WEBHOOK_BASE_URL=https://n8n-production-73fd.up.railway.app/webhook

N8N_AUTOMATION_SECRET=<mismo secreto que validás en n8n>

```



### Probar webhook



```powershell

Invoke-RestMethod -Uri "https://n8n-production-73fd.up.railway.app/webhook/jarvis-health-check-completed" -Method POST `

  -Headers @{"Content-Type"="application/json"; "x-automation-secret"="TU_N8N_SECRET"} `

  -Body '{"event":"jarvis.health_check_completed","data":{"summary":"test","scope":"all"}}'

```



Si sigue 502: revisá logs del servicio n8n en Railway (Postgres conectado, `WEBHOOK_URL` correcto, workflow activo).



---



## Seguridad



| Regla | Default |

|-------|---------|

| Read-only web | true |

| Desktop solo localhost | 127.0.0.1:8787 |

| Panel /voice sin auth GET | solo localhost; POST sigue con secreto |

| Confirmación acciones riesgosas | true |

| Bot WhatsApp | no toca Jarvis |



---



## Voces Atlas / Nova

Voces **propias** inspiradas en asistente sci-fi (no clonan actores ni personajes de película).

| Perfil | Estilo | Voz neural (desktop, `JARVIS_TTS_PROVIDER=edge`) |
|--------|--------|-----------------------------------------------------|
| **Atlas** | Masculino calmado, seguro, fluido (tipo JARVIS) | `es-AR-TomasNeural` |
| **Nova** | Femenino profesional, ágil (tipo Friday) | `es-AR-ElenaNeural` |

Ajuste en `apps/jarvis-desktop-agent/.env`:

```env
JARVIS_TTS_PROVIDER=edge
JARVIS_VOICE_PROFILE=atlas
JARVIS_TTS_VOICE_ATLAS=es-AR-TomasNeural
JARVIS_TTS_VOICE_NOVA=es-AR-ElenaNeural
```

Opcional (acento británico más “sci-fi”, respuestas en inglés): `JARVIS_TTS_VOICE_ATLAS=en-GB-RyanNeural`

Widget web: usa la mejor voz **Online** de Chrome/Edge en español (más fluida que la voz por defecto).



---



## Troubleshooting



| Problema | Solución |

|----------|----------|

| Panel "web OFF" | `JARVIS_ENABLED=true` + redeploy |

| Desktop OFF en panel | `npm run dev` en desktop-agent + mismo `JARVIS_DESKTOP_SECRET` |

| heartbeat HTTP 401 | Secreto distinto entre `.env` local y Railway |

| 401 desktop API | Mismo `x-jarvis-secret` en .env y requests |

| Micrófono no funciona | Usá Chrome/Edge, permití mic, abrí `/voice` o el widget admin |
| Widget sin respuesta web | `JARVIS_ENABLED=true` + login admin |
| Widget desktop 401 | Mismo secreto en widget y `.env` del agente |

| n8n 502 en health check | Importar y activar `jarvis-health-check-completed.json` |

| Comandos web 503 | Normal si `JARVIS_ENABLED=false` |

