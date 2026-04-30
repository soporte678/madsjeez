-- ============================================
-- SCHEMA PARA SISTEMA DE ADMINISTRACIÓN (ERP)
-- MaqJeez Backoffice
-- ============================================

-- 1. TABLA DE ROLES
-- Define los diferentes niveles de acceso
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'SuperAdmin', 'Soporte', 'Moderador', 'Finanzas', 'Logistica'
    level INTEGER NOT NULL DEFAULT 1, -- 1-5 (5 = SuperAdmin)
    permissions JSONB NOT NULL DEFAULT '[]', -- Array de strings con permisos específicos
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO admin_roles (name, level, permissions, description) VALUES
('SuperAdmin', 5, '["*"]', 'Control total del sistema. Acceso a todo.'),
('Soporte Nivel 2', 4, '["users.view", "users.manage", "disputes.view", "disputes.manage", "orders.view", "orders.manage", "messages.view", "messages.moderate"]', 'Gestión completa de usuarios, mediaciones y soporte.'),
('Soporte Nivel 1', 3, '["users.view", "disputes.view", "messages.view", "messages.moderate", "orders.view"]', 'Soporte básico y moderación de mensajes.'),
('Moderador de Catálogo', 3, '["products.view", "products.moderate", "categories.manage", "campaigns.manage"]', 'Aprobación de publicaciones y gestión de categorías.'),
('Finanzas', 4, '["orders.view", "payments.view", "payments.manage", "invoices.view", "invoices.generate", "commissions.view"]', 'Gestión de pagos, comisiones y facturación.'),
('Logística', 3, '["shipments.view", "shipments.manage", "orders.view", "carriers.view"]', 'Gestión de envíos y operadores logísticos.'),
('Auditor', 2, '["logs.view", "users.view", "orders.view", "readonly"]', 'Acceso solo lectura para auditoría.')
ON CONFLICT (name) DO NOTHING;

-- 2. TABLA DE USUARIOS ADMIN
-- Vincula usuarios de Supabase Auth con roles de admin
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- 3. TABLA DE LOGS DE AUDITORÍA
-- Registra todas las acciones de los administradores
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout'
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'product', 'order', 'dispute', etc.
    entity_id UUID,
    details JSONB, -- Información adicional de la acción
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA PARA IMPERSONATION (Modo Dios)
-- Registra cuando un admin visualiza una cuenta como otro usuario
CREATE TABLE IF NOT EXISTS admin_impersonations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    target_user_id UUID NOT NULL, -- Usuario que se está viendo
    target_user_type VARCHAR(20) NOT NULL, -- 'buyer', 'seller'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    reason TEXT, -- Motivo de la impersonación
    session_data JSONB -- Datos de la sesión impersonada
);

-- 5. TABLA DE DISPUTAS (Mediaciones)
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    product_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_review', 'resolved_buyer', 'resolved_seller', 'resolved_split', 'closed'
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    amount_in_dispute DECIMAL(12,2),
    resolution TEXT,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    evidence_buyer JSONB DEFAULT '[]',
    evidence_seller JSONB DEFAULT '[]',
    messages JSONB DEFAULT '[]', -- Chat entre partes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE FRAUD LOGS
CREATE TABLE IF NOT EXISTS fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    order_id UUID,
    ip_address INET,
    email VARCHAR(255),
    phone VARCHAR(20),
    risk_score INTEGER, -- 0-100
    flags JSONB DEFAULT '[]', -- ['duplicate_card', 'suspicious_ip', 'velocity_check', etc]
    action_taken VARCHAR(20) NOT NULL, -- 'blocked', 'review', 'allowed', 'manual_review'
    triggered_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE ENVÍOS CON ESTADOS
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(50), -- 'Andreani', 'Correo Argentino', 'OCA', 'Moto', etc
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'ready', 'picked_up', 'in_transit', 'delayed', 'delivered', 'returned'
    estimated_delivery DATE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    delay_reason TEXT,
    shipping_label_url TEXT,
    weight DECIMAL(8,2), -- en kg
    dimensions JSONB, -- {l: 10, w: 20, h: 30}
    cost DECIMAL(10,2),
    insurance_amount DECIMAL(10,2),
    events JSONB DEFAULT '[]', -- Historial de eventos del envío
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_user ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_action ON fraud_logs(action_taken);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_created_at ON fraud_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver la tabla de admin_users
CREATE POLICY "Admins can view admin_users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Política: Solo SuperAdmins pueden crear/modificar admins
CREATE POLICY "Only SuperAdmins can modify admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            JOIN admin_roles ar ON au.role_id = ar.id
            WHERE au.user_id = auth.uid() AND au.is_active = true AND ar.level >= 5
        )
    );

-- Política: Logs visibles para todos los admins
CREATE POLICY "Admins can view audit_logs" ON admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Política: Solo el sistema puede insertar logs
CREATE POLICY "Only system can insert audit_logs" ON admin_audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para log automático de login
CREATE OR REPLACE FUNCTION log_admin_login()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, details)
    VALUES (NEW.id, 'login', 'admin_user', jsonb_build_object('email', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log de login (actualizará last_login_at)
CREATE TRIGGER log_admin_login_trigger 
    AFTER UPDATE OF last_login_at ON admin_users
    FOR EACH ROW 
    WHEN (OLD.last_login_at IS DISTINCT FROM NEW.last_login_at)
    EXECUTE FUNCTION log_admin_login();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de admins con nombres de roles
CREATE OR REPLACE VIEW admin_users_with_roles AS
SELECT 
    au.*,
    ar.name as role_name,
    ar.level as role_level,
    ar.permissions as role_permissions
FROM admin_users au
JOIN admin_roles ar ON au.role_id = ar.id;

-- Vista de disputas pendientes con info completa
CREATE OR REPLACE VIEW disputes_pending AS
SELECT 
    d.*,
    p.title as product_title,
    buyer.email as buyer_email,
    seller.email as seller_email
FROM disputes d
LEFT JOIN products p ON d.product_id = p.id
LEFT JOIN profiles buyer ON d.buyer_id = buyer.id
LEFT JOIN profiles seller ON d.seller_id = seller.id
WHERE d.status = 'open' OR d.status = 'in_review';

-- ============================================
-- DATOS DE PRUEBA (opcional - quitar en producción)
-- ============================================

-- Crear admin inicial (ejecutar después de tener un usuario en auth.users)
-- INSERT INTO admin_users (user_id, role_id, email, first_name, last_name, is_active)
-- SELECT 
--     au.id,
--     (SELECT id FROM admin_roles WHERE name = 'SuperAdmin'),
--     au.email,
--     'Admin',
--     'Principal',
--     true
-- FROM auth.users au 
-- WHERE au.email = 'tu-email@maqjeez.com'
-- ON CONFLICT (user_id) DO NOTHING;
