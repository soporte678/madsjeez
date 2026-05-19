import { useState, useEffect, useCallback, useRef } from "react";

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
const POOL_REFETCH_MS = 4 * 60_000;
const PAGE_SIZE = 300;

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function timeSeed(): number {
  const t = new Date();
  return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate() * 10 + t.getHours();
}

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
};

export function useRotatingProducts(options: UseRotatingProductsOptions = {}) {
  const offset = options.offset ?? 0;
  const categorySlug = options.categorySlug ?? null;
  const visibleCount = options.visibleCount ?? CAROUSEL_SIZE;

  const [pool, setPool] = useState<CatalogCarouselProduct[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<CatalogCarouselProduct[]>([]);
  const [rotationStep, setRotationStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const poolRef = useRef<CatalogCarouselProduct[]>([]);

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

  const loadFullPool = useCallback(async () => {
    try {
      setLoading(true);

      if (categorySlug) {
        const res = await fetch(
          `/api/products/carousel?mode=pool&poolCap=1200&categorySlug=${encodeURIComponent(categorySlug)}`
        );
        const data = await res.json();
        const list = (data.products || []) as CatalogCarouselProduct[];
        poolRef.current = list;
        setPool(list);
        setTotalCount(data.total || list.length);
        applyVisible(list, 0);
        setRotationStep(0);
        return;
      }

      const all: CatalogCarouselProduct[] = [];
      let pageOffset = 0;
      let total = 0;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `/api/products/carousel?mode=page&pageSize=${PAGE_SIZE}&pageOffset=${pageOffset}`
        );
        const data = await res.json();
        const batch = (data.products || []) as CatalogCarouselProduct[];
        total = data.total || total;
        all.push(...batch);
        hasMore = Boolean(data.hasMore) && batch.length > 0;
        pageOffset += batch.length;
        if (batch.length === 0) break;
        if (all.length >= 5000) break;
      }

      const shuffled = shuffleWithSeed(all, timeSeed() + offset);
      poolRef.current = shuffled;
      setPool(shuffled);
      setTotalCount(total);
      applyVisible(shuffled, 0);
      setRotationStep(0);
    } catch (e) {
      console.error("Failed to load carousel pool:", e);
      poolRef.current = [];
      setPool([]);
      setVisibleProducts([]);
    } finally {
      setLoading(false);
    }
  }, [applyVisible, categorySlug, offset, visibleCount]);

  useEffect(() => {
    void loadFullPool();
  }, [loadFullPool]);

  useEffect(() => {
    const id = setInterval(() => void loadFullPool(), POOL_REFETCH_MS);
    return () => clearInterval(id);
  }, [loadFullPool]);

  useEffect(() => {
    const source = poolRef.current;
    if (source.length <= visibleCount) return;

    const interval = setInterval(() => {
      setRotationStep((prev) => {
        const next = prev + 1;
        applyVisible(source, next);
        return next;
      });
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pool.length, applyVisible, visibleCount]);

  return {
    products: visibleProducts,
    allProducts: pool,
    loading,
    totalCount,
    rotationStep,
  };
}
