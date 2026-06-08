/**
 * Importador universal de catálogos — detección + mapeo por plataforma.
 *
 * Soporta los export CSV/Excel de:
 *   - Tienda Nube / TiendaNube
 *   - Shopify
 *   - Empretienda (Emprende Tienda)
 *   - WooCommerce
 *   - CSV genérico (Madsjeez / cualquiera con headers estándar)
 *
 * Cada plataforma exporta con headers distintos. Detectamos la plataforma por
 * la firma de columnas y mapeamos a un `NormalizedRow` común que el commit
 * endpoint persiste.
 */

export type PlatformId =
  | "tiendanube"
  | "shopify"
  | "empretienda"
  | "woocommerce"
  | "generic";

export type NormalizedRow = {
  externalId: string | null;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  sku: string | null;
  condition: string;
  freeShipping: boolean;
  isActive: boolean;
  category: string | null;
  images: string[];
};

export type PlatformMeta = {
  id: PlatformId;
  name: string;
  /** Cómo el seller exporta el CSV en esa plataforma. */
  exportHint: string;
};

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  tiendanube: {
    id: "tiendanube",
    name: "Tienda Nube",
    exportHint:
      "Panel Tienda Nube → Productos → Exportar → te llega un CSV por email.",
  },
  shopify: {
    id: "shopify",
    name: "Shopify",
    exportHint:
      "Shopify admin → Products → Export → Plain CSV file → All products.",
  },
  empretienda: {
    id: "empretienda",
    name: "Empretienda",
    exportHint:
      "Panel Empretienda → Productos → Exportar productos → descargás el Excel/CSV.",
  },
  woocommerce: {
    id: "woocommerce",
    name: "WooCommerce",
    exportHint:
      "WordPress → Productos → Exportar → Exportar todas las columnas → Generar CSV.",
  },
  generic: {
    id: "generic",
    name: "CSV genérico",
    exportHint:
      "Cualquier CSV con columnas: titulo, descripcion, precio, stock, categoria, imagen.",
  },
};

/* ------------------------------------------------------------------ */
/* Helpers de parseo                                                   */
/* ------------------------------------------------------------------ */

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // saca tildes
}

