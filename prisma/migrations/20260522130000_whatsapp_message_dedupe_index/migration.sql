-- Dedupe inbound Evolution messages by provider id (nullable; partial unique)
CREATE UNIQUE INDEX "whatsapp_messages_provider_message_id_key"
ON "whatsapp_messages"("provider_message_id")
WHERE "provider_message_id" IS NOT NULL;
