import path from "node:path";

/** Rutas relativas a `docs/api/` (sin `.md`). Incluir aquí cada página publicada. */
export const API_DOC_SLUGS = [
  "README",
  "introduccion",
  "listo-para-produccion",
  "errores",
  "indice-maestro",
  "recursos/autenticacion",
  "recursos/productos",
  "recursos/pedidos-checkout",
  "recursos/zipnova-envios",
  "recursos/dashboard",
  "recursos/postventa",
  "recursos/comunicacion",
  "recursos/marketing",
  "recursos/mercado-libre",
  "recursos/seller-mercadopago",
  "recursos/busqueda",
  "recursos/ia",
  "recursos/meta",
  "recursos/admin",
  "recursos/infra-webhooks",
  "recursos/plataforma",
  "recursos/test",
] as const;

export type ApiDocSlug = (typeof API_DOC_SLUGS)[number];

const ALLOWED = new Set<string>(API_DOC_SLUGS);

export function slugSegmentsToKey(segments: string[] | undefined): ApiDocSlug | null {
  if (!segments || segments.length === 0) return "README";
  const key = segments.join("/");
  if (!ALLOWED.has(key)) return null;
  return key as ApiDocSlug;
}

export function apiDocKeyToFsPath(key: ApiDocSlug): string {
  const base = path.join(process.cwd(), "docs", "api");
  if (key === "README") return path.join(base, "README.md");
  return path.join(base, `${key}.md`);
}

export function apiDocKeyToHref(key: ApiDocSlug): string {
  if (key === "README") return "/docs/api";
  return `/docs/api/${key}`;
}

/** Títulos para `<title>` y breadcrumb. */
export const API_DOC_PAGE_TITLE: Record<ApiDocSlug, string> = {
  README: "Inicio — Referencia API",
  introduccion: "Introducción y convenciones",
  "listo-para-produccion": "Listo para producción (requisitos doc)",
  errores: "Errores y códigos HTTP",
  "indice-maestro": "Índice maestro de rutas",
  "recursos/autenticacion": "Autenticación y usuario",
  "recursos/productos": "Productos y catálogo",
  "recursos/pedidos-checkout": "Pedidos, carrito y checkout",
  "recursos/zipnova-envios": "Zipnova Envíos",
  "recursos/dashboard": "Dashboard",
  "recursos/postventa": "Postventa",
  "recursos/comunicacion": "Comunicación",
  "recursos/marketing": "Marketing",
  "recursos/mercado-libre": "Mercado Libre",
  "recursos/seller-mercadopago": "Vendedor — Mercado Pago",
  "recursos/busqueda": "Búsqueda",
  "recursos/ia": "IA",
  "recursos/meta": "Meta / WhatsApp",
  "recursos/admin": "Administración",
  "recursos/infra-webhooks": "Webhooks y salud",
  "recursos/plataforma": "Plataforma",
  "recursos/test": "Pruebas",
};

/** Navegación lateral agrupada (estilo guía de desarrolladores). */
export const API_DOCS_NAV: {
  label: string;
  items: { title: string; slug: ApiDocSlug }[];
}[] = [
  {
    label: "Primeros pasos",
    items: [
      { title: "Inicio", slug: "README" },
      { title: "Introducción", slug: "introduccion" },
      { title: "Listo para producción", slug: "listo-para-produccion" },
      { title: "Errores HTTP", slug: "errores" },
      { title: "Índice maestro", slug: "indice-maestro" },
    ],
  },
  {
    label: "Recursos del marketplace",
    items: [
      { title: "Autenticación", slug: "recursos/autenticacion" },
      { title: "Productos y catálogo", slug: "recursos/productos" },
      { title: "Pedidos y checkout", slug: "recursos/pedidos-checkout" },
      { title: "Zipnova Envíos", slug: "recursos/zipnova-envios" },
      { title: "Dashboard", slug: "recursos/dashboard" },
      { title: "Postventa", slug: "recursos/postventa" },
      { title: "Comunicación", slug: "recursos/comunicacion" },
      { title: "Marketing", slug: "recursos/marketing" },
      { title: "Mercado Libre", slug: "recursos/mercado-libre" },
      { title: "Vendedor — Mercado Pago", slug: "recursos/seller-mercadopago" },
      { title: "Búsqueda", slug: "recursos/busqueda" },
      { title: "IA", slug: "recursos/ia" },
      { title: "Meta / WhatsApp", slug: "recursos/meta" },
      { title: "Administración", slug: "recursos/admin" },
      { title: "Webhooks y salud", slug: "recursos/infra-webhooks" },
      { title: "Plataforma", slug: "recursos/plataforma" },
      { title: "Pruebas", slug: "recursos/test" },
    ],
  },
];
