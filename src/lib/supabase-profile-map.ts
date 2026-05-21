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

async function upsertProfileResilient(params: {
  authUserId: string | null;
  normalizedEmail: string;
  profileName: string | null;
  profileRole: "buyer" | "seller";
  prismaUserId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseService();
  const candidateIds = [
    params.authUserId,
    params.prismaUserId ?? null,
    crypto.randomUUID(),
  ].filter(Boolean) as string[];

  for (const id of candidateIds) {
    const attempts: Array<Record<string, unknown>> = [{ id, email: params.normalizedEmail }, { id }];

    for (const payload of attempts) {
      const { error } = await supabase.from("profiles").insert(payload);
      if (!error) return;
      // 23505: unique violation (id/email ya existe) -> no es bloqueo
      const code = (error as { code?: string }).code;
      if (code === "23505") return;
    }
  }
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
    select: { id: true },
  });

  const created = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: undefined,
  });

  let authUserId = created.data.user?.id ?? null;
  if (!authUserId) {
    authUserId = await findAuthUserIdByEmail(normalizedEmail);
  }

  await upsertProfileResilient({
    authUserId,
    normalizedEmail,
    profileName: null,
    profileRole: "buyer",
    prismaUserId: prismaUser?.id ?? null,
  });

  const finalLookup = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (!finalLookup.error && finalLookup.data?.id) return finalLookup.data.id as string;

  if (authUserId) {
    const byId = await supabase.from("profiles").select("id").eq("id", authUserId).maybeSingle();
    if (!byId.error && byId.data?.id) return byId.data.id as string;
  }
  return null;
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
