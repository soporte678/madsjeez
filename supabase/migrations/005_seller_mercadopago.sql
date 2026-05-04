-- ============================================
-- TABLA: seller_mercadopago
-- Almacena las credenciales OAuth de MercadoPago para cada vendedor
-- ============================================

CREATE TABLE IF NOT EXISTS seller_mercadopago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Datos de OAuth
    mp_access_token TEXT NOT NULL,
    mp_refresh_token TEXT,
    mp_token_expires_at TIMESTAMP WITH TIME ZONE,
    mp_user_id TEXT,
    mp_email TEXT,
    mp_nickname TEXT,
    
    -- Estado
    is_connected BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(seller_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_seller_mercadopago_seller_id ON seller_mercadopago(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_mercadopago_mp_user_id ON seller_mercadopago(mp_user_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE seller_mercadopago ENABLE ROW LEVEL SECURITY;

-- Solo el propio vendedor puede ver sus credenciales
CREATE POLICY "seller_view_own_mercadopago" ON seller_mercadopago
    FOR SELECT USING (seller_id = auth.uid()::text);

-- Solo el propio vendedor puede insertar (durante OAuth)
CREATE POLICY "seller_insert_own_mercadopago" ON seller_mercadopago
    FOR INSERT WITH CHECK (seller_id = auth.uid()::text);

-- Solo el propio vendedor puede actualizar
CREATE POLICY "seller_update_own_mercadopago" ON seller_mercadopago
    FOR UPDATE USING (seller_id = auth.uid()::text);

-- Solo el propio vendedor puede eliminar (desconectar)
CREATE POLICY "seller_delete_own_mercadopago" ON seller_mercadopago
    FOR DELETE USING (seller_id = auth.uid()::text);

-- ============================================
-- TRIGGER: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_seller_mercadopago_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_seller_mercadopago ON seller_mercadopago;
CREATE TRIGGER trg_update_seller_mercadopago
    BEFORE UPDATE ON seller_mercadopago
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_mercadopago_timestamp();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE seller_mercadopago IS 'Credenciales OAuth de MercadoPago para vendedores del marketplace';
