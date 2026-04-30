const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'tu-url-de-supabase';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu-service-role-key';

// Datos del admin a crear
const ADMIN_EMAIL = 'vianferreteria@gmail.com';
const ADMIN_PASSWORD = 'AdminMaqJeez2024!';
const ADMIN_NAME = 'Administrador MaqJeez';

async function createAdmin() {
  console.log('🔧 Creando usuario administrador...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Crear usuario en Auth
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Creando usuario en Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('⚠️ El usuario ya existe en Auth');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuario creado en Auth:', authData.user.id);
    }

    // 2. Verificar si ya existe en tabla users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (existingUser) {
      console.log('⚠️ El usuario ya existe en tabla users');
    } else {
      // 3. Insertar en tabla users
      console.log('📝 Insertando en tabla users...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (userError) throw userError;
      console.log('✅ Usuario insertado en tabla users');
    }

    // 4. Asignar rol SuperAdmin si existe la tabla
    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: authData?.user?.id || existingUser?.id,
          role: 'SuperAdmin',
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (!roleError) {
        console.log('✅ Rol SuperAdmin asignado');
      }
    } catch (e) {
      console.log('ℹ️ Tabla user_roles no existe o ya tiene el rol');
    }

    console.log('\n🎉 ADMIN CREADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('═══════════════════════════════════════');
    console.log('\n🔗 URL de login: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
