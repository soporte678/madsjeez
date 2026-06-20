import { GUIAS_COMPRA, type GuiaCompra } from "./guias-compra";
import { GUIAS_MAQUINARIA_B } from "./guias-maquinaria-b";
import { GUIAS_V1 } from "./guias-v1";
import { GUIAS_V2 } from "./guias-v2";
import { GUIAS_V3 } from "./guias-v3";
import { GUIAS_C1 } from "./guias-c1";

export type { GuiaCompra };

export const ALL_GUIAS: GuiaCompra[] = [
  ...GUIAS_COMPRA,
  ...GUIAS_MAQUINARIA_B,
  ...GUIAS_V1,
  ...GUIAS_V2,
  ...GUIAS_V3,
  ...GUIAS_C1,
];

export function getAllGuias() {
  return ALL_GUIAS;
}

export function getGuiaBySlug(slug: string): GuiaCompra | undefined {
  return ALL_GUIAS.find((g) => g.slug === slug);
}
