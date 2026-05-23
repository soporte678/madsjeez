import { prisma } from "@/lib/prisma";
import type { MeliItemDetail } from "./types";
import { meliGetItemDescription, meliPostItem, meliPostItemDescription } from "./api";
import { getMeliAccessTokenForAccount } from "./prisma-session";
import { parseMlaIds } from "./export-catalog";

export type MeliPublishToAccountResult = {
  mlaOrProductId: string;
  productId?: string;
  ok: boolean;
  newMla?: string;
  error?: string;
};

type ProductForPublish = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  condition: string;
  freeShipping: boolean;
  meliItemId: string | null;
  meliOAuthAccountId: string | null;
  meliCategoryId: string | null;
  meliListingTypeId: string | null;
  meliCurrencyId: string | null;
  meliPayload: unknown;
  images: { url: string }[];
  attributes: { name: string; value: string }[];
  variations: {
    price: number;
    stock: number;
    attributes: unknown;
    meliVariationId: string | null;
  }[];
};

function meliPayloadAsItem(payload: unknown): MeliItemDetail | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as MeliItemDetail;
  return p.id || p.category_id ? p : null;
}

function mapLocalConditionToMeli(condition: string): string {
  const c = condition.toLowerCase();
  if (c === "used") return "used";
  if (c === "refurbished") return "not_specified";
  return "new";
}

function buildCreateBody(product: ProductForPublish, item: MeliItemDetail | null): Record<string, unknown> {
  const picturesFromProduct = product.images.map((i) => i.url).filter(Boolean).slice(0, 12);
  const picturesFromPayload =
    item?.pictures
      ?.map((p) => p.secure_url || p.url)
      .filter((u): u is string => Boolean(u))
      .slice(0, 12) ?? [];

  const pictureSources = (picturesFromProduct.length ? picturesFromProduct : picturesFromPayload).map((url) => ({
    source: url,
  }));

  const categoryId = item?.category_id || product.meliCategoryId;
  if (!categoryId) {
    throw new Error("Sin categoría ML (importá desde la cuenta origen primero).");
  }
  if (!pictureSources.length) {
    throw new Error("Sin fotos para publicar en ML.");
  }

  const body: Record<string, unknown> = {
    title: product.title.slice(0, 60),
    category_id: categoryId,
    currency_id: item?.currency_id || product.meliCurrencyId || "ARS",
    buying_mode: "buy_it_now",
    listing_type_id: item?.listing_type_id || product.meliListingTypeId || "gold_special",
    condition: item?.condition || mapLocalConditionToMeli(product.condition),
    pictures: pictureSources,
  };

  const attrsFromPayload =
    item?.attributes
      ?.filter((a) => a.id && a.value_name)
      .map((a) => ({ id: a.id, value_name: a.value_name })) ?? [];

  if (attrsFromPayload.length) {
    body.attributes = attrsFromPayload.slice(0, 60);
  }

  const shipping = item?.shipping;
  if (shipping?.mode) {
    body.shipping = {
      mode: shipping.mode,
      free_shipping: product.freeShipping ?? shipping.free_shipping ?? false,
    };
  } else {
    body.shipping = { mode: "me2", free_shipping: product.freeShipping };
  }

  const variations = item?.variations;
  if (variations?.length) {
    body.variations = variations.map((v) => ({
      attribute_combinations: (v.attribute_combinations || []).map((ac) => ({
        id: ac.id,
        name: ac.name,
        value_name: ac.value_name,
      })),
      price: Number(v.price) > 0 ? Number(v.price) : product.price,
      available_quantity: Math.max(0, v.available_quantity ?? 0),
    }));
  } else if (product.variations.length) {
    body.variations = product.variations.map((v) => ({
      attribute_combinations: Object.entries(
        (typeof v.attributes === "object" && v.attributes !== null ? v.attributes : {}) as Record<string, string>
      ).map(([name, value_name]) => ({ name, value_name })),
      price: v.price > 0 ? v.price : product.price,
      available_quantity: Math.max(0, v.stock),
    }));
  } else {
    body.price = product.price;
    body.available_quantity = Math.max(0, product.stock);
  }

  return body;
}

