-- Idempotencia webhooks Mercado Pago (mismo payment + mismo status)
CREATE TABLE IF NOT EXISTS public.mp_webhook_processed (
    payment_id TEXT PRIMARY KEY,
    last_mp_status TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nonces OAuth MP (anti-replay del parámetro state)
CREATE TABLE IF NOT EXISTS public.mp_oauth_used_nonces (
    nonce TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.mp_webhook_processed IS 'Evita reprocesar el mismo estado de pago de Mercado Pago.';
COMMENT ON TABLE public.mp_oauth_used_nonces IS 'Nonces de state OAuth Mercado Pago; un solo uso.';
