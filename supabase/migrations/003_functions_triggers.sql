-- ============================================
-- MADSJEEZ Marketplace - Triggers y Funciones
-- ============================================

-- ============================================
-- FUNCIONES DE REPUTACIÓN
-- ============================================

-- Función para calcular el color de reputación basado en métricas
CREATE OR REPLACE FUNCTION calculate_reputation_color(
    p_claims_pct DECIMAL,
    p_delays_pct DECIMAL,
    p_cancellations_pct DECIMAL,
    p_total_sales INTEGER
) RETURNS reputation_color AS $$
DECLARE
    v_color reputation_color;
BEGIN
    -- Verde oscuro: menos de 0.5% reclamos, menos de 1% demoras, 50+ ventas
    IF p_claims_pct < 0.5 AND p_delays_pct < 1.0 AND p_total_sales >= 50 THEN
        v_color := 'dark_green';
    -- Verde claro: menos de 1% reclamos y menos de 2% demoras
    ELSIF p_claims_pct < 1.0 AND p_delays_pct < 2.0 THEN
        v_color := 'light_green';
    -- Amarillo: 1-3% reclamos o 2-5% demoras
    ELSIF p_claims_pct < 3.0 AND p_delays_pct < 5.0 THEN
        v_color := 'yellow';
    -- Naranja: 3-5% reclamos o 5-10% demoras
    ELSIF p_claims_pct < 5.0 AND p_delays_pct < 10.0 THEN
        v_color := 'orange';
    -- Rojo: más de 5% reclamos o más de 10% demoras
    ELSE
        v_color := 'red';
    END IF;
    
    RETURN v_color;
END;
$$ LANGUAGE plpgsql;

-- Función para recalcular reputación de un vendedor
CREATE OR REPLACE FUNCTION recalculate_seller_reputation(p_seller_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_orders INTEGER;
    v_completed_orders INTEGER;
    v_claims_count INTEGER;
    v_delays_count INTEGER;
    v_cancellations_count INTEGER;
    v_positive_reviews INTEGER;
    v_neutral_reviews INTEGER;
    v_negative_reviews INTEGER;
    v_average_rating DECIMAL(3,2);
    v_claims_pct DECIMAL(5,2);
    v_delays_pct DECIMAL(5,2);
    v_cancellations_pct DECIMAL(5,2);
    v_new_color reputation_color;
BEGIN
    -- Contar órdenes totales y completadas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status::text IN ('DELIVERED', 'completed'))
    INTO v_total_orders, v_completed_orders
    FROM orders
    WHERE seller_id = p_seller_id;
    
    -- Contar reclamos y demoras de reviews
    SELECT 
        COUNT(*) FILTER (WHERE is_claim = true),
        COUNT(*) FILTER (WHERE is_delay = true),
        COUNT(*) FILTER (WHERE rating >= 4),
        COUNT(*) FILTER (WHERE rating = 3),
        COUNT(*) FILTER (WHERE rating <= 2),
        COALESCE(AVG(rating), 0)
    INTO 
        v_claims_count, 
        v_delays_count,
        v_positive_reviews,
        v_neutral_reviews,
        v_negative_reviews,
        v_average_rating
    FROM reviews
    WHERE seller_id = p_seller_id;
    
    -- Contar cancelaciones
    SELECT COUNT(*) INTO v_cancellations_count
    FROM orders
    WHERE seller_id = p_seller_id AND status::text IN ('CANCELLED', 'cancelled');
    
    -- Calcular porcentajes (evitar división por cero)
    IF v_total_orders > 0 THEN
        v_claims_pct := (v_claims_count::DECIMAL / v_total_orders) * 100;
        v_delays_pct := (v_delays_count::DECIMAL / v_total_orders) * 100;
        v_cancellations_pct := (v_cancellations_count::DECIMAL / v_total_orders) * 100;
    ELSE
        v_claims_pct := 0;
        v_delays_pct := 0;
        v_cancellations_pct := 0;
    END IF;
    
    -- Calcular color
    v_new_color := calculate_reputation_color(
        v_claims_pct, 
        v_delays_pct, 
        v_cancellations_pct,
        v_completed_orders
    );
    
    -- Insertar o actualizar reputación
    INSERT INTO reputation_scores (
        seller_id,
        color,
        total_sales,
        total_orders,
        positive_reviews,
        neutral_reviews,
        negative_reviews,
        claims_count,
        claims_percentage,
        delays_count,
        delays_percentage,
        cancellations_count,
        cancellations_percentage,
        average_rating,
        last_calculated_at
    ) VALUES (
        p_seller_id,
        v_new_color,
        v_completed_orders,
        v_total_orders,
        v_positive_reviews,
        v_neutral_reviews,
        v_negative_reviews,
        v_claims_count,
        v_claims_pct,
        v_delays_count,
        v_delays_pct,
        v_cancellations_count,
        v_cancellations_pct,
        v_average_rating,
        NOW()
    )
    ON CONFLICT (seller_id) DO UPDATE SET
        color = v_new_color,
        total_sales = v_completed_orders,
        total_orders = v_total_orders,
        positive_reviews = v_positive_reviews,
        neutral_reviews = v_neutral_reviews,
        negative_reviews = v_negative_reviews,
        claims_count = v_claims_count,
        claims_percentage = v_claims_pct,
        delays_count = v_delays_count,
        delays_percentage = v_delays_pct,
        cancellations_count = v_cancellations_count,
        cancellations_percentage = v_cancellations_pct,
        average_rating = v_average_rating,
        last_calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular reputación cuando se completa una orden
