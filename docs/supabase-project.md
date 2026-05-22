# Supabase — proyecto Madsjeez

| Campo | Valor |
|-------|--------|
| **Nombre (dashboard)** | madsjeez-clean |
| **Project ref** | `doweovsukuskflgnxhhn` |
| **URL pública** | https://doweovsukuskflgnxhhn.supabase.co |
| **Región** | us-west-2 |
| **Estado** | ACTIVE_HEALTHY |

## Proyecto legacy (no usar)

| Campo | Valor |
|-------|--------|
| **Nombre** | soporte678's Project |
| **Project ref** | `svbzmvmmzaqkepeysjyk` |
| **Estado** | INACTIVE |

## Variables de entorno (nombres)

- `NEXT_PUBLIC_SUPABASE_URL` — misma URL pública de arriba
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (dashboard → API)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — servidor (Railway)
- `SUPABASE_SERVICE_ROLE_KEY` — solo backend, nunca en frontend
- `DATABASE_URL` — pooler Supabase (Prisma)
- `SUPABASE_PROJECT_REF` — `doweovsukuskflgnxhhn` (documentación/scripts)

## Esquema

- **Prisma** (`prisma/migrations/`) es la fuente principal de DDL en producción.
- **SQL en `supabase/migrations/`** — políticas/funciones legacy; en remoto solo constan migraciones Flash vía Supabase MCP (`add_flash_system`, `fix_flash_schema_alignment`).
- **OrderStatus (Postgres):** `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` — no usar `completed` en queries; mapear a `DELIVERED` (`src/lib/orders/order-status.ts`).

## Seguridad (advisors)

~60 tablas con RLS deshabilitado. No habilitar RLS masivo sin políticas: bloquearía el acceso. Planificar políticas por tabla con confirmación explícita.
