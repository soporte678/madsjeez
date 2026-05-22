import { meliSearchUserItems } from "./api";
import type { MeliListingKind } from "./listing-kind";

/** ML devuelve hasta 100 IDs por página en items/search con scan. */
export const MELI_ITEMS_SEARCH_LIMIT = 100;

/** ~30.000 publicaciones (300 × 100). Evita loops infinitos. */
export const MELI_SCROLL_MAX_PAGES_SAFETY = 300;

export type MeliCollectItemsResult = {
  ids: string[];
  pages: number;
  pagingTotal: number | null;
  warnings: string[];
};

/**
 * maxPages: número de páginas scan, o 0 / "all" para recorrer hasta agotar scroll (con tope de seguridad).
 */
export function resolveMeliScrollMaxPages(raw: unknown, opts?: { importAll?: boolean }): number {
  if (opts?.importAll) return MELI_SCROLL_MAX_PAGES_SAFETY;
  if (raw === "all" || raw === "ALL") return MELI_SCROLL_MAX_PAGES_SAFETY;
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (n === 0 || n === -1) return MELI_SCROLL_MAX_PAGES_SAFETY;
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(n, MELI_SCROLL_MAX_PAGES_SAFETY);
}

/** Recorre /users/{id}/items/search hasta agotar scroll_id o alcanzar maxPages. */
export async function collectMeliItemIds(
  accessToken: string,
  meliUserId: string,
  listingKind: MeliListingKind,
  maxPages: number
): Promise<MeliCollectItemsResult> {
  const warnings: string[] = [];
  const seen = new Set<string>();
  let scrollId: string | undefined;
  let pages = 0;
  let pagingTotal: number | null = null;

  while (pages < maxPages) {
    const search = await meliSearchUserItems(accessToken, meliUserId, scrollId, listingKind);
    if (!search.ok) {
      warnings.push(`items/search HTTP ${search.status}`);
      break;
    }

    const payload = search.data as {
      results?: string[];
      scroll_id?: string;
      paging?: { total?: number };
    };
    if (payload.paging?.total != null) pagingTotal = payload.paging.total;

    const batch = payload.results || [];
    scrollId = payload.scroll_id;
    pages++;

    for (const id of batch) {
      if (id) seen.add(id);
    }

    if (!scrollId) break;
    if (!batch.length) {
      warnings.push("items/search devolvió página vacía; se detuvo el escaneo.");
      break;
    }
  }

  if (pages >= maxPages && scrollId) {
    warnings.push(
      `Se alcanzó el límite de ${maxPages} páginas (${seen.size} publicaciones). Podés haber más en ML.`
    );
  }

  return { ids: [...seen], pages, pagingTotal, warnings };
}

export type MeliScanPageResult = {
  ids: string[];
  nextScrollId: string | null;
  done: boolean;
  pagingTotal: number | null;
  status: number;
};

/** Una página del scan ML (para progreso en vivo en UI). */
export async function fetchMeliItemIdsPage(
  accessToken: string,
  meliUserId: string,
  listingKind: MeliListingKind,
  scrollId?: string
): Promise<MeliScanPageResult> {
  const search = await meliSearchUserItems(accessToken, meliUserId, scrollId, listingKind);
  if (!search.ok) {
    return {
      ids: [],
      nextScrollId: null,
      done: true,
      pagingTotal: null,
      status: search.status,
    };
  }

  const payload = search.data as {
    results?: string[];
    scroll_id?: string;
    paging?: { total?: number };
  };
  const ids = (payload.results || []).filter(Boolean);
  const nextScrollId = payload.scroll_id || null;
  // Termina solo cuando ML no devuelve scroll_id (no por página vacía intermedia).
  const done = !nextScrollId;

  return {
    ids,
    nextScrollId: done ? null : nextScrollId,
    done,
    pagingTotal: payload.paging?.total ?? null,
    status: search.status,
  };
}

/** Ejecuta fn con concurrencia acotada (rate-limit friendly). */
export async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items.length) return [];
  const size = Math.min(Math.max(concurrency, 1), 16);
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => worker()));
  return results;
}
