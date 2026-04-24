-- ============================================
-- MADSJEEZ Marketplace - Row Level Security (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoted_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================

-- Los usuarios pueden ver todos los perfiles públicos
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Solo admins pueden insertar/eliminar perfiles
CREATE POLICY "Only admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Only admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- CATEGORIES
-- ============================================

-- Categorías visibles para todos
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Solo admins pueden modificar categorías
CREATE POLICY "Only admins can modify categories" ON categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- PRODUCTS
-- ============================================

-- Productos activos visibles para todos
CREATE POLICY "Active products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true);

-- Vendedores pueden ver sus propios productos inactivos
CREATE POLICY "Sellers can view own inactive products" ON products
    FOR SELECT USING (seller_id = auth.uid());

-- Vendedores pueden crear productos
CREATE POLICY "Sellers can create products" ON products
    FOR INSERT WITH CHECK (
        seller_id = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('seller', 'admin'))
    );

-- Vendedores pueden actualizar sus propios productos
CREATE POLICY "Sellers can update own products" ON products
    FOR UPDATE USING (seller_id = auth.uid());

-- Vendedores pueden eliminar sus propios productos
CREATE POLICY "Sellers can delete own products" ON products
    FOR DELETE USING (seller_id = auth.uid());

-- Admins pueden hacer todo
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- PRODUCT_IMAGES
-- ============================================

-- Imágenes visibles para todos
CREATE POLICY "Product images are viewable by everyone" ON product_images
    FOR SELECT USING (true);

-- Vendedores pueden gestionar imágenes de sus productos
CREATE POLICY "Sellers can manage own product images" ON product_images
    FOR ALL USING (
        EXISTS (SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid())
    );

-- ============================================
-- ORDERS
-- ============================================

-- Usuarios pueden ver sus propias órdenes (como comprador o vendedor)
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Compradores pueden crear órdenes
CREATE POLICY "Buyers can create orders" ON orders
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Compradores y vendedores pueden actualizar órdenes propias
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============================================
-- ORDER_ITEMS
-- ============================================

-- Items visibles para participantes de la orden
CREATE POLICY "Order items viewable by order participants" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Items insertables por comprador de la orden
CREATE POLICY "Order items insertable by buyer" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id AND buyer_id = auth.uid()
        )
    );

-- ============================================
-- SUBSCRIPTION_TIERS
-- ============================================

-- Planes visibles para todos
CREATE POLICY "Subscription tiers are viewable by everyone" ON subscription_tiers
    FOR SELECT USING (true);

-- Solo admins pueden modificar planes
CREATE POLICY "Only admins can modify tiers" ON subscription_tiers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

-- Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Solo admins pueden crear/actualizar suscripciones
CREATE POLICY "Only admins can manage subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- REPUTATION_SCORES
-- ============================================

-- Scores visibles para todos
CREATE POLICY "Reputation scores are viewable by everyone" ON reputation_scores
    FOR SELECT USING (true);

-- Solo sistema (via trigger) puede modificar scores
CREATE POLICY "Only system can modify reputation" ON reputation_scores
    FOR ALL USING (false);

-- ============================================
-- REVIEWS
-- ============================================

-- Reviews visibles para todos (si están aprobadas)
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (is_visible = true);

-- Usuarios pueden ver sus propias reviews pendientes
CREATE POLICY "Users can view own pending reviews" ON reviews
    FOR SELECT USING (reviewer_id = auth.uid());

-- Compradores pueden crear reviews
CREATE POLICY "Buyers can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND buyer_id = auth.uid() 
            AND status = 'completed'
        )
    );

-- Reviewers pueden actualizar sus propias reviews
CREATE POLICY "Reviewers can update own reviews" ON reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- ============================================
-- PROMOTED_PRODUCTS
-- ============================================

-- Promociones visibles para todos
CREATE POLICY "Promoted products are viewable by everyone" ON promoted_products
    FOR SELECT USING (true);

-- Vendedores pueden ver sus propias promociones
CREATE POLICY "Sellers can view own promotions" ON promoted_products
    FOR SELECT USING (seller_id = auth.uid());

-- Vendedores pueden crear promociones
CREATE POLICY "Sellers can create promotions" ON promoted_products
    FOR INSERT WITH CHECK (seller_id = auth.uid());

-- Vendedores pueden actualizar sus propias promociones
CREATE POLICY "Sellers can update own promotions" ON promoted_products
    FOR UPDATE USING (seller_id = auth.uid());

-- ============================================
-- CONVERSATIONS
-- ============================================

-- Participantes pueden ver sus conversaciones
CREATE POLICY "Participants can view conversations" ON conversations
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Participantes pueden crear conversaciones
CREATE POLICY "Participants can create conversations" ON conversations
    FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Participantes pueden actualizar sus conversaciones
CREATE POLICY "Participants can update conversations" ON conversations
    FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============================================
-- MESSAGES
-- ============================================

-- Participantes de conversación pueden ver mensajes
CREATE POLICY "Participants can view messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Participantes pueden enviar mensajes
CREATE POLICY "Participants can create messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Remitentes pueden actualizar sus mensajes (ej: leído)
CREATE POLICY "Senders can update own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- ============================================
-- PAYMENT_TRANSACTIONS
-- ============================================

-- Usuarios pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions" ON payment_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Solo sistema puede crear/actualizar transacciones
CREATE POLICY "Only system can manage transactions" ON payment_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
