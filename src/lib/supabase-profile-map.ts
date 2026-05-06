import { prisma } from "@/lib/prisma";
import { getSupabaseService } from "@/lib/supabase/service";

/**
 * Resuelve el UUID de `profiles` (Supabase) a partir del email.
 * Necesario para órdenes MP que viven en tablas Supabase.
 */
export async function getProfileUuidByEmail(
  email: string | null | undefined
): Promise<string | null> {
  if (!email?.trim()) return null;
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
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
