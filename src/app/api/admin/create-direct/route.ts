import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Este endpoint crea un admin directamente usando la Admin API de Supabase
// Requiere SUPABASE_SERVICE_ROLE_KEY en variables de entorno
export async function POST(request: Request) {
  try {
    const { secret, email, password, name } = await request.json()

    // Verificar secreto
    if (secret !== "madsjeez-create-admin-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email y password son requeridos" }, { status: 400 })
    }

    const supabaseUrl = "https://doweovsukuskflgnxhhn.supabase.co"
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: "SUPABASE_SERVICE_ROLE_KEY no configurada. Agrega esta variable de entorno." 
      }, { status: 500 })
    }

    // Crear cliente admin con service_role key
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Primero borrar usuario existente si hay uno con ese email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      // Borrar admin_users asociado primero
      await supabaseAdmin.from("admin_users").delete().eq("user_id", existingUser.id)
      // Borrar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
    }

    // Crear usuario con Admin API (ya viene confirmado)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name || "Administrador",
        role: "admin"
      }
    })

    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    const userId = authData.user.id

    // Obtener o crear rol SuperAdmin
    let { data: superAdminRole } = await supabaseAdmin
      .from("admin_roles")
      .select("id")
      .eq("name", "SuperAdmin")
      .single()

    if (!superAdminRole) {
      const { data: newRole, error: roleError } = await supabaseAdmin
        .from("admin_roles")
        .insert({
          name: "SuperAdmin",
          level: 5,
          permissions: ["*"],
          description: "Control total del sistema"
        })
        .select("id")
        .single()

      if (roleError) {
        return NextResponse.json({ error: `Role error: ${roleError.message}` }, { status: 500 })
      }
      superAdminRole = newRole
    }

    // Insertar en admin_users
    const { error: adminError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        user_id: userId,
        role_id: superAdminRole!.id,
        email,
        first_name: name || "Admin",
        last_name: "MadsJeez",
        is_active: true
      })

    if (adminError) {
      return NextResponse.json({ error: `Admin insert error: ${adminError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin creado exitosamente con email confirmado",
      email,
      userId
    })

  } catch (error: any) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
