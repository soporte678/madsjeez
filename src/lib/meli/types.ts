/** Tipos de respuesta Mercado Libre para importación / sync. */

export type MeliItemPicture = { id?: string; secure_url?: string; url?: string };

export type MeliItemAttribute = {
  id?: string;
  name?: string;
  value_id?: string | null;
  value_name?: string | null;
};

export type MeliItemVariation = {
  id: number | string;
  price?: number;
  available_quantity?: number;
  sold_quantity?: number;
  attribute_combinations?: Array<{ id?: string; name?: string; value_name?: string }>;
  picture_ids?: string[];
};

export type MeliItemShipping = {
  mode?: string;
  free_shipping?: boolean;
  local_pick_up?: boolean;
  logistic_type?: string;
};

export type MeliItemDetail = {
  id: string;
  title: string;
  price: number;
  base_price?: number;
  original_price?: number | null;
  currency_id?: string;
  status?: string;
  listing_type_id?: string;
  available_quantity?: number;
  sold_quantity?: number;
  condition?: string;
  permalink?: string;
  category_id?: string;
  pictures?: MeliItemPicture[];
  shipping?: MeliItemShipping;
  attributes?: MeliItemAttribute[];
  variations?: MeliItemVariation[];
  video_id?: string | null;
};

export type MeliCategoryNode = {
  id: string;
  name: string;
  path_from_root?: Array<{ id: string; name: string }>;
};
