/** Non-empty trimmed HTTP(S) or stored URL string */
export function hasValidProductImageUrl(url: unknown): boolean {
  return typeof url === "string" && url.trim().length > 0
}

/** Pick first usable image from Supabase/Prisma nested rows (primary → order). */
export function primaryImageUrlFromRows(
  rows: Array<{ url?: unknown; is_primary?: boolean; order?: number }> | null | undefined
): string | null {
  if (!Array.isArray(rows) || rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return (a.order ?? 0) - (b.order ?? 0)
  })
  for (const row of sorted) {
    if (hasValidProductImageUrl(row.url)) return String(row.url).trim()
  }
  return null
}

export function firstProductImageUrl(product: {
  product_images?: Array<{ url?: unknown; is_primary?: boolean; order?: number }> | null
  images?: Array<{ url?: unknown; is_primary?: boolean; order?: number }> | null
}): string | null {
  return primaryImageUrlFromRows(product.product_images ?? product.images ?? undefined)
}
