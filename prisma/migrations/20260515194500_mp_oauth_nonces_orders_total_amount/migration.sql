-- PostgREST: checkout marketplace inserta `total_amount` en `orders` (ver `src/app/api/checkout/mp/route.ts`).
-- OAuth Mercado Pago guarda nonces anti-replay en `mp_oauth_used_nonces` (callback vendedor).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_amount" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "mp_oauth_used_nonces" (
    "nonce" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mp_oauth_used_nonces_pkey" PRIMARY KEY ("nonce")
);
