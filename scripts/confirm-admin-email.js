const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://doweovsukuskflgnxhhn.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ Error: Se requiere SUPABASE_SERVICE_ROLE_KEY')
  console.log('Configuralo como variable de entorno y vuelve a ejecutar')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirmAdminEmail() {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      'vianferreteria@gmail.com', // o el UUID del usuario si lo conoces
      { email_confirm: true }
    )

    if (error) {
      // Intentar buscar el usuario por email primero
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ Error listando usuarios:', listError.message)
        return
      }

      const adminUser = users.users.find(u => u.email === 'vianferreteria@gmail.com')
      
      if (!adminUser) {
        console.error('❌ Usuario no encontrado')
        return
      }

      // Confirmar por UUID
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { email_confirm: true }
      )

      if (updateError) {
        console.error('❌ Error confirmando email:', updateError.message)
        return
      }

      console.log('✅ Email confirmado exitosamente')
      console.log('Usuario:', adminUser.email)
      console.log('ID:', adminUser.id)
    } else {
      console.log('✅ Email confirmado exitosamente')
      console.log('Usuario:', data.user.email)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

confirmAdminEmail()
