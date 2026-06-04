import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfileUuidByEmail } from "@/lib/supabase-profile-map";
import { supabaseService } from "@/lib/supabase/service";
import type { SubscriptionTier } from "@prisma/client";
import { sellMaxImagesForTier } from "@/lib/sell-subscription-limits";
import { getEffectiveTier, canPublishMore } from "@/lib/subscription/effective-tier";

export const dynamic = "force-dynamic";

const ALLOWED_CONDITION = new Set(["new", "used", "refurbished"]);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Crear publicación en catálogo Supabase (seller_id = perfil por email) + imágenes en storage. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const profileId = await getProfileUuidByEmail(session.user.email);
  if (!profileId) {
    return NextResponse.json(
      { error: "No se encontró tu perfil de vendedor. Contactá soporte." },
      { status: 400 }
    );
  }

  // Tier efectivo (incluye trial 14 días con beneficios ULTRA)
  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, subscriptionExpiry: true },
  });
  const trialRow = await prisma.$queryRaw<Array<{ trial_ends_at: Date | null }>>`
    SELECT trial_ends_at FROM users WHERE id = ${session.user.id}
  `;
  const effective = getEffectiveTier({
    subscriptionTier: userRow?.subscriptionTier ?? "FREE",
    subscriptionExpiry: userRow?.subscriptionExpiry ?? null,
    trialEndsAt: trialRow[0]?.trial_ends_at ?? null,
  });
  const tier: SubscriptionTier = effective.tier;
  const maxImages = sellMaxImagesForTier(tier);

  // Enforce límite de publicaciones según tier efectivo.
  const activeCount = await prisma.product.count({
    where: { sellerId: session.user.id, isActive: true },
  });
  const checkPub = canPublishMore(tier, activeCount);
  if (!checkPub.allowed) {
    return NextResponse.json(
      {
        error: `Llegaste al tope de ${checkPub.max} publicaciones de tu plan${effective.inTrial ? "" : ""}. Suscribite a un plan mayor para publicar más.`,
        tier,
        activeCount,
        max: checkPub.max,
        inTrial: effective.inTrial,
      },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const categoryId = String(form.get("categoryId") ?? "").trim() || null;
  const condition = String(form.get("condition") ?? "new").trim();
  const price = Number(form.get("price"));
  const originalPriceRaw = form.get("originalPrice");
  const stock = Number(form.get("stock"));
  const freeShipping = String(form.get("freeShipping") ?? "false") === "true";
  let attributes: Record<string, string> = {};
  const attrRaw = form.get("attributes");
  if (typeof attrRaw === "string" && attrRaw.trim()) {
    try {
      const parsed = JSON.parse(attrRaw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        attributes = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        );
      }
    } catch {
      return NextResponse.json({ error: "attributes debe ser JSON válido" }, { status: 400 });
    }
  }

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Título inválido" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Descripción requerida" }, { status: 400 });
  }
  if (!ALLOWED_CONDITION.has(condition)) {
    return NextResponse.json({ error: "Condición inválida" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }
  if (!Number.isFinite(stock) || stock < 1 || !Number.isInteger(stock)) {
    return NextResponse.json({ error: "Stock inválido" }, { status: 400 });
  }

  const originalPrice =
    originalPriceRaw != null && String(originalPriceRaw).trim() !== ""
      ? Number(originalPriceRaw)
      : null;
  if (originalPrice != null && (!Number.isFinite(originalPrice) || originalPrice <= 0)) {
    return NextResponse.json({ error: "Precio original inválido" }, { status: 400 });
  }

  const files: File[] = [];
  for (const [key, value] of form.entries()) {
    if (key === "images" && value instanceof File && value.size > 0) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "Al menos una imagen es requerida" }, { status: 400 });
  }
  if (files.length > maxImages) {
    return NextResponse.json(
      { error: `Máximo ${maxImages} imágenes con tu plan` },
      { status: 400 }
    );
  }

  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }
    if (f.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagen demasiado grande (máx 8MB)" }, { status: 400 });
    }
  }

  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = `producto-${Date.now()}`;

  let slug = baseSlug;
  let slugOk = false;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data: clash } = await supabaseService.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!clash?.id) {
      slug = candidate;
      slugOk = true;
      break;
    }
  }
  if (!slugOk) {
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  }

  const { data: product, error: productError } = await supabaseService
    .from("products")
    .insert({
      seller_id: profileId,
      category_id: categoryId,
      title,
      slug,
      description,
      condition,
      price,
      original_price: originalPrice,
      currency: "ARS",
      stock,
      sales: 0,
      views: 0,
      is_active: true,
      is_boosted: false,
      free_shipping: freeShipping,
      shipping_methods: [],
      attributes,
    })
    .select("id")
    .single();

  if (productError || !product?.id) {
    console.error("supabase-listing insert:", productError);
    return NextResponse.json({ error: productError?.message || "Error al crear producto" }, { status: 500 });
  }

  const productId = product.id as string;

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]!;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const fileName = `${productId}/${Date.now()}_${i}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseService.storage.from("product-images").upload(fileName, buf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (uploadError) {
      console.error("supabase-listing upload:", uploadError);
      await supabaseService.from("products").delete().eq("id", productId);
      return NextResponse.json({ error: "Error al subir imágenes" }, { status: 500 });
    }

    const { data: pub } = supabaseService.storage.from("product-images").getPublicUrl(fileName);
    const publicUrl = pub.publicUrl;

    const { error: imgErr } = await supabaseService.from("product_images").insert({
      product_id: productId,
      url: publicUrl,
      thumbnail_url: publicUrl,
      alt: title,
      sort_order: i,
      is_primary: i === 0,
    });
    if (imgErr) {
      console.error("supabase-listing product_images:", imgErr);
      await supabaseService.from("products").delete().eq("id", productId);
      return NextResponse.json({ error: "Error al guardar imágenes" }, { status: 500 });
    }
  }

  return NextResponse.json({ id: productId, slug });
}
