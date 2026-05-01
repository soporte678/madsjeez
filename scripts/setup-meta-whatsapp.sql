-- Tablas para integración WhatsApp/Meta

-- Configuración de WhatsApp por vendedor
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  business_name VARCHAR(255),
  is_connected BOOLEAN DEFAULT FALSE,
  phone_number_id VARCHAR(100), -- ID de Meta
  waba_id VARCHAR(100), -- WhatsApp Business Account ID
  access_token TEXT, -- Token cifrado o referencia
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(seller_id),
  UNIQUE(phone_number)
);

-- Mensajes enviados/recibidos
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  customer_phone VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type VARCHAR(50) DEFAULT 'text', -- text, template, image, etc.
  content TEXT NOT NULL,
  meta_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook events log
CREATE TABLE IF NOT EXISTS meta_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates de mensajes aprobados por Meta
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  language VARCHAR(10) DEFAULT 'es_AR',
  category VARCHAR(50), -- MARKETING, UTILITY, AUTHENTICATION
  components JSONB,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  meta_template_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_seller ON whatsapp_messages(seller_id);
CREATE INDEX idx_whatsapp_messages_customer ON whatsapp_messages(customer_phone);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);

-- Políticas RLS (Row Level Security)
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Vendedores solo ven su propia configuración
CREATE POLICY "Users can only view their own whatsapp config"
  ON whatsapp_config FOR ALL
  USING (seller_id = auth.uid());

-- Vendedores solo ven sus propios mensajes
CREATE POLICY "Users can only view their own messages"
  ON whatsapp_messages FOR ALL
  USING (seller_id = auth.uid());

-- Comentarios
COMMENT ON TABLE whatsapp_config IS 'Configuración de WhatsApp Business API por vendedor';
COMMENT ON TABLE whatsapp_messages IS 'Historial de mensajes de WhatsApp';
COMMENT ON TABLE meta_webhook_logs IS 'Log de eventos recibidos desde Meta webhooks';
