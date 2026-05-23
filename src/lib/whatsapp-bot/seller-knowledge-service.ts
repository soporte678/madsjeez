import { prisma } from "@/lib/prisma";
import { searchSellerProducts, type CatalogProductHit } from "./product-search-service";

export type StoreContext = {
  sellerName: string;
  storeSlug: string | null;
  storeUrl: string | null;
  description: string | null;
  products: CatalogProductHit[];
  paymentNote: string;
  shippingNote: string;
};

export async function buildStoreContext(
  sellerId: string,
  customerMessage: string,
  appBase: string
): Promise<StoreContext> {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      sellerName: true,
      name: true,
      storeSlug: true,
      sellerDescription: true,
    },
  });

  const displayName = user?.sellerName || user?.name || "la tienda";
  const storeSlug = user?.storeSlug ?? null;
  const storeUrl = storeSlug ? `${appBase}/tienda/${storeSlug}` : null;
  const products = await searchSellerProducts(sellerId, customerMessage, appBase);

  return {
    sellerName: displayName,
    storeSlug,
    storeUrl,
    description: user?.sellerDescription ?? null,
    products,
    paymentNote:
      "Los medios de pago disponibles se confirman al momento de comprar en Madsjeez (Mercado Pago u otros configurados por el vendedor).",
    shippingNote:
      "Las opciones de envío dependen del producto y la localidad. Si el cliente pregunta por envío, pedí código postal o localidad; no prometas plazos ni envío gratis sin dato en catálogo.",
  };
}

export function formatStoreContextForPrompt(ctx: StoreContext): string {
  const lines: string[] = [
    `TIENDA: ${ctx.sellerName}`,
    ctx.storeUrl ? `URL_TIENDA: ${ctx.storeUrl}` : "",
    ctx.description ? `DESCRIPCION: ${ctx.description.slice(0, 800)}` : "",
    ctx.paymentNote,
    ctx.shippingNote,
  ].filter(Boolean);

  if (ctx.products.length > 0) {
    lines.push("PRODUCTOS_ENCONTRADOS:");
    for (const p of ctx.products) {
      const stockLabel = p.stock > 0 ? `${p.stock} unidades` : "sin stock publicado (consultar)";
      const ship = p.freeShipping ? "Envío gratis según publicación" : "Envío según publicación";
      lines.push(
        `- ${p.title} | Precio publicado: $${Math.round(p.price).toLocaleString("es-AR")} | Stock: ${stockLabel} | ${ship} | Link: ${p.productUrl}`
      );
    }
  } else {
    lines.push("PRODUCTOS_ENCONTRADOS: (ninguno coincide; no inventes productos)");
  }

  return lines.join("\n");
}
