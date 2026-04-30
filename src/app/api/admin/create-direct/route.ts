import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Este endpoint crea un admin directamente - solo usar una vez
export async function POST(request: Request) {
  try {
    const { secret, email, password, name } = await request.json()

    // Verificar secreto
    if (secret !== "maqjeez-create-admin-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "Administrador",
          role: "admin"
        }
      }
    })

    if (authError && !authError.message.includes("already registered")) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData?.user?.id

    if (userId) {
      // Insertar en tabla users
      await supabase.from("users").upsert({
        id: userId,
        email,
        name: name || "Administrador",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString()
      })

      // Asignar rol SuperAdmin
      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "SuperAdmin",
        created_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Admin created successfully",
      email,
      userId
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
