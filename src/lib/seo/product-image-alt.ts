/** Alt text SEO para imágenes de producto (E-E-A-T + Google Imágenes). */
export function buildProductImageAlt(params: {
  title: string;
  index?: number;
  category?: string | null;
  sellerName?: string | null;
}): string {
  const title = params.title.trim().slice(0, 120);
  const cat = params.category?.trim();
  const seller = params.sellerName?.trim();

  if (params.index !== undefined && params.index > 0) {
    const parts = [`${title} — foto ${params.index + 1}`, "MadsJeez Marketplace"];
    if (cat) parts.push(cat);
    return parts.join(" · ");
  }

  const parts = [`Comprar ${title} online`, "marketplace Argentina MadsJeez"];
  if (cat) parts.push(cat);
  if (seller) parts.push(`vendido por ${seller}`);
  return parts.join(" — ");
}
