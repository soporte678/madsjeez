# Agency Agents — referencia de trabajo (Madsjeez)

Biblioteca externa: **[msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)**  
Uso: roles especializados para auditar, planificar, implementar y revisar — **sin** duplicar su estructura dentro de este repo.

## Mantener la referencia local

```bash
# Primera vez (si no existe la carpeta)
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git .cursor/references/agency-agents

# Actualizar
git -C .cursor/references/agency-agents pull
```

La copia en `.cursor/references/agency-agents/` está en `.gitignore` (no versionamos ~200 archivos de terceros). La regla de Cursor `.cursor/rules/agency-agents-team.mdc` sí está versionada.

## Estructura de Agency Agents (resumen)

| Carpeta | Agentes (.md) | Rol en NEXUS |
|---------|---------------|--------------|
| `engineering/` | 29 | Build, APIs, DB, seguridad, SRE |
| `design/` | 8 | UI, UX, marca |
| `marketing/` | 30 | SEO, growth, contenido, redes |
| `testing/` | 8 | API, evidencia, performance, a11y |
| `product/` | 5 | Priorización, research |
| `project-management/` | 6 | Sprints, coordinación |
| `support/` | 6 | Analytics, compliance, infra |
| `sales/` | 8 | Ventas B2B (uso puntual) |
| `strategy/` | 16 | NEXUS, playbooks por fase, runbooks |
| `specialized/` | 41 | Dominios verticales (usar solo si aplica) |
| `paid-media/`, `finance/`, `game-development/`, etc. | varios | Solo si la tarea lo exige |

Orquestación: `strategy/nexus-strategy.md`, `strategy/QUICKSTART.md`, `strategy/coordination/agent-activation-prompts.md`.

---

## Mapa del repo Madsjeez (auditoría previa)

| Área | Rutas principales | Riesgo |
|------|-------------------|--------|
| Checkout / MP | `src/app/api/checkout/mp/route.ts`, `src/lib/checkout/`, `src/lib/mercadopago/` | **Crítico** |
| Webhooks pagos | `src/app/api/webhooks/mercadopago/route.ts` | **Crítico** |
| Carrito / órdenes | `src/app/api/cart/`, `src/app/api/orders/` | Alto |
| Flash logística | `src/lib/flash/`, `src/app/api/flash/**`, `src/components/flash/` | Alto |
| Liquidaciones Flash | `src/app/api/flash/admin/settlements/` | Alto |
| Seller / Meli | `src/app/api/seller/`, `src/lib/meli/` (si existe) | Alto |
| Admin | `src/app/admin/`, `src/app/api/admin/` | Alto |
| Datos | `prisma/schema.prisma`, `prisma/migrations/`, `supabase/` | **Crítico** |
| Home / catálogo UI | `src/app/HomePageClient.tsx`, componentes producto | Medio |
| Auth | NextAuth, `src/lib/auth*` (buscar al auditar) | Alto |

Siempre: `grep` + leer callers antes de cambiar firmas o columnas DB.

---

## Respuesta estándar (plantilla)

Cuando pidas una tarea, la IA debe contestar así:

### 1. Rol/agente recomendado
Ej.: *Backend Architect* + *API Tester* (validación post-cambio).

### 2. Objetivo
Qué se logra y qué queda fuera de alcance.

### 3. Archivos o áreas a revisar
Lista de paths en `madsjeez`.

### 4. Prompt exacto para ejecutar

```text
Contexto: repo Madsjeez (marketplace + Flash + MP). Regla: .cursor/rules/agency-agents-team.mdc

Rol: [Agency Agent Name] — leer .cursor/references/agency-agents/[division]/[file].md

Tarea: [descripción]

Auditar primero: [rutas]

Restricciones: no modificar [checkout/webhooks/prisma...]

Entregable: [diff mínimo + tests]

Criterios de éxito: [lista]
```

Ajustar herramienta en la primera línea si aplica (`Cursor` / `Windsurf` / etc.).

### 5. Qué no tocar
Contratos API, estados de pedido, split escrow, webhooks MP, migraciones sin plan, etc.

### 6. Criterios de éxito
Tests (`npm test`), lint, flujo manual documentado, sin regresión en rutas críticas.

---

## Escenarios frecuentes → agentes + herramienta

### Checkout / Mercado Pago
- **Agentes:** Backend Architect, Security Engineer, API Tester  
- **Herramienta:** Cursor (API) + Windsurf (UI checkout)  
- **Revisar:** `src/app/api/checkout/mp/route.ts`, `src/lib/checkout/escrow-split.ts`, webhooks MP  
- **No tocar:** lógica de split, retries de token seller, idempotencia webhook sin tests

### Flash — zonas, tarifas, asignación
- **Agentes:** Backend Architect, SRE (producción)  
- **Herramienta:** Cursor  
- **Revisar:** `src/app/api/flash/shipping-options/route.ts`, `src/lib/flash/rate-config.ts`, `assign/route.ts`, `prisma` modelos Flash  
- **No tocar:** estados de shipment sin migración; QR/audit trail

### Dashboard conductor / admin Flash UI
- **Agentes:** Frontend Developer, UX Architect  
- **Herramienta:** Windsurf  
- **Revisar:** `src/app/flash/`, `src/components/flash/`, `src/app/admin/flash/`

### Marketplace — búsqueda / catálogo / SEO
- **Agentes:** Database Optimizer, SEO Specialist, Frontend Developer  
- **Herramienta:** Cursor (queries) + Windsurf (UI)  
- **Revisar:** rutas búsqueda, `src/lib` data access, metadata Next

### Integración Meli (import/export catálogo)
- **Agentes:** Backend Architect, API Tester, Technical Writer (si documentás)  
- **Herramienta:** Cursor  
- **Revisar:** scripts `package.json` `download:meli-*`, APIs seller Meli

### Bug en producción (pagos / envíos)
- **Agentes:** Incident Response Commander → Backend Architect → Evidence Collector  
- **Modo:** NEXUS-Micro  
- **No tocar:** hotfix sin rollback plan

### Refactor grande
- **Agentes:** Software Architect + Code Reviewer  
- **Herramienta:** Claude (diseño) → Codex/Cursor (implementación por fases)

### Tests / regresión
- **Agentes:** API Tester, Evidence Collector, Reality Checker  
- **Herramienta:** Codex o Cursor  
- **Revisar:** `vitest`, tests existentes antes de añadir duplicados

---

## Ejemplo completo (pedido del usuario)

**Pedido:** “Arreglar que Flash Plus no muestra precio en checkout”

| Sección | Contenido |
|---------|-----------|
| **Rol** | Frontend Developer + Backend Architect (validación precio server-side) |
| **Objetivo** | Mostrar precio correcto y consistente con `flash/shipping-options` y checkout MP |
| **Revisar** | `FlashShippingForm.tsx`, `api/flash/shipping-options/route.ts`, `api/checkout/mp/route.ts` |
| **Prompt** | Ver plantilla arriba con esas rutas y rol UX Architect si hay copy/confusión |
| **No tocar** | escrow MP, creación de preferencia, webhooks |
| **Éxito** | Opción Plus muestra precio; POST checkout rechaza price tampering; test o checklist manual |

---

## Proyectos hermanos

Misma metodología puede aplicarse a **Madsjeez Design** (landing), **Flash** como producto, y otros repos: copiar solo `.cursor/rules/agency-agents-team.mdc` y este doc adaptando la tabla de rutas.

---

## Licencia

Agency Agents es MIT ([repositorio upstream](https://github.com/msitarzewski/agency-agents)). La referencia local es solo para consulta durante el desarrollo.
