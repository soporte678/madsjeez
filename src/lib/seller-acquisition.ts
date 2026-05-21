export type SellerSegment = {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  categories: string[];
  painPoints: string[];
  madsjeezEdge: string[];
  roadmap: string[];
};

export const sellerSegments: SellerSegment[] = [
  {
    slug: "ferreteria",
    name: "Ferreterias",
    headline: "Vendé herramientas, riego, electricidad y repuestos con una vidriera digital preparada para demanda local.",
    intro:
      "MadsJeez ayuda a ferreterias y casas de herramientas a transformar stock de mostrador en catalogo online, con publicaciones claras, pagos integrados y medicion de demanda.",
    categories: ["Herramientas", "Riego", "Electricidad", "Buloneria", "Repuestos chicos"],
    painPoints: ["Mucho stock difícil de publicar", "Clientes preguntan por WhatsApp sin cerrar compra", "Poca medicion de productos con demanda"],
    madsjeezEdge: ["Plantillas de publicacion por familia", "SEO por producto tecnico", "Dashboard de visitas, ventas y conversion"],
    roadmap: ["Importacion masiva desde planilla", "Score de ficha tecnica", "Sugerencias de kits y productos complementarios"],
  },
  {
    slug: "repuestos",
    name: "Repuestos y autopartes",
    headline: "Un canal para vender repuestos con busqueda clara, compatibilidad y confianza antes de la compra.",
    intro:
      "Para negocios con mucho SKU, MadsJeez puede convertirse en un canal adicional para ordenar catalogo, recibir demanda y medir que repuestos tienen mas oportunidad.",
    categories: ["Motos", "Autos", "Maquinaria", "Jardin", "Herramientas a combustion"],
    painPoints: ["Catalogo grande", "Compatibilidades difíciles", "Mucho contacto manual para confirmar producto"],
    madsjeezEdge: ["Ficha enriquecida", "Preguntas y postventa", "SEO para codigos, modelos y repuestos especificos"],
    roadmap: ["Motor de compatibilidad", "Buscador semantico", "Recomendaciones por modelo y familia"],
  },
  {
    slug: "indumentaria",
    name: "Indumentaria",
    headline: "Vendé moda, talles y colecciones con una experiencia pensada para convertir visitas en compradores.",
    intro:
      "MadsJeez busca darle a marcas y tiendas una forma simple de publicar colecciones, medir demanda y activar campañas por temporada.",
    categories: ["Ropa", "Calzado", "Accesorios", "Deportes", "Moda urbana"],
    painPoints: ["Talles y variantes", "Fotos inconsistentes", "Promociones de temporada sin medicion"],
    madsjeezEdge: ["Variantes y fotos por producto", "Campañas por coleccion", "Contenido SEO por rubro y temporada"],
    roadmap: ["Guias de talles", "Bundles y looks", "Recomendaciones personalizadas"],
  },
  {
    slug: "tecnologia",
    name: "Tecnologia",
    headline: "Un marketplace para vender accesorios, gadgets y electronica con fichas claras y confianza operativa.",
    intro:
      "La categoria tecnologia necesita descripcion precisa, stock actualizado, confianza y buena comparacion. Ese es un frente clave del roadmap MadsJeez.",
    categories: ["Accesorios", "Gaming", "Audio", "Computacion", "Smart home"],
    painPoints: ["Competencia por precio", "Ficha incompleta reduce conversion", "Consultas repetidas por especificaciones"],
    madsjeezEdge: ["Contenido tecnico", "Comparacion de productos", "Metricas de visitas y conversion"],
    roadmap: ["Comparador IA", "Alertas de precio competitivo", "Contenido automatico de especificaciones"],
  },
];

export const sellerSegmentBySlug = Object.fromEntries(sellerSegments.map((segment) => [segment.slug, segment]));
