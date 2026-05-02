-- ============================================
-- TABLAS PARA MÓDULOS DE ADMIN - MARKETPLACE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. MARKETPLACE SETTINGS (Key-Value config)
CREATE TABLE IF NOT EXISTS marketplace_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'null',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FLAGGED MESSAGES (Mensajes interceptados por IA)
CREATE TABLE IF NOT EXISTS flagged_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID,
    message_id UUID,
    buyer_id UUID,
    seller_id UUID,
    product_id UUID,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    buyer_name VARCHAR(255),
    seller_name VARCHAR(255),
    product_title VARCHAR(500),
    infraction_type VARCHAR(30) NOT NULL DEFAULT 'other',
    severity VARCHAR(10) NOT NULL DEFAULT 'low',
    ai_confidence DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONTACT INQUIRIES (Consultas generales)
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    category VARCHAR(30) NOT NULL DEFAULT 'general',
    admin_reply TEXT,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. FLAGGED IMAGES (Imágenes reportadas)
CREATE TABLE IF NOT EXISTS flagged_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    product_title VARCHAR(500),
    seller_id UUID,
    seller_name VARCHAR(255),
    image_url TEXT NOT NULL,
    reason VARCHAR(30) NOT NULL DEFAULT 'other',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reported_by UUID,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. FLASH CAMPAIGNS (Campañas flash)
CREATE TABLE IF NOT EXISTS flash_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    current_uses INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    categories JSONB DEFAULT '[]',
    products_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SELLER ADS (Publicidad de vendedores)
CREATE TABLE IF NOT EXISTS seller_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID,
    seller_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL DEFAULT '/',
    placement VARCHAR(30) NOT NULL DEFAULT 'home_banner',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    budget DECIMAL(10,2) DEFAULT 0,
    spent DECIMAL(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SELLER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS seller_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID,
    seller_name VARCHAR(255),
    seller_email VARCHAR(255),
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    amount DECIMAL(10,2) DEFAULT 0,
    billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 8. KYC VERIFICATIONS (si no existe)
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    document_type VARCHAR(20) NOT NULL DEFAULT 'dni',
    document_number VARCHAR(50) NOT NULL,
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    address_proof_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID
);

-- 9. RETURNS (Devoluciones - si no existe)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    buyer_id UUID,
    buyer_email VARCHAR(255),
    buyer_name VARCHAR(255),
    seller_id UUID,
    seller_name VARCHAR(255),
    product_id UUID,
    product_title VARCHAR(500),
    reason TEXT,
    reason_category VARCHAR(30) NOT NULL DEFAULT 'other',
    status VARCHAR(20) NOT NULL DEFAULT 'requested',
    refund_amount DECIMAL(10,2) DEFAULT 0,
    photos JSONB DEFAULT '[]',
    tracking_number VARCHAR(100),
    shipping_label TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- 10. SHIPPING INCIDENTS (Siniestros - si no existe)
CREATE TABLE IF NOT EXISTS shipping_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID,
    order_id UUID,
    type VARCHAR(20) NOT NULL DEFAULT 'lost',
    severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL DEFAULT '',
    photos JSONB DEFAULT '[]',
    claim_amount DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'reported',
    resolution TEXT,
    compensation_amount DECIMAL(10,2),
    reported_by UUID,
    reporter_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_flagged_messages_status ON flagged_messages(status);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_created ON flagged_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged_images_status ON flagged_images(status);
CREATE INDEX IF NOT EXISTS idx_flash_campaigns_status ON flash_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_seller_ads_status ON seller_ads(status);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_status ON seller_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_shipping_incidents_status ON shipping_incidents(status);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_incidents ENABLE ROW LEVEL SECURITY;

-- Políticas: admins pueden ver y modificar todo
-- Nota: Ajustar según la tabla admin_users existente

CREATE POLICY "Admins full access marketplace_settings" ON marketplace_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access flagged_messages" ON flagged_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access contact_inquiries" ON contact_inquiries FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Anyone can insert contact_inquiries" ON contact_inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access flagged_images" ON flagged_images FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access flash_campaigns" ON flash_campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access seller_ads" ON seller_ads FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access seller_subscriptions" ON seller_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access kyc_verifications" ON kyc_verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access returns" ON returns FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admins full access shipping_incidents" ON shipping_incidents FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
