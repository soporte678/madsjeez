import { prisma } from "@/lib/prisma";
import { getSupabaseService } from "@/lib/supabase/service";

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseService();
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 10; i += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === email
    );
    if (hit?.id) return hit.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

/**
 * Resuelve el UUID de `profiles` (Supabase) a partir del email.
 * Si no existe, intenta auto-provisionar usuario+perfil para evitar bloquear checkout.
 */
export async function getProfileUuidByEmail(
  email: string | null | undefined
): Promise<string | null> {
  if (!email?.trim()) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseService();

  const initial = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (!initial.error && initial.data?.id) return initial.data.id as string;

  const prismaUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { name: true, isSeller: true },
  });
  const profileRole = prismaUser?.isSeller ? "seller" : "buyer";
  const profileName = prismaUser?.name ?? null;

  const created = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: profileName ? { full_name: profileName } : undefined,
  });

  let authUserId = created.data.user?.id ?? null;
  if (!authUserId) {
    authUserId = await findAuthUserIdByEmail(normalizedEmail);
  }

  if (authUserId) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: authUserId,
          email: normalizedEmail,
          full_name: profileName,
          role: profileRole,
        },
        { onConflict: "email" }
      );
  }

  const finalLookup = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (finalLookup.error || !finalLookup.data?.id) return null;
  return finalLookup.data.id as string;
}

/**
 * Usuario Prisma (User) → profiles.id en Supabase (mismo email).
 */
export async function getProfileUuidForPrismaUserId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return getProfileUuidByEmail(user?.email);
}