CREATE OR REPLACE FUNCTION trigger_recalculate_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status::text IN ('DELIVERED', 'completed') AND OLD.status::text NOT IN ('DELIVERED', 'completed') THEN
        PERFORM recalculate_seller_reputation(NEW.seller_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_reputation_on_order_complete
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_on_order_complete();

-- Trigger para recalcular reputación cuando se crea una review
CREATE OR REPLACE FUNCTION trigger_recalculate_on_review()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalculate_seller_reputation(NEW.seller_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_reputation_on_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_on_review();

-- ============================================
-- FUNCIONES DE STOCK
-- ============================================

-- Función para decrementar stock al crear orden
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        stock = stock - NEW.quantity,
        sold_count = sold_count + NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_stock_on_order_item
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION decrement_product_stock();

-- Función para restaurar stock al cancelar orden
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status::text IN ('CANCELLED', 'cancelled') AND OLD.status::text NOT IN ('CANCELLED', 'cancelled') THEN
        UPDATE products
        SET 
            stock = stock + oi.quantity,
            sold_count = sold_count - oi.quantity
        FROM order_items oi
        WHERE products.id = oi.product_id
        AND oi.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restore_stock_on_cancel
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION restore_product_stock();

-- ============================================
-- FUNCIONES DE CONVERSACIONES
-- ============================================

-- Función para actualizar last_message_at y contadores
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
BEGIN
    -- Obtener participantes de la conversación
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
    FROM conversations WHERE id = NEW.conversation_id;
    
    -- Actualizar conversación
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        buyer_unread_count = CASE 
            WHEN NEW.sender_id = v_seller_id THEN buyer_unread_count + 1 
            ELSE buyer_unread_count 
        END,
        seller_unread_count = CASE 
            WHEN NEW.sender_id = v_buyer_id THEN seller_unread_count + 1 
            ELSE seller_unread_count 
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- FUNCIONES DE PROMOCIÓN
-- ============================================

-- Función para activar/desactivar productos promocionados
CREATE OR REPLACE FUNCTION update_product_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Activar promoción
        UPDATE products
        SET 
            is_promoted = true,
            promoted_until = NEW.end_date
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Desactivar promoción
        UPDATE products
        SET 
            is_promoted = false,
            promoted_until = null
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_promotion
    AFTER INSERT OR UPDATE OR DELETE ON promoted_products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_promotion_status();

-- ============================================
-- FUNCIONES DE BÚSQUEDA
-- ============================================

-- Función para buscar productos con filtros
CREATE OR REPLACE FUNCTION search_products(
    p_query TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_condition TEXT DEFAULT NULL,
    p_seller_id UUID DEFAULT NULL,
    p_is_promoted BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    price DECIMAL,
    original_price DECIMAL,
    condition TEXT,
    stock INTEGER,
    is_promoted BOOLEAN,
    seller_id UUID,
    category_id UUID,
    primary_image TEXT,
    seller_color reputation_color,
    relevance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.price,
        p.original_price,
        p.condition,
        p.stock,
        p.is_promoted,
        p.seller_id,
        p.category_id,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image,
        rs.color as seller_color,
        CASE 
            WHEN p_query IS NOT NULL THEN 
                ts_rank(p.search_vector, plainto_tsquery('spanish', p_query))
            ELSE 1.0
        END as relevance
    FROM products p
    LEFT JOIN reputation_scores rs ON rs.seller_id = p.seller_id
    WHERE 
        p.is_active = true
        AND (p_query IS NULL OR p.search_vector @@ plainto_tsquery('spanish', p_query))
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_condition IS NULL OR p.condition = p_condition)
        AND (p_seller_id IS NULL OR p.seller_id = p_seller_id)
        AND (p_is_promoted IS NULL OR p.is_promoted = p_is_promoted)
    ORDER BY 
        p.is_promoted DESC,
        relevance DESC,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIONES DE PERFIL
-- ============================================

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer')
    );
    
    -- Crear reputación inicial
    INSERT INTO reputation_scores (seller_id, color)
    VALUES (NEW.id, 'red');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Este trigger debe crearse en el esquema auth de Supabase
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_new_user();

-- Nota: El trigger anterior debe crearse mediante la consola de Supabase
-- o usando la CLI de Supabase con un comando como:
-- supabase db push
