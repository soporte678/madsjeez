import type { MeliItemDetail } from "./types";
import { meliListingKindSearchParam, type MeliListingKind } from "./listing-kind";

/** Mercado Libre API helpers (server-only). */

export async function meliApi<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = path.startsWith("http") ? path : `https://api.mercadolibre.com${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export type MeliUserMe = { id: number | string; nickname?: string };

export async function meliGetMe(accessToken: string) {
  return meliApi<MeliUserMe>(accessToken, "/users/me");
}

export type MeliItemsSearchResponse = {
  results?: string[];
  scroll_id?: string;
  paging?: { total?: number; offset?: number; limit?: number };
};

export async function meliSearchUserItems(
  accessToken: string,
  meliUserId: string,
  scrollId?: string,
  listingKind: MeliListingKind = "all"
) {
  const qs = new URLSearchParams({ limit: "100" });
  const catalogListing = meliListingKindSearchParam(listingKind);
  if (catalogListing != null) {
    qs.set("catalog_listing", catalogListing);
  }
  if (scrollId) {
    qs.set("search_type", "scan");
    qs.set("scroll_id", scrollId);
  }
  return meliApi<MeliItemsSearchResponse>(
    accessToken,
    `/users/${meliUserId}/items/search?${qs.toString()}`
  );
}

export type {
  MeliItemDetail,
  MeliItemPicture,
  MeliItemShipping,
  MeliItemAttribute,
  MeliItemVariation,
} from "./types";

export async function meliGetItem(accessToken: string, itemId: string) {
  return meliApi<MeliItemDetail>(accessToken, `/items/${itemId}`);
}

/** Actualiza campos permitidos de una publicación propia (precio, stock, etc.). */
export async function meliPutItem(
  accessToken: string,
  itemId: string,
  body: Record<string, unknown>
) {
  return meliApi<unknown>(accessToken, `/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type MeliDescriptionResponse = { plain_text?: string; text?: string };

export async function meliGetItemDescription(accessToken: string, itemId: string) {
  return meliApi<MeliDescriptionResponse>(accessToken, `/items/${itemId}/description`);
}

/** Promociones del vendedor (para enriquecer campañas locales). */
export async function meliGetSellerPromotions(accessToken: string, meliUserId: string) {
  const url = `/seller-promotions/users/${meliUserId}?app_version=v2`;
  return meliApi<{ results?: unknown[] } & Record<string, unknown>>(accessToken, url);
}
