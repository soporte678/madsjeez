-- Nombre personalizado del bot por vendedor (WhatsApp / closer)
ALTER TABLE "seller_bot_configs" ADD COLUMN IF NOT EXISTS "bot_display_name" TEXT;
