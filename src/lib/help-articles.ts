export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  sections: Array<{ heading: string; body: string }>;
  relatedSlugs?: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "como-comprar",
    title: "Cómo hacer una compra en MadsJeez",
    description:
      "Pasos para buscar productos, pagar con Mercado Pago y recibir tu pedido en el marketplace MadsJeez Argentina.",
    category: "Compras",
    sections: [
      {
        heading: "1. Buscar y elegir",
        body: "Usá el buscador o las categorías para encontrar el producto. Revisá fotos, descripción, envío y reputación del vendedor antes de comprar.",
      },
      {
        heading: "2. Agregar al carrito y pagar",
        body: "Elegí cantidad y variante si aplica. En el checkout confirmá dirección y medio de pago (Mercado Pago u otros habilitados).",
      },
      {
        heading: "3. Seguimiento",
        body: "En Mis compras ves el estado del pedido y, cuando el vendedor despacha, el seguimiento del envío.",
      },
    ],
    relatedSlugs: ["metodos-pago", "costos-envio", "cancelar"],
  },
  {
    slug: "seguimiento",
    title: "Seguimiento de envíos",
    description: "Cómo ver el estado de tu pedido y el tracking del envío en MadsJeez.",
    category: "Compras",
    sections: [
      {
        heading: "Dónde ver el estado",
        body: "Ingresá a Mis compras con tu cuenta. Cada pedido muestra estado (pendiente, enviado, entregado) y datos de seguimiento cuando el vendedor los carga.",
      },
      {
        heading: "Demoras",
        body: "Los plazos dependen del método de envío y la zona. Si pasó el plazo estimado, contactá al vendedor desde el pedido o abrí un reclamo en Ayuda.",
      },
    ],
    relatedSlugs: ["como-comprar", "problemas-envio"],
  },
  {
    slug: "cancelar",
    title: "Cancelar una compra",
    description: "Cuándo podés cancelar un pedido y cómo solicitar la devolución del pago.",
    category: "Compras",
    sections: [
      {
        heading: "Antes del envío",
        body: "Si el vendedor aún no despachó, podés solicitar cancelación desde Mis compras. El reembolso se gestiona según el medio de pago.",
      },
      {
        heading: "Después del envío",
        body: "Si ya salió el paquete, aplicá la política de devoluciones y reembolsos. Podés iniciar un reclamo si el producto no es lo acordado.",
      },
    ],
    relatedSlugs: ["como-comprar", "garantia"],
  },
  {
    slug: "como-vender",
    title: "Cómo vender en MadsJeez",
    description: "Registrate como vendedor, publicá productos y cobrá con Mercado Pago en el marketplace.",
    category: "Ventas",
    sections: [
      {
        heading: "Alta de vendedor",
        body: "Creá tu cuenta y completá el registro de vendedor en Vender. Conectá Mercado Pago para recibir cobros.",
      },
      {
        heading: "Publicaciones",
        body: "Desde el panel cargá título, fotos, precio, stock y categoría. Podés importar desde Mercado Libre si tenés la integración activa.",
      },
    ],
    relatedSlugs: ["publicar", "gestion-ventas"],
  },
  {
    slug: "publicar",
    title: "Publicar un producto",
    description: "Guía para crear una publicación con buenas fotos, precio y visibilidad en el marketplace.",
    category: "Ventas",
    sections: [
      {
        heading: "Ficha de producto",
        body: "Usá título claro (marca + modelo), al menos 5 fotos y descripción con medidas o compatibilidad. Definí envío gratis o costo según tu negocio.",
      },
      {
        heading: "Visibilidad",
        body: "Las publicaciones activas aparecen en búsqueda y categorías. Revisá el panel de métricas para ver visitas y conversiones.",
      },
    ],
    relatedSlugs: ["como-vender", "gestion-ventas"],
  },
  {
    slug: "gestion-ventas",
    title: "Gestionar mis ventas",
    description: "Panel de pedidos, envíos y mensajes de compradores para vendedores MadsJeez.",
    category: "Ventas",
    sections: [
      {
        heading: "Pedidos",
        body: "En el dashboard ves ventas nuevas, prepará el envío y actualizá el tracking para que el comprador pueda seguir el paquete.",
      },
      {
        heading: "Postventa",
        body: "Respondé preguntas y gestioná reclamos desde el mismo panel. Mantener buena reputación mejora la conversión.",
      },
    ],
    relatedSlugs: ["como-vender", "opciones-envio"],
  },
  {
    slug: "opciones-envio",
    title: "Opciones de envío",
    description: "Métodos de envío disponibles para vendedores y compradores en Argentina.",
    category: "Envíos",
    sections: [
      {
        heading: "Envío a cargo del vendedor",
        body: "Cada publicación puede ofrecer envío gratis, costo fijo o cotización con operadores integrados (ej. Zipnova) según configuración.",
      },
      {
        heading: "Retiro",
        body: "Si tu negocio lo permite, podés acordar retiro en local con el comprador fuera de la plataforma, siempre respetando las políticas de MadsJeez.",
      },
    ],
    relatedSlugs: ["costos-envio", "problemas-envio"],
  },
  {
    slug: "costos-envio",
    title: "Costos y plazos de envío",
    description: "Cómo se calculan los costos de envío y los tiempos de entrega en el checkout.",
    category: "Envíos",
    sections: [
      {
        heading: "En el checkout",
        body: "El costo de envío se muestra antes de pagar según CP, peso y operador. Las promociones de envío gratis aplican solo si el vendedor las activó.",
      },
      {
        heading: "Plazos",
        body: "Son estimados en días hábiles. Feriados y zonas alejadas pueden extender la entrega.",
      },
    ],
    relatedSlugs: ["opciones-envio", "seguimiento"],
  },
  {
    slug: "problemas-envio",
    title: "Problemas con envíos",
    description: "Qué hacer si el paquete no llega, llega tarde o dañado.",
    category: "Envíos",
    sections: [
      {
        heading: "Paquete demorado",
        body: "Revisá el tracking en Mis compras. Si no hay movimientos, contactá al vendedor. Pasadas 48 h sin respuesta, abrí un reclamo.",
      },
      {
        heading: "Daño o extravío",
        body: "Documentá con fotos al recibir. Iniciá reclamo dentro del plazo indicado en la política de reembolsos.",
      },
    ],
    relatedSlugs: ["seguimiento", "garantia"],
  },
  {
    slug: "garantia",
    title: "Garantía de productos",
    description: "Garantía legal y comercial en compras del marketplace MadsJeez.",
    category: "Devoluciones",
    sections: [
      {
        heading: "Defensa del consumidor",
        body: "Las compras en Argentina están sujetas a la Ley 24.240. Productos defectuosos o no conformes pueden devolverse según plazos legales.",
      },
      {
        heading: "Garantía del vendedor",
        body: "Algunos rubros incluyen garantía de fábrica. Revisá la ficha y conservá factura o comprobante de MadsJeez.",
      },
    ],
    relatedSlugs: ["cancelar", "problemas-envio"],
  },
  {
    slug: "metodos-pago",
    title: "Métodos de pago",
    description: "Medios de pago aceptados en MadsJeez, incluido Mercado Pago y cuotas.",
    category: "Pagos",
    sections: [
      {
        heading: "Mercado Pago",
        body: "La mayoría de compras se procesan con Mercado Pago: tarjetas, dinero en cuenta y cuotas según disponibilidad.",
      },
      {
        heading: "Seguridad",
        body: "No compartas datos de tarjeta por mensaje. Pagá siempre desde el checkout de MadsJeez.",
      },
    ],
    relatedSlugs: ["seguridad-pagos", "facturacion"],
  },
  {
    slug: "facturacion",
    title: "Facturación",
    description: "Comprobantes y facturas en tus compras y ventas.",
    category: "Pagos",
    sections: [
      {
        heading: "Compradores",
        body: "Descargá el comprobante de pago desde Mis compras. La factura A/B la emite el vendedor si corresponde.",
      },
      {
        heading: "Vendedores",
        body: "Configurá datos fiscales en el panel para emitir facturas según tu responsabilidad ante AFIP.",
      },
    ],
    relatedSlugs: ["metodos-pago"],
  },
  {
    slug: "seguridad-pagos",
    title: "Seguridad de pagos",
    description: "Cómo protegemos tus pagos y cómo evitar fraudes en el marketplace.",
    category: "Pagos",
    sections: [
      {
        heading: "Buenas prácticas",
        body: "No pagues fuera de la plataforma. Desconfiá de precios irreales y vendedores sin historial.",
      },
      {
        heading: "Protección",
        body: "Los pagos vía checkout quedan registrados para mediación en caso de disputa.",
      },
    ],
    relatedSlugs: ["metodos-pago", "crear-cuenta"],
  },
  {
    slug: "crear-cuenta",
    title: "Crear una cuenta",
    description: "Registro de compradores y vendedores en MadsJeez Argentina.",
    category: "Cuenta",
    sections: [
      {
        heading: "Registro",
        body: "Usá Creá tu cuenta con email válido. Confirmá el correo si el sistema lo solicita.",
      },
      {
        heading: "Perfil",
        body: "Completá nombre y teléfono para facilitar envíos y soporte.",
      },
    ],
    relatedSlugs: ["verificar", "cambiar-password"],
  },
  {
    slug: "verificar",
    title: "Verificar mi cuenta",
    description: "Verificación de identidad para vendedores y funciones avanzadas.",
    category: "Cuenta",
    sections: [
      {
        heading: "Vendedores",
        body: "Para vender a escala puede requerirse validación KYC según rubro y volumen. Seguí las indicaciones del panel.",
      },
      {
        heading: "Compradores",
        body: "La verificación de email es el mínimo. Datos adicionales mejoran la recuperación de cuenta.",
      },
    ],
    relatedSlugs: ["crear-cuenta", "como-vender"],
  },
  {
    slug: "cambiar-password",
    title: "Cambiar contraseña",
    description: "Recuperar o actualizar la contraseña de tu cuenta MadsJeez.",
    category: "Cuenta",
    sections: [
      {
        heading: "Desde la sesión",
        body: "En configuración de cuenta elegí Cambiar contraseña e ingresá la actual y la nueva.",
      },
      {
        heading: "Olvidé mi clave",
        body: "En Ingresá usá Olvidé mi contraseña y seguí el enlace enviado a tu email.",
      },
    ],
    relatedSlugs: ["crear-cuenta", "seguridad-pagos"],
  },
];

export const HELP_BY_SLUG = Object.fromEntries(
  HELP_ARTICLES.map((article) => [article.slug, article])
) as Record<string, HelpArticle>;

export const HELP_SLUGS = HELP_ARTICLES.map((a) => a.slug);
