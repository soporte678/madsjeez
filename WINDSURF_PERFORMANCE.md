# Windsurf Performance Guide — MadsJeez

Guía para trabajar eficientemente con Windsurf/Cascade en este repositorio.

---

## Qué se optimizó

- `.codeiumignore` creado para excluir carpetas y archivos que no aportan contexto útil.
- `.windsurfrules` reorganizado con sección de Performance Mode al inicio.
- Reglas de MCP (Higgsfield, etc.) marcadas como condicionales — solo se activan cuando la tarea lo requiere explícitamente.

---

## Carpetas que Windsurf ignora (via `.codeiumignore`)

| Carpeta/Patrón | Motivo |
|---|---|
| `node_modules/` | Dependencias — nunca editar |
| `.next/` | Build output de Next.js |
| `dist/`, `build/`, `out/` | Outputs compilados |
| `coverage/` | Reportes de test |
| `.cache/`, `.turbo/` | Caches de build |
| `.vercel/`, `.railway/` | Config de deploy |
| `supabase/.branches/`, `supabase/.temp/` | Estado local de Supabase |
| `public/uploads/`, `public/videos/` | Media subida por usuarios |
| `*.mp4`, `*.mov`, `*.zip`, `*.pdf`, etc. | Binarios y media |
| `package-lock.json`, `yarn.lock` | Lock files sin valor de contexto |
| `.env`, `.env.*` | Secretos — nunca tocar |

---

## Cómo evitar que Windsurf se cuelgue

1. **No pidas "analizá todo el repo"** — usá prompts específicos con archivo o función concreta.
2. **Abrí un chat nuevo por tema** — un cascade largo acumula contexto y se vuelve lento.
3. **Cerrá cascades viejas** — cuando ya tienen 30+ mensajes, empezá una nueva.
4. **No adjuntés archivos grandes** — en especial PDFs, ZIPs o dumps de DB.
5. **Evitá pegar bloques de código enormes** en el chat — mejor referenciar el archivo.

---

## Cómo pedir tareas eficientemente

✅ **Bien:**
```
Fix el error en src/app/checkout/page.tsx línea 120
Agregá validación de email en src/components/AuthForm.tsx
```

❌ **Lento:**
```
Analizá todo el proyecto y decime qué está mal
Leé todos los archivos y optimizá todo
```

---

## Cuándo usar MCP

| MCP | Cuándo activarlo |
|---|---|
| **Higgsfield** | Solo cuando necesitás generar imágenes/videos de marketing |
| **Railway** | Solo cuando necesitás gestionar servicios/deploys de Railway |
| **Supabase** | Solo si hay tareas específicas de Supabase (este proyecto usa Prisma/Railway) |
| **GitHub** | Solo para gestión de PRs, issues o repo vía MCP |
| **Resend** | Solo para configurar o testear emails transaccionales |
| **n8n** | Solo para flujos de automatización |
| **WhatsApp/Meta** | Solo para configurar la integración de WhatsApp Business |
| **Ollama** | Solo para modelos locales de AI |

**Regla general:** si la tarea no menciona explícitamente el servicio, dejá el MCP apagado.

---

## Cuándo abrir un chat nuevo

- Cuando el tema cambió completamente (ej: pasaste de arreglar el checkout a hacer marketing).
- Cuando el cascade tiene más de ~30 mensajes.
- Cuando Windsurf empieza a "olvidar" contexto o repetir errores.
- Cuando terminaste una tarea grande y empezás otra.

---

## Carpetas que NO deben cargarse en Cascade

- `node_modules/` — nunca
- `.next/` — nunca (build output)
- `prisma/migrations/` — solo si hay tarea de migración específica
- `supabase/migrations/` — solo si hay tarea de Supabase específica
- `public/` — solo el archivo concreto que necesitás
- `scripts/sql/` — solo si hay tarea de SQL específica

---

## Stack del proyecto (referencia rápida)

- **Framework:** Next.js 16 App Router
- **DB:** PostgreSQL via Railway + Prisma ORM
- **Auth:** NextAuth
- **Pagos:** MercadoPago
- **Deploy:** Netlify (frontend) / Railway (DB)
- **Emails:** Resend
- **WhatsApp:** Meta Business API
- **Analytics:** Google Analytics 4 + GTM
- **Estilos:** TailwindCSS + shadcn/ui

---

## Archivos grandes encontrados

Al correr el scan (Mayo 2026), **no se encontraron archivos binarios pesados** en el repo.
Los únicos `.sql` presentes son migraciones pequeñas (< 0.1 MB).

Si en el futuro se agregan videos, zips o dumps, agregarlos a `.codeiumignore` inmediatamente.
