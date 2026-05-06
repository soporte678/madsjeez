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
  scrollId?: string
) {
  const qs = new URLSearchParams({ limit: "100" });
  if (scrollId) {
    qs.set("search_type", "scan");
    qs.set("scroll_id", scrollId);
  }
  return meliApi<MeliItemsSearchResponse>(
    accessToken,
    `/users/${meliUserId}/items/search?${qs.toString()}`
  );
}

export type MeliItemPicture = { secure_url?: string; url?: string };
export type MeliItemShipping = { free_shipping?: boolean };

export type MeliItemDetail = {
  id: string;
  title: string;
  price: number;
  currency_id?: string;
  available_quantity?: number;
  sold_quantity?: number;
  condition?: string;
  permalink?: string;
  pictures?: MeliItemPicture[];
  shipping?: MeliItemShipping;
  category_id?: string;
  attributes?: Array<{ id?: string; name?: string; value_name?: string | null }>;
};

export async function meliGetItem(accessToken: string, itemId: string) {
  return meliApi<MeliItemDetail>(accessToken, `/items/${itemId}`);
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
