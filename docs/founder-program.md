# Programa Sellers Fundadores — descuento automático de cupos

**Regla:** cada vez que un usuario se convierte en vendedor (`isSeller = true`),
se reclama automáticamente un cupo de los 100 del programa fundador. El contador
de "cupos restantes" del landing baja solo.

## Cómo funciona (a nivel base de datos)

La lógica vive en Supabase (migración `founder_slot_autoclaim_trigger_v2`), no en
el código de la app, para que funcione sin importar por qué camino un usuario
pase a vendedor (registro web, auth, admin, import, etc.) y sea **race-safe**.

1. **Tabla `founder_program`** — un registro por seller fundador
   (`seller_id` text = `public.users.id`, `slot_number`, `status='active'`).
   `seller_id` es UNIQUE → un solo cupo por vendedor (idempotente).

2. **Trigger `trg_claim_founder_slot`** sobre `public.users`:
   - Se dispara `AFTER INSERT OR UPDATE OF "isSeller"` cuando `isSeller` queda en `true`.
   - Función `claim_founder_slot()`:
     - Si el seller ya tiene cupo → no hace nada (idempotente).
     - Toma `pg_advisory_xact_lock` para serializar (evita que dos registros
       simultáneos tomen el cupo 100 a la vez).
     - Si ya hay 100 activos → no reclama (cupos agotados).
     - Si no, inserta el siguiente `slot_number` con `status='active'`.

3. **Endpoint** `GET /api/program/founders/count` cuenta `status='active'` y
   devuelve `{ taken, total: 100, slotsLeft, percentTaken }`. ISR 60s.

4. **Landing** (`FoundingSellersSection`) lee ese endpoint y muestra la barra.

## Estado inicial
Backfill: los 3 vendedores que ya existían quedaron como los primeros fundadores
(slots 1-3). Estado: **3 tomados / 97 restantes**.

## Operación

- **Cambiar el tope de 100:** editar `if (active_count >= 100)` en la función
  `claim_founder_slot()` y `TOTAL_SLOTS` en `src/app/api/program/founders/count/route.ts`.
- **Sacar un fundador:** `UPDATE founder_program SET status='revoked' WHERE seller_id=...`
  (libera el cupo en el conteo; no borrar para mantener historial).
- **Ver fundadores:** `SELECT seller_id, slot_number, joined_at FROM founder_program ORDER BY slot_number;`

## Verificado
- Trigger reclama cupo al pasar `isSeller→true` (test con user temporal: 3→4, revertido).
- Idempotencia: re-set de isSeller no duplica cupo.
- Endpoint live: `{"taken":3,"slotsLeft":97}`.
