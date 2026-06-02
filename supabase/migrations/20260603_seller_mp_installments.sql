-- seller_mercadopago: configuración de cuotas por seller.
--
-- Política Madsjeez: el marketplace no cobra comisión por venta. Cada seller
-- define cuántas cuotas ofrece y qué medios acepta a través de su MercadoPago.
-- Estos valores se mandan al crear la preference de Checkout Pro.
--
-- installments_max:
--   - NULL  → no se pisa: hereda el default de la cuenta MP del seller (lo que
--     tenga configurado en su panel de MP).
--   - 1..24 → se fuerza ese tope en payment_methods.installments.
--
-- accepted_payment_types_json:
--   - NULL → todos los habilitados por el seller en MP.
--   - JSON array de strings (ej: '["credit_card","debit_card","ticket"]')
--     se traduce a payment_methods.excluded_payment_types al crear preference.

ALTER TABLE public.seller_mercadopago
  ADD COLUMN IF NOT EXISTS installments_max smallint
    CHECK (installments_max IS NULL OR (installments_max >= 1 AND installments_max <= 24)),
  ADD COLUMN IF NOT EXISTS accepted_payment_types_json jsonb,
  ADD COLUMN IF NOT EXISTS interest_free_installments smallint
    CHECK (interest_free_installments IS NULL OR (interest_free_installments >= 0 AND interest_free_installments <= 24));

COMMENT ON COLUMN public.seller_mercadopago.installments_max IS
  'Tope de cuotas que ve el comprador. NULL = default del seller en su panel MP.';
COMMENT ON COLUMN public.seller_mercadopago.accepted_payment_types_json IS
  'Array JSON de payment types aceptados. NULL = todos los habilitados por el seller.';
COMMENT ON COLUMN public.seller_mercadopago.interest_free_installments IS
  'Cuotas sin interés que el seller absorbe. Solo informativo en MP: el costo real lo cobra MP al seller.';
