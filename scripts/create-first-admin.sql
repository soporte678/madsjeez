-- ============================================
-- SCRIPT: Crear Primer Usuario Administrador
-- Ejecutar esto en SQL Editor de Supabase
-- ============================================

-- IMPORTANTE: Configura estos valores antes de ejecutar
DO $$
DECLARE
    v_email TEXT := 'admin@maqjeez.com.ar';  -- Cambia este email
    v_password TEXT := 'Admin123!';            -- Cambia esta contraseña
    v_first_name TEXT := 'Admin';
    v_last_name TEXT := 'Principal';
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    -- 1. Verificar que no existan admins
    IF EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
        RAISE EXCEPTION 'Ya existen usuarios admin. No se puede ejecutar este script.';
    END IF;

    -- 2. Crear rol SuperAdmin si no existe
    SELECT id INTO v_role_id FROM admin_roles WHERE name = 'SuperAdmin';
    
    IF v_role_id IS NULL THEN
        INSERT INTO admin_roles (name, level, permissions, description)
        VALUES ('SuperAdmin', 5, '["*"]', 'Control total del sistema. Acceso a todo.')
        RETURNING id INTO v_role_id;
    END IF;

    -- 3. Crear usuario en auth.users (esto requiere usar la función de Supabase)
    -- NOTA: No podemos insertar directamente en auth.users por seguridad
    -- Debes usar la API de Supabase Auth o el panel de Supabase
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INSTRUCCIONES PARA COMPLETAR LA CREACION:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Ve a Authentication > Users en Supabase';
    RAISE NOTICE '2. Click en "Invite user" o "Add user"';
    RAISE NOTICE '3. Email: %', v_email;
    RAISE NOTICE '4. Password: %', v_password;
    RAISE NOTICE '5. Despues de crear el usuario, ejecuta:';
    RAISE NOTICE '';
    RAISE NOTICE 'INSERT INTO admin_users (user_id, role_id, email, first_name, last_name, is_active)';
    RAISE NOTICE 'VALUES (''<USER_ID_DEL_USUARIO_CREADO>'', ''%'', ''%'', ''%'', ''%'', true);',
        v_role_id, v_email, v_first_name, v_last_name;
    RAISE NOTICE '';
    RAISE NOTICE 'SuperAdmin Role ID: %', v_role_id;
    RAISE NOTICE '========================================';

END $$;
