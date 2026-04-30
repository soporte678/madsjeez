"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayoutClient } from "./AdminLayoutClient"

async function checkAdminAccess() {
  const supabase = await createClient()
  
  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return { authorized: false, user: null, role: null }
  }

  // Check admin role in database
  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("*, roles:role_id(*)")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single()

  if (error || !adminUser) {
    return { authorized: false, user: session.user, role: null }
  }

  return { 
    authorized: true, 
    user: session.user, 
    role: adminUser.roles,
    adminUser
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await checkAdminAccess()

  if (!access.authorized) {
    redirect("/admin/login")
  }

  return (
    <AdminLayoutClient 
      user={access.user} 
      role={access.role}
      adminUser={access.adminUser}
    >
      {children}
    </AdminLayoutClient>
  )
}
