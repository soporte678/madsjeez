import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSharedHomeCarouselPool } from "@/lib/home-carousel-pool-client";

export type CatalogCarouselProduct = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  freeShipping?: boolean;
  sales?: number;
  image?: string | null;
  category?: string;
  categorySlug?: string;
  sellerName?: string;
  reputation?: string;
};

const CAROUSEL_SIZE = 12;
const ROTATION_INTERVAL_MS = 18_000;
const POOL_REFETCH_MS = 5 * 60_000;
const CATEGORY_POOL_CAP = 200;

function sliceRotated<T>(arr: T[], start: number, size: number): T[] {
  if (arr.length === 0) return [];
  const s = start % arr.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(size, arr.length); i++) {
    out.push(arr[(s + i) % arr.length]);
  }
  return out;
}

type UseRotatingProductsOptions = {
  offset?: number;
  categorySlug?: string | null;
  visibleCount?: number;
  provinceSlug?: string | null;
  localitySlug?: string | null;
};

export function useRotatingProducts(options: UseRotatingProductsOptions = {}) {
  const offset = options.offset ?? 0;
  const categorySlug = options.categorySlug?.trim() || null;
  const provinceSlug = options.provinceSlug?.trim() || null;
  const localitySlug = options.localitySlug?.trim() || null;
  const visibleCount = options.visibleCount ?? CAROUSEL_SIZE;

  const [pool, setPool] = useState<CatalogCarouselProduct[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<CatalogCarouselProduct[]>([]);
  const [rotationStep, setRotationStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isReady, setIsReady] = useState(true);
  const poolRef = useRef<CatalogCarouselProduct[]>([]);
  const rotationStepRef = useRef(0);

  const applyVisible = useCallback(
    (source: CatalogCarouselProduct[], step: number) => {
      if (source.length === 0) {
        setVisibleProducts([]);
        return;
      }
      const start = (offset + step * visibleCount) % source.length;
      setVisibleProducts(sliceRotated(source, start, visibleCount));
    },
    [offset, visibleCount]
  );

  const loadPool = useCallback(async () => {
    try {
      setLoading(true);

      // Si no hay ningún filtro (categoria ni geo), usamos el pool compartido cacheado
      if (!categorySlug && !provinceSlug && !localitySlug) {
        const { products, total } = await fetchSharedHomeCarouselPool();
        poolRef.current = products;
        setPool(products);
        setTotalCount(total);
        applyVisible(products, rotationStepRef.current);
        return;
      }

      const params = new URLSearchParams({
        mode: "pool",
        poolCap: String(CATEGORY_POOL_CAP),
      });
      if (categorySlug) params.set("categorySlug", categorySlug);
      if (provinceSlug) params.set("province", provinceSlug);
      if (localitySlug) params.set("locality", localitySlug);

      const res = await fetch(`/api/products/carousel?${params.toString()}`);
      const data = await res.json();
      const list = (data.products || []) as CatalogCarouselProduct[];
      poolRef.current = list;
      setPool(list);
      setTotalCount(data.total || list.length);
      applyVisible(list, 0);
      rotationStepRef.current = 0;
      setRotationStep(0);
    } catch {
      poolRef.current = [];
      setPool([]);
      setVisibleProducts([]);
    } finally {
      setLoading(false);
    }
  }, [applyVisible, categorySlug, provinceSlug, localitySlug]);

  useEffect(() => {
    void loadPool();
  }, [categorySlug, provinceSlug, localitySlug, offset]);

  useEffect(() => {
    const id = setInterval(() => void loadPool(), POOL_REFETCH_MS);
    return () => clearInterval(id);
  }, [loadPool]);

  useEffect(() => {
    const source = poolRef.current;
    if (source.length <= visibleCount) return;

    const interval = setInterval(() => {
      const next = rotationStepRef.current + 1;
      rotationStepRef.current = next;
      setRotationStep(next);
      applyVisible(source, next);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pool.length, applyVisible, visibleCount]);

  return {
    products: visibleProducts,
    allProducts: pool,
    loading,
    totalCount,
    rotationStep,
    setReady: setIsReady,
  };
}
