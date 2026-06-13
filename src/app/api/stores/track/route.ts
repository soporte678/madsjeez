/**
 * POST /api/stores/track — registra un evento de tienda para estadísticas.
 * Público (lo llama el storefront), rate-limited por IP. Resuelve la tienda por
 * slug/subdominio y guarda el evento. Ignora en silencio tiendas inexistentes.
 */

import { NextRequest, NextResponse } from "next/server";
import type { StoreEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TYPES = new Set<StoreEventType>(["view", "product_click", "whatsapp_click", "share"]);

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`stores-track:${clientIpFromRequest(req)}`, { max: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { slug?: string; type?: string; productId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const slug = String(body.slug || "").trim().toLowerCase();
  const type = String(body.type || "") as StoreEventType;
  if (!slug || !TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

  const store = await prisma.store.findFirst({
    where: { OR: [{ slug }, { subdomain: slug }], isActive: true },
    select: { id: true },
  });
  if (!store) return NextResponse.json({ ok: true }); // tienda desconocida → no-op

  await prisma.storeEvent.create({
    data: {
      storeId: store.id,
      type,
      productId: typeof body.productId === "string" ? body.productId.slice(0, 40) : null,
    },
  });
  return NextResponse.json({ ok: true });
}
