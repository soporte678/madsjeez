import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminLayoutClient } from "./AdminLayoutClient"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseService } from "@/lib/supabase/service"
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const svc = getSupabaseService()
  const { data: adminUser } = await svc
    .from("admin_users")
    .select("id, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!adminUser) {
    redirect("/admin/login")
  }

  const cookieStore = await cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!adminSessionToken) {
    redirect("/admin/login")
  }

  const activeAdminSession = await verifyAdminSession({
    rawToken: adminSessionToken,
    adminUserId: adminUser.id,
    userId: user.id,
  })

  if (!activeAdminSession) {
    redirect("/admin/login")
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  )
}
