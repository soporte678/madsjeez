-- ============================================
-- MADSJEEZ Marketplace - Datos Iniciales (Seed)
-- ============================================

-- ============================================
-- PLANES DE SUSCRIPCIÓN
-- ============================================

INSERT INTO subscription_tiers (
    tier_type,
    name,
    description,
    price_ars,
    price_usd,
    commission_rate,
    features,
    max_products,
    max_images_per_product,
    analytics_level,
    support_level,
    has_priority_search,
    monthly_promotions_included
) VALUES 
(
    'free',
    'Gratis',
    'Comienza a vender sin costo. Ideal para vendedores ocasionales.',
    0,
    0,
    10.00,
    '[
        "Publicaciones ilimitadas",
        "Hasta 5 imágenes por producto",
        "Soporte por email (48-72hs)",
        "Visibilidad estándar en búsquedas"
    ]'::jsonb,
    NULL,
    5,
    1,
    'email',
    false,
    0
),
(
    'plata',
    'Plata',
    'Perfecto para vendedores que quieren crecer. Acceso a métricas básicas y mejor visibilidad.',
    9999,
    9.99,
    5.00,
    '[
        "Publicaciones ilimitadas",
        "Hasta 10 imágenes por producto",
        "Métricas básicas de ventas",
        "Soporte por email (24-48hs)",
        "Badge Plata en perfil",
        "Visibilidad mejorada en búsquedas",
        "Descuento 10% en impulsos"
    ]'::jsonb,
    NULL,
    10,
    2,
    'email',
    false,
    0
),
(
    'gold',
    'Gold',
    'Para vendedores serios. Métricas avanzadas, gráficos y soporte prioritario.',
    19999,
    19.99,
    3.00,
    '[
        "Publicaciones ilimitadas",
        "Hasta 15 imágenes por producto",
        "Métricas avanzadas con gráficos",
        "Soporte prioritario (12-24hs)",
        "Badge Gold en perfil",
        "Prioridad en búsquedas",
        "Descuento 25% en impulsos",
        "Exportar datos a CSV"
    ]'::jsonb,
    NULL,
    15,
    3,
    'priority',
    true,
    2
),
(
    'platinum',
    'Platinum',
    'La experiencia definitiva para vendedores profesionales. Máxima exposición y herramientas exclusivas.',
    49999,
    49.99,
    1.00,
    '[
        "Publicaciones ilimitadas",
        "Hasta 20 imágenes por producto",
        "Métricas personalizadas + API",
        "Soporte 24/7 con agente dedicado",
        "Badge Platinum en perfil",
        "Máxima prioridad en búsquedas",
        "2 impulsos mensuales incluidos",
        "Exportar datos a CSV/Excel",
        "Acceso beta a nuevas funciones",
        "Verificación de cuenta prioritaria"
    ]'::jsonb,
    NULL,
    20,
    4,
    'dedicated',
    true,
    2
);

-- ============================================
-- CATEGORÍAS PRINCIPALES (Basadas en estructura tipo MELI)
-- ============================================

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Tecnología', 'tecnologia', 'Laptop', 1),
('Electrodomésticos', 'electrodomesticos', 'Home', 2),
('Hogar y Muebles', 'hogar-muebles', 'Sofa', 3),
('Deportes y Fitness', 'deportes-fitness', 'Dumbbell', 4),
('Moda y Accesorios', 'moda-accesorios', 'Shirt', 5),
('Juguetes y Bebés', 'juguetes-bebes', 'Baby', 6),
('Belleza y Cuidado Personal', 'belleza-cuidado', 'Sparkles', 7),
('Alimentos y Bebidas', 'alimentos-bebidas', 'Utensils', 8),
('Libros, Revistas y Comics', 'libros-revistas', 'BookOpen', 9),
('Música, Películas y Series', 'musica-peliculas', 'Film', 10),
('Arte, Librería y Mercería', 'arte-libreria', 'Palette', 11),
('Salud y Equipamiento Médico', 'salud-equipamiento', 'Heart', 12),
('Industrias y Oficinas', 'industrias-oficinas', 'Building2', 13),
('Agro', 'agro', 'Tractor', 14),
('Servicios', 'servicios', 'Wrench', 15),
('Vehículos', 'vehiculos', 'Car', 16),
('Inmuebles', 'inmuebles', 'Home', 17);

-- ============================================
-- SUBCATEGORÍAS DE TECNOLOGÍA
-- ============================================

WITH parent_tech AS (SELECT id FROM categories WHERE slug = 'tecnologia')
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, parent_tech.id, icon, sort_order
FROM parent_tech,
(VALUES
    ('Celulares y Teléfonos', 'celulares-telefonos', 'Smartphone', 1),
    ('Computación', 'computacion', 'Monitor', 2),
    ('Cámaras y Accesorios', 'camaras-accesorios', 'Camera', 3),
    ('Consolas y Videojuegos', 'consolas-videojuegos', 'Gamepad2', 4),
    ('Audio', 'audio', 'Headphones', 5),
    ('Televisores', 'televisores', 'Tv', 6),
    ('Smartwatches y Accesorios', 'smartwatches', 'Watch', 7),
    ('Drones y Accesorios', 'drones', 'Plane', 8),
    ('Componentes de PC', 'componentes-pc', 'Cpu', 9),
    ('Tablets y Accesorios', 'tablets', 'Tablet', 10)
) AS subcategories(name, slug, icon, sort_order);

