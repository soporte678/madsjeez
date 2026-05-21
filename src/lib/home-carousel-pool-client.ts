import type { CatalogCarouselProduct } from "@/hooks/useRotatingProducts";

type HomePoolCache = {
  products: CatalogCarouselProduct[];
  total: number;
};

let cached: HomePoolCache | null = null;
let inflight: Promise<HomePoolCache> | null = null;

/** Un solo fetch del pool de home compartido por todos los carruseles sin categoría. */
export function fetchSharedHomeCarouselPool(): Promise<HomePoolCache> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch("/api/products/carousel?mode=home&poolCap=400")
    .then((res) => res.json())
    .then((data) => {
      const products = (data.products || []) as CatalogCarouselProduct[];
      cached = { products, total: data.total || products.length };
      return cached;
    })
    .catch(() => {
      cached = { products: [], total: 0 };
      return cached;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateHomeCarouselPoolCache() {
  cached = null;
}
