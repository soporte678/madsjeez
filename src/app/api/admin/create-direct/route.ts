import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { assertAdminBootstrapAllowed } from "@/lib/admin-bootstrap"

/**
 * Crea un admin vía Supabase Admin API. Solo con secreto fuerte y entorno permitido.
 */
export async function POST(request: Request) {
  const gate = assertAdminBootstrapAllowed()
  if (gate) return gate

  try {
    const { secret, email, password, name } = await request.json()

    const expected = process.env.ADMIN_CREATE_DIRECT_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email y password son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.",
        },
        { status: 500 }
      )
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === email)

    if (existingUser) {
      await supabaseAdmin.from("admin_users").delete().eq("user_id", existingUser.id)
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name || "Administrador",
        role: "admin",
      },
    })

    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    const userId = authData.user.id

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
          description: "Control total del sistema",
        })
        .select("id")
        .single()

      if (roleError) {
        return NextResponse.json({ error: `Role error: ${roleError.message}` }, { status: 500 })
      }
      superAdminRole = newRole
    }

    const { error: adminError } = await supabaseAdmin.from("admin_users").insert({
      user_id: userId,
      role_id: superAdminRole!.id,
      email,
      first_name: name || "Admin",
      last_name: "MadsJeez",
      is_active: true,
    })

    if (adminError) {
      return NextResponse.json({ error: `Admin insert error: ${adminError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin creado exitosamente con email confirmado",
      email,
      userId,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