-- ============================================
-- SUBCATEGORÍAS DE ELECTRODOMÉSTICOS
-- ============================================

WITH parent_electro AS (SELECT id FROM categories WHERE slug = 'electrodomesticos')
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, parent_electro.id, icon, sort_order
FROM parent_electro,
(VALUES
    ('Heladeras y Freezers', 'heladeras-freezers', 'Refrigerator', 1),
    ('Lavarropas y Secarropas', 'lavarropas-secarropas', 'WashingMachine', 2),
    ('Cocinas y Hornos', 'cocinas-hornos', 'Flame', 3),
    ('Aires Acondicionados', 'aires-acondicionados', 'Wind', 4),
    ('Calefacción', 'calefaccion', 'Heater', 5),
    ('Pequeños Electrodomésticos', 'pequenos-electrodomesticos', 'Blender', 6),
    ('Ventiladores', 'ventiladores', 'Fan', 7)
) AS subcategories(name, slug, icon, sort_order);

-- ============================================
-- SUBCATEGORÍAS DE HOGAR Y MUEBLES
-- ============================================

WITH parent_hogar AS (SELECT id FROM categories WHERE slug = 'hogar-muebles')
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, parent_hogar.id, icon, sort_order
FROM parent_hogar,
(VALUES
    ('Muebles para el Hogar', 'muebles-hogar', 'Sofa', 1),
    ('Muebles de Jardín', 'muebles-jardin', 'TreePine', 2),
    ('Decoración', 'decoracion', 'Lamp', 3),
    ('Iluminación', 'iluminacion', 'Lightbulb', 4),
    ('Bazar y Cocina', 'bazar-cocina', 'ChefHat', 5),
    ('Textiles de Hogar', 'textiles-hogar', 'BedDouble', 6),
    ('Baños', 'banos', 'Bath', 7),
    ('Organización', 'organizacion', 'Archive', 8)
) AS subcategories(name, slug, icon, sort_order);

-- ============================================
-- SUBCATEGORÍAS DE MODA
-- ============================================

WITH parent_moda AS (SELECT id FROM categories WHERE slug = 'moda-accesorios')
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, parent_moda.id, icon, sort_order
FROM parent_moda,
(VALUES
    ('Ropa de Mujer', 'ropa-mujer', 'Woman', 1),
    ('Ropa de Hombre', 'ropa-hombre', 'Man', 2),
    ('Ropa de Niños', 'ropa-ninos', 'Baby', 3),
    ('Calzado', 'calzado', 'Footprints', 4),
    ('Bolsos y Carteras', 'bolsos-carteras', 'ShoppingBag', 5),
    ('Accesorios de Moda', 'accesorios-moda', 'Glasses', 6),
    ('Joyería y Relojes', 'joyeria-relojes', 'Gem', 7),
    ('Lentes y Gafas', 'lentes-gafas', 'Glasses', 8)
) AS subcategories(name, slug, icon, sort_order);

-- ============================================
-- SUBCATEGORÍAS DE DEPORTES
-- ============================================

WITH parent_deportes AS (SELECT id FROM categories WHERE slug = 'deportes-fitness')
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, parent_deportes.id, icon, sort_order
FROM parent_deportes,
(VALUES
    ('Fitness y Musculación', 'fitness-musculacion', 'Dumbbell', 1),
    ('Bicicletas y Ciclismo', 'bicicletas-ciclismo', 'Bike', 2),
    ('Fútbol', 'futbol', 'Circle', 3),
    ('Running', 'running', 'PersonStanding', 4),
    ('Natación', 'natacion', 'Waves', 5),
    ('Camping y Outdoor', 'camping-outdoor', 'Tent', 6),
    ('Pesca', 'pesca', 'Fish', 7),
    ('Deportes de Raqueta', 'deportes-raqueta', 'Target', 8)
) AS subcategories(name, slug, icon, sort_order);

-- ============================================
-- CONFIGURACIONES DEL SISTEMA
-- ============================================

-- Tabla para configuraciones generales
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuraciones iniciales
INSERT INTO system_settings (key, value, description) VALUES
('promotion_base_price', '9999', 'Precio base en ARS para impulsar una publicación'),
('promotion_duration_days', '7', 'Duración en días de una promoción'),
('commission_free_tier', '10.00', 'Comisión por defecto para usuarios gratuitos'),
('max_free_products', '50', 'Máximo de productos para usuarios gratuitos'),
('search_results_per_page', '24', 'Cantidad de resultados por página en búsquedas'),
('featured_products_count', '12', 'Cantidad de productos destacados en home'),
('currency_usd_rate', '1000', 'Tasa de cambio ARS/USD para referencia');

-- ============================================
-- ADMIN POR DEFECTO (opcional - descomentar si se necesita)
-- ============================================
-- Nota: Este usuario debe existir en auth.users primero
-- INSERT INTO profiles (id, email, full_name, role, is_verified)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     'admin@madsjeez.com',
--     'Administrador MADSJEEZ',
--     'admin',
--     true
-- );