function toNumber(v: unknown): number {
  if (v == null) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  // Quita símbolos de moneda y separadores de miles. Soporta "1.234,56" y "1,234.56".
  s = s.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    // El último separador es el decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    // Solo coma → decimal AR
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toBool(v: unknown, defaultVal = false): boolean {
  if (v == null || v === "") return defaultVal;
  const s = norm(v);
  return ["true", "1", "si", "sí", "yes", "y", "activo", "active", "published", "visible"].includes(s);
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  const lowered: Record<string, unknown> = {};
  for (const k of Object.keys(row)) lowered[norm(k)] = row[k];
  for (const k of keys) {
    const v = lowered[norm(k)];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function splitImages(...vals: string[]): string[] {
  const out: string[] = [];
  for (const v of vals) {
    if (!v) continue;
    // Las plataformas separan imágenes por coma, pipe o salto de línea.
    for (const part of v.split(/[\n,|]+/)) {
      const url = part.trim();
      if (/^https?:\/\//i.test(url)) out.push(url);
    }
  }
  return Array.from(new Set(out));
}

/* ------------------------------------------------------------------ */
/* Detección de plataforma por firma de headers                        */
/* ------------------------------------------------------------------ */

export function detectPlatform(headers: string[]): PlatformId {
  const h = headers.map(norm);
  const has = (...names: string[]) => names.every((n) => h.includes(norm(n)));
  const some = (...names: string[]) => names.some((n) => h.includes(norm(n)));

  // Shopify: "Handle", "Title", "Variant Price", "Body (HTML)"
  if (has("handle", "title") && some("variant price", "body (html)")) {
    return "shopify";
  }
  // WooCommerce: "Tipo", "SKU", "Nombre", "Precio normal" o "regular price"
  if (some("regular price", "precio normal") && some("nombre", "name") && some("sku")) {
    return "woocommerce";
  }
  // Tienda Nube: "Nombre", "Precio", "Precio promocional", "URL", "Identificador de URL"
  if (some("identificador de url", "precio promocional") && some("nombre")) {
    return "tiendanube";
  }
  // Empretienda: "Nombre del producto", "Precio", "Stock", "Categoría"
  if (some("nombre del producto") || (some("nombre") && some("categoria", "categoría") && some("imagenes", "imágenes", "imagen"))) {
    return "empretienda";
  }
  return "generic";
}

/* ------------------------------------------------------------------ */
/* Mapeo por plataforma                                                */
/* ------------------------------------------------------------------ */

function mapTiendaNube(row: Record<string, unknown>): NormalizedRow {
  const price = toNumber(pick(row, ["Precio", "Precio promocional", "precio"]));
  const promo = toNumber(pick(row, ["Precio promocional"]));
  const realPrice = promo > 0 && promo < price ? promo : price;
  const original = promo > 0 && promo < price ? price : null;
  return {
    externalId: pick(row, ["Identificador de URL", "SKU"]) || null,
    title: pick(row, ["Nombre", "Nombre del producto"]),
    description: pick(row, ["Descripción", "Descripcion"]),
    price: realPrice,
    originalPrice: original,
    stock: Math.round(toNumber(pick(row, ["Stock", "Cantidad"]))),
    sku: pick(row, ["SKU"]) || null,
    condition: "new",
    freeShipping: toBool(pick(row, ["Envío sin cargo", "Envio gratis"])),
    isActive: toBool(pick(row, ["Mostrar", "Publicado", "Visible"]), true),
    category: pick(row, ["Categorías", "Categorias", "Categoría"]) || null,
    images: splitImages(pick(row, ["Imágenes", "Imagenes", "Foto"])),
  };
}

function mapShopify(row: Record<string, unknown>): NormalizedRow {
  const price = toNumber(pick(row, ["Variant Price"]));
  const compare = toNumber(pick(row, ["Variant Compare At Price"]));
  return {
    externalId: pick(row, ["Handle"]) || null,
    title: pick(row, ["Title"]),
    description: pick(row, ["Body (HTML)", "Body"]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    price,
    originalPrice: compare > 0 && compare > price ? compare : null,
    stock: Math.round(toNumber(pick(row, ["Variant Inventory Qty"]))),
    sku: pick(row, ["Variant SKU"]) || null,
    condition: "new",
    freeShipping: norm(pick(row, ["Variant Requires Shipping"])) === "false",
    isActive: norm(pick(row, ["Status", "Published"])) !== "draft" && norm(pick(row, ["Published"])) !== "false",
    category: pick(row, ["Product Category", "Type", "Tags"]) || null,
    images: splitImages(pick(row, ["Image Src", "Variant Image"])),
  };
}

function mapWoo(row: Record<string, unknown>): NormalizedRow {
  const regular = toNumber(pick(row, ["Precio normal", "Regular price"]));
  const sale = toNumber(pick(row, ["Precio rebajado", "Sale price"]));
  const realPrice = sale > 0 && sale < regular ? sale : regular;
  return {
    externalId: pick(row, ["ID", "SKU"]) || null,
    title: pick(row, ["Nombre", "Name"]),
    description: pick(row, ["Descripción", "Description", "Descripción corta", "Short description"])
      .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    price: realPrice,
    originalPrice: sale > 0 && sale < regular ? regular : null,
    stock: Math.round(toNumber(pick(row, ["Inventario", "Stock"]))),
    sku: pick(row, ["SKU"]) || null,
    condition: "new",
    freeShipping: false,
    isActive: toBool(pick(row, ["Publicado", "Published"]), true),
    category: pick(row, ["Categorías", "Categories"]) || null,
    images: splitImages(pick(row, ["Imágenes", "Images"])),
  };
}

function mapEmpretienda(row: Record<string, unknown>): NormalizedRow {
  const price = toNumber(pick(row, ["Precio", "Precio de venta"]));
  const promo = toNumber(pick(row, ["Precio promocional", "Precio oferta"]));
  const realPrice = promo > 0 && promo < price ? promo : price;
  return {
    externalId: pick(row, ["Código", "Codigo", "SKU"]) || null,
    title: pick(row, ["Nombre del producto", "Nombre"]),
    description: pick(row, ["Descripción", "Descripcion"]),
    price: realPrice,
    originalPrice: promo > 0 && promo < price ? price : null,
    stock: Math.round(toNumber(pick(row, ["Stock", "Cantidad"]))),
    sku: pick(row, ["Código", "Codigo", "SKU"]) || null,
    condition: "new",
    freeShipping: toBool(pick(row, ["Envío gratis", "Envio gratis"])),
    isActive: toBool(pick(row, ["Activo", "Publicado", "Visible"]), true),
    category: pick(row, ["Categoría", "Categoria"]) || null,
    images: splitImages(pick(row, ["Imágenes", "Imagenes", "Imagen"])),
  };
}

function mapGeneric(row: Record<string, unknown>): NormalizedRow {
  const price = toNumber(pick(row, ["precio", "price", "valor"]));
  const original = toNumber(pick(row, ["precio_anterior", "precio anterior", "original price", "compare price", "precio tachado"]));
  return {
    externalId: pick(row, ["id", "sku", "codigo", "código"]) || null,
    title: pick(row, ["titulo", "título", "title", "nombre", "name", "producto"]),
    description: pick(row, ["descripcion", "descripción", "description", "detalle"]),
    price,
    originalPrice: original > 0 && original > price ? original : null,
    stock: Math.round(toNumber(pick(row, ["stock", "cantidad", "qty"]))),
    sku: pick(row, ["sku", "codigo", "código"]) || null,
    condition: norm(pick(row, ["condicion", "condición", "condition"])) === "usado" ? "used" : "new",
    freeShipping: toBool(pick(row, ["envio_gratis", "envío gratis", "free shipping", "envio gratis"])),
    isActive: toBool(pick(row, ["activo", "active", "publicado"]), true),
    category: pick(row, ["categoria", "categoría", "category", "rubro"]) || null,
    images: splitImages(
      pick(row, ["imagen", "imagenes", "imágenes", "image", "images", "foto", "fotos", "image src"]),
      pick(row, ["imagen2", "imagen 2", "image2"]),
      pick(row, ["imagen3", "imagen 3", "image3"]),
    ),
  };
}

const MAPPERS: Record<PlatformId, (r: Record<string, unknown>) => NormalizedRow> = {
  tiendanube: mapTiendaNube,
  shopify: mapShopify,
  woocommerce: mapWoo,
  empretienda: mapEmpretienda,
  generic: mapGeneric,
};

/**
 * Convierte filas crudas (objetos header->valor) en filas normalizadas.
 * Para Shopify agrupa variantes/imágenes por `Handle` (Shopify pone 1 fila
 * por imagen extra, con el resto de columnas vacías).
 */
export function normalizeRows(
  platform: PlatformId,
  rawRows: Record<string, unknown>[],
): NormalizedRow[] {
  const mapper = MAPPERS[platform];

  if (platform === "shopify") {
    const byHandle = new Map<string, NormalizedRow>();
    for (const raw of rawRows) {
      const mapped = mapper(raw);
      const handle = mapped.externalId || mapped.title;
      if (!handle) continue;
      const existing = byHandle.get(handle);
      if (existing) {
        // Fila de imagen extra: solo agregamos imágenes
        existing.images.push(...mapped.images);
      } else if (mapped.title) {
        byHandle.set(handle, mapped);
      }
    }
    return Array.from(byHandle.values()).map((r) => ({
      ...r,
      images: Array.from(new Set(r.images)),
    }));
  }

  return rawRows
    .map(mapper)
    .filter((r) => r.title && r.title.trim().length > 0);
}
