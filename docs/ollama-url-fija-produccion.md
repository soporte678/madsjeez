# Ollama con URL fija en producción (sin PowerShell abierto)

## Resumen

| Opción | URL fija | PC encendida | Costo |
|--------|----------|--------------|-------|
| **A) Ollama en Railway** | ✅ Siempre | ❌ No | RAM del plan Railway (~$5–20/mes según modelo) |
| **B) ngrok dominio reservado** | ✅ Si | ✅ Sí (Ollama local) | ngrok paid ~USD 8/mes |
| **C) ngrok gratis** | ❌ Cambia | ✅ Sí + ventana/proceso | Gratis |

**Recomendado para prod 24/7:** **Opción A** — mismo proyecto Railway que Madsjeez/Evolution.

---

## Opción A — Ollama en Railway (sin ngrok, sin tu PC)

### 1. Nuevo servicio

1. Railway → proyecto **grand-education** (o uno dedicado) → **New Service**
2. **Deploy from Docker Image:** `ollama/ollama:latest`
3. **Volume** en `/root/.ollama` (modelos persisten)
4. Variables del servicio Ollama:
   ```env
   OLLAMA_HOST=0.0.0.0:11434
   ```
5. **Networking** → **Generate Domain** → ej. `ollama-production-xxxx.up.railway.app`
6. **Resources:** mínimo **8 GB RAM** para `qwen2.5:7b`; **16 GB+** para `qwen3:14b` / `closer-ventas-14b`

### 2. Descargar modelo (shell del servicio Ollama)

```bash
ollama pull qwen2.5:7b
# o el que uses en local:
ollama pull qwen3:14b
ollama create closer-ventas-14b -f Modelfile
```

Verificar:

```bash
curl https://TU-DOMINIO-OLLAMA.up.railway.app/api/tags
```

### 3. Variables en servicio **madsjeez** (web)

```env
WHATSAPP_AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://TU-DOMINIO-OLLAMA.up.railway.app
OLLAMA_MODEL=closer-ventas-14b
OLLAMA_NUM_PREDICT=1200
OLLAMA_NUM_CTX=4096
```

**No uses ngrok.** Redeploy Madsjeez.

### 4. Probar

Panel → Bot WhatsApp → Configuración → **Probar Ollama**.

---

## Opción B — ngrok con dominio fijo + servicio Windows

Si querés seguir con Ollama en tu PC (GPU local) pero **sin ventana de PowerShell**:

### Requisitos

1. Cuenta ngrok con plan que incluya **Static Domain** ([ngrok pricing](https://ngrok.com/pricing))
2. Dominio reservado, ej. `tu-bot-ollama.ngrok-free.app`
3. Ollama instalado y corriendo como servicio Windows (instalador oficial)

### Instalación automática (PowerShell **como Administrador**)

```powershell
cd C:\Users\Mi Pc\.cursor\projects\empty-window\madsjeez
.\scripts\install-ngrok-windows-service.ps1 -NgrokDomain "tu-bot-ollama.ngrok-free.app"
```

El script:

- Configura `ngrok.yml` con túnel fijo al puerto 11434
- Instala ngrok como **servicio de Windows** (arranca con el sistema)
- Muestra la URL para pegar en Railway

### Variables Railway (fijas para siempre)

```env
OLLAMA_BASE_URL=https://tu-bot-ollama.ngrok-free.app
OLLAMA_MODEL=closer-ventas-14b
WHATSAPP_AI_PROVIDER=ollama
```

### Actualizar .env.local sin polling

En `.env.local`:

```env
NGROK_STATIC_DOMAIN=https://tu-bot-ollama.ngrok-free.app
```

Luego `npm run ollama:tunnel` usa esa URL directamente (no depende de ngrok en :4040).

---

## Opción C — Cloudflare Tunnel (URL fija con tu dominio)

Si tenés un dominio en Cloudflare, podés exponer `11434` con **cloudflared** y hostname fijo (`ollama.tudominio.com`). Gratis, sin ngrok; requiere dominio propio y cuenta Cloudflare.

---

## Qué NO hace falta después de A o B

- ❌ `ngrok http 11434` en PowerShell cada vez
- ❌ `npm run ollama:tunnel:watch` (solo si seguís con URL dinámica gratis)
- ❌ Cambiar `OLLAMA_BASE_URL` en Railway al reiniciar ngrok
