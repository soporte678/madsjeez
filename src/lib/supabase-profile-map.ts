import { prisma } from "@/lib/prisma";
import { getSupabaseService } from "@/lib/supabase/service";

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

  const prismaUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { name: true, isSeller: true },
  });
  if (!prismaUser) return null;

  const created = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: prismaUser.name ? { full_name: prismaUser.name } : undefined,
  });

  if (!created.error && created.data.user?.id) {
    await supabase.from("profiles").upsert(
      {
        id: created.data.user.id,
        email: normalizedEmail,
        full_name: prismaUser.name ?? null,
        role: prismaUser.isSeller ? "seller" : "buyer",
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