async function publishOneProduct(
  product: ProductForPublish,
  targetAccountId: string,
  accessToken: string
): Promise<MeliPublishToAccountResult> {
  const key = product.meliItemId || product.id;

  if (product.meliOAuthAccountId === targetAccountId && product.meliItemId) {
    return {
      mlaOrProductId: key,
      productId: product.id,
      ok: true,
      newMla: product.meliItemId,
      error: "Ya vinculada a la cuenta destino.",
    };
  }

  const item = meliPayloadAsItem(product.meliPayload);
  let body: Record<string, unknown>;
  try {
    body = buildCreateBody(product, item);
  } catch (e) {
    return {
      mlaOrProductId: key,
      productId: product.id,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const created = await meliPostItem(accessToken, body);
  if (!created.ok) {
    const err = created.data as { message?: string; cause?: unknown[]; error?: string };
    const causeMsg = Array.isArray(err?.cause)
      ? err.cause.map((c) => (typeof c === "object" && c && "message" in c ? String((c as { message: string }).message) : "")).filter(Boolean).join("; ")
      : "";
    return {
      mlaOrProductId: key,
      productId: product.id,
      ok: false,
      error: err?.message || err?.error || causeMsg || `ML HTTP ${created.status}`,
    };
  }

  const newId = (created.data as { id?: string })?.id;
  if (!newId) {
    return { mlaOrProductId: key, productId: product.id, ok: false, error: "ML no devolvió ID de publicación." };
  }

  const desc = product.description?.trim();
  if (desc.length > 0) {
    await meliPostItemDescription(accessToken, newId, desc.slice(0, 50_000));
  }

  const previousMla = product.meliItemId;
  const previousAccountId = product.meliOAuthAccountId;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      meliItemId: newId,
      meliOAuthAccountId: targetAccountId,
      meliLastSyncedAt: new Date(),
      meliStatus: "active",
      meliPayload: {
        ...(item && typeof item === "object" ? item : {}),
        id: newId,
        _madsjeezTransfer: {
          fromMla: previousMla,
          fromAccountId: previousAccountId,
          at: new Date().toISOString(),
        },
      },
    },
  });

  return { mlaOrProductId: key, productId: product.id, ok: true, newMla: newId };
}

export async function publishCatalogToMeliAccount(
  userId: string,
  options: {
    sourceAccountId: string;
    targetAccountId: string;
    meliItemIds?: string[];
    productIds?: string[];
    maxItems?: number;
  }
): Promise<{ results: MeliPublishToAccountResult[]; errors: string[] }> {
  const errors: string[] = [];
  const results: MeliPublishToAccountResult[] = [];

  if (options.sourceAccountId === options.targetAccountId) {
    return { results, errors: ["La cuenta origen y destino deben ser distintas."] };
  }

  const [sourceAcc, targetAcc] = await Promise.all([
    prisma.sellerMeliOAuth.findFirst({
      where: { id: options.sourceAccountId, userId },
      select: { id: true },
    }),
    prisma.sellerMeliOAuth.findFirst({
      where: { id: options.targetAccountId, userId },
      select: { id: true },
    }),
  ]);

  if (!sourceAcc) errors.push("Cuenta origen no encontrada.");
  if (!targetAcc) errors.push("Cuenta destino no encontrada.");
  if (errors.length) return { results, errors };

  const tok = await getMeliAccessTokenForAccount(options.targetAccountId);
  if (!tok) {
    return { results, errors: ["Token de la cuenta destino expirado. Reconectá Mercado Libre."] };
  }

  const mlaFilter = parseMlaIds(options.meliItemIds);
  const productIdFilter = options.productIds?.length ? [...new Set(options.productIds)] : null;
  const maxItems = Math.min(Math.max(options.maxItems ?? 200, 1), 500);

  const products = await prisma.product.findMany({
    where: {
      sellerId: userId,
      meliOAuthAccountId: options.sourceAccountId,
      meliItemId: mlaFilter.length ? { in: mlaFilter } : { not: null },
      ...(productIdFilter ? { id: { in: productIdFilter } } : {}),
    },
    take: maxItems,
    include: {
      images: { orderBy: { order: "asc" }, select: { url: true } },
      attributes: { select: { name: true, value: true } },
      variations: {
        select: {
          price: true,
          stock: true,
          attributes: true,
          meliVariationId: true,
        },
      },
    },
  });

  if (!products.length) {
    return {
      results,
      errors: [
        mlaFilter.length
          ? "No hay productos en el marketplace con esos MLA en la cuenta origen. Importá desde la cuenta 1 primero."
          : "No hay publicaciones vinculadas a la cuenta origen en el marketplace.",
      ],
    };
  }

  for (const p of products) {
    const r = await publishOneProduct(p as ProductForPublish, options.targetAccountId, tok.accessToken);
    results.push(r);
    if (!r.ok && r.error && !r.error.includes("Ya vinculada")) {
      errors.push(`${p.meliItemId || p.id}: ${r.error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  return { results, errors };
}
