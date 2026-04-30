import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// This endpoint creates the first admin user
// It can only be used once when no admins exist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, secretKey } = body

    // Verify secret key for security
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || "maqjeez-setup-2024"
    if (secretKey !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Check if any admin users already exist
    const { data: existingAdmins, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .limit(1)

    if (checkError) {
      console.error("Error checking existing admins:", checkError)
      return NextResponse.json(
        { error: "Failed to check existing admins", details: checkError.message },
        { status: 500 }
      )
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: "Admin users already exist. Cannot create initial admin." },
        { status: 409 }
      )
    }

    // Get or create SuperAdmin role
    let { data: superAdminRole } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("name", "SuperAdmin")
      .single()

    if (!superAdminRole) {
      // Create SuperAdmin role
      const { data: newRole, error: roleError } = await supabase
        .from("admin_roles")
        .insert({
          name: "SuperAdmin",
          level: 5,
          permissions: ["*"],
          description: "Control total del sistema. Acceso a todo.",
        })
        .select("id")
        .single()

      if (roleError) {
        console.error("Error creating SuperAdmin role:", roleError)
        return NextResponse.json(
          { error: "Failed to create SuperAdmin role", details: roleError.message },
          { status: 500 }
        )
      }

      superAdminRole = newRole
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
        },
      },
    })

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json(
        { error: "Failed to create auth user", details: authError?.message },
        { status: 500 }
      )
    }

    // Create admin user record
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .insert({
        user_id: authData.user.id,
        role_id: superAdminRole.id,
        email,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
      })
      .select("*")
      .single()

    if (adminError) {
      console.error("Error creating admin user:", adminError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: "Failed to create admin user", details: adminError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Initial admin user created successfully",
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.first_name,
        lastName: adminUser.last_name,
        role: "SuperAdmin",
      },
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
