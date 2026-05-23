import {
  formatCompactCatalogIndex,
  formatRelevantCatalogHits,
  type CatalogProductHit,
} from "./catalog-product-map";
import {
  getSellerStoreMeta,
  listAllActiveSellerProducts,
  searchSellerProducts,
} from "./product-search-service";

export type StoreContext = {
  sellerName: string;
  storeSlug: string | null;
  storeUrl: string | null;
  sellerImageUrl: string | null;
  description: string | null;
  /** Coincidencias con el mensaje del cliente */
  products: CatalogProductHit[];
  /** Índice compacto de todas las publicaciones activas */
  fullCatalog: CatalogProductHit[];
  fullCatalogBlock: string;
  relevantCatalogBlock: string;
  paymentNote: string;
  shippingNote: string;
};

export async function buildStoreContext(
  sellerId: string,
  customerMessage: string,
  appBase: string
): Promise<StoreContext> {
  const [meta, fullCatalog, products] = await Promise.all([
    getSellerStoreMeta(sellerId, appBase),
    listAllActiveSellerProducts(sellerId, appBase),
    searchSellerProducts(sellerId, customerMessage, appBase, 12),
  ]);

  const fullCatalogBlock = formatCompactCatalogIndex(fullCatalog);
  const relevantCatalogBlock = formatRelevantCatalogHits(products);

  return {
    sellerName: meta.sellerName,
    storeSlug: meta.storeSlug,
    storeUrl: meta.storeUrl,
    sellerImageUrl: meta.sellerImageUrl,
    description: meta.description,
    products,
    fullCatalog,
    fullCatalogBlock,
    relevantCatalogBlock,
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
    ctx.sellerImageUrl ? `IMAGEN_TIENDA_VENDEDOR: ${ctx.sellerImageUrl}` : "",
    ctx.description ? `DESCRIPCION: ${ctx.description.slice(0, 800)}` : "",
    ctx.paymentNote,
    ctx.shippingNote,
    "",
    ctx.fullCatalogBlock,
    "",
    ctx.relevantCatalogBlock,
  ].filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""));

  return lines.join("\n");
}
