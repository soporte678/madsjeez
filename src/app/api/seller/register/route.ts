/**
 * POST /api/seller/register
 *
 * Upgrade del usuario autenticado a vendedor (isSeller = true).
 * Si body.program === "founding" y quedan cupos, inscribe en founder_program.
 *
 * Requiere sesión activa (next-auth).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const TOTAL_SLOTS = 100;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* body vacío ok */ }

  const isFoundingProgram = body?.program === "founding";

  // 1. Upgrade a vendedor
  await prisma.user.update({
    where: { id: userId },
    data: { isSeller: true },
  });

  // 2. Si programa fundadores → inscribir en founder_program
  if (isFoundingProgram) {
    const sb = getSupabaseService();

    // Verificar cupos disponibles
    const { count } = await sb
      .from("founder_program")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const taken = count ?? 0;
    if (taken >= TOTAL_SLOTS) {
      return NextResponse.json(
        { ok: true, seller: true, founder: false, reason: "sin_cupos" },
        { status: 200 }
      );
    }

    // Verificar que no esté ya inscripto
    const { data: existing } = await sb
      .from("founder_program")
      .select("id")
      .eq("seller_id", userId)
      .maybeSingle();

    if (!existing) {
      const slotNumber = taken + 1;

      // Referido por otro fundador
      const referralCode =
        typeof body?.referralCode === "string" ? body.referralCode.trim().toUpperCase() : null;

      let referredBy: string | null = null;
      if (referralCode) {
        const { data: refStore } = await sb
          .from("stores")
          .select("owner_user_id")
          .ilike("store_slug", referralCode)
          .maybeSingle();
        if (refStore?.owner_user_id) referredBy = refStore.owner_user_id;
      }

      await sb.from("founder_program").insert({
        seller_id: userId,
        slot_number: slotNumber,
        referred_by: referredBy,
        status: "active",
      });
    }

    return NextResponse.json({ ok: true, seller: true, founder: true });
  }

  return NextResponse.json({ ok: true, seller: true, founder: false });
}
