/**
 * Catálogo de tutoriales del marketplace.
 * Cada tutorial tiene metadata + pasos. Las imágenes / videos quedan
 * como `mediaSlot` placeholders para reemplazar cuando se genere el
 * material con IA (Higgsfield) o se suban capturas reales.
 */

export type TutorialStep = {
  title: string;
  body: string;
  /** Hint para el placeholder visual: describe qué debería verse. */
  visualHint: string;
  /** Si en el futuro hay imagen/video real, va acá (path o URL). */
  media?: { type: 'image' | 'video'; src: string; alt?: string };
};

export type Tutorial = {
  slug: string;
  title: string;
  subtitle: string;
  audience: 'seller' | 'buyer' | 'ambos';
  duration: string;       // "5 min", "10 min"
  level: 'fácil' | 'medio' | 'avanzado';
  tags: string[];
  icon: 'rocket' | 'user-plus' | 'package' | 'credit-card' | 'message' | 'truck' | 'chart' | 'megaphone' | 'gift';
  /** Resumen visible en la card del index. */
  summary: string;
  /** Markdown corto que aparece al abrir el detalle, antes de los steps. */
  intro: string;
  steps: TutorialStep[];
  /** Recursos relacionados (otros tutoriales) por slug. */
  related?: string[];
  /** Texto del CTA final del tutorial. */
  ctaLabel: string;
  ctaHref: string;
};

export const TUTORIALES: Tutorial[] = [
  {
    slug: 'postularte-fundador',
    title: 'Postularte como Sellers Fundador',
    subtitle: 'Quedate en los primeros 100 con plan PRO gratis 6 meses',
    audience: 'seller',
    duration: '4 min',
    level: 'fácil',
    tags: ['fundadores', 'lanzamiento', 'plan gratis'],
    icon: 'gift',
    summary:
      'Cómo aplicar al programa fundador, qué pide el formulario y qué pasa después con tu cuenta.',
    intro:
      'El programa Sellers Fundadores cierra cuando se ocupan los 100 cupos. Postularte tarda menos de 5 minutos. Si pasás la verificación, te activamos el plan PRO sin costo los primeros 6 meses + badge fundador permanente. Madsjeez nunca cobra comisión sobre tus ventas.',
    steps: [
      {
        title: 'Entrá al formulario',
        body:
          'Desde la home, tocá "Postularte como Fundador" en la sección del programa. Si ya tenés cuenta, te lleva directo al formulario. Si no, primero te pedimos email y contraseña.',
        visualHint:
          'Captura de la sección Sellers Fundadores con el botón azul "Postularte como Fundador" resaltado.',
      },
      {
        title: 'Completá los datos del negocio',
        body:
          'Razón social, CUIT, rubro principal, link de tienda existente (Instagram, MercadoLibre o web propia) y volumen mensual aproximado. Todo se valida después; ahora alcanza con datos reales.',
        visualHint:
          'Formulario con campos: razón social, CUIT, rubro, link redes, volumen mensual.',
      },
      {
        title: 'Subí 1 comprobante de actividad',
        body:
          'Una captura de tus ventas del último mes en cualquier plataforma o un comprobante AFIP. Sirve para que el equipo te apruebe rápido sin pedirte info de más.',
        visualHint:
          'Drag&drop de comprobante con preview del archivo subido.',
      },
      {
        title: 'Esperá la aprobación (24-72 hs hábiles)',
        body:
          'Te avisamos por email + WhatsApp. Mientras tanto podés explorar el panel; cuando entrás, todo lo del plan fundador se activa automáticamente sin que toques nada.',
        visualHint:
          'Mock de la notif de WhatsApp diciendo "Tu solicitud quedó aprobada".',
      },
      {
        title: 'Compartí tu código de referral',
        body:
          'Apenas entrás, tenés un código personal en tu dashboard. Cada fundador que invitás y se aprueba te da 1 mes adicional gratis. Con 3, te quedás 1 año extra en el programa.',
        visualHint:
          'Panel del seller con sección "Tu código FUNDADOR-XXXX" y botón copiar.',
      },
    ],
    ctaLabel: 'Postularme ahora',
    ctaHref: '/seller/register?program=founding',
    related: ['crear-cuenta', 'publicar-producto', 'configurar-pagos'],
  },
  {
    slug: 'crear-cuenta',
    title: 'Crear tu cuenta y verificar identidad',
    subtitle: 'De 0 a vendedor en menos de 10 minutos',
    audience: 'seller',
    duration: '8 min',
    level: 'fácil',
    tags: ['onboarding', 'KYC'],
    icon: 'user-plus',
    summary:
      'Registro con Google o email, verificación de identidad rápida y activación del panel del vendedor.',
    intro:
      'Madsjeez tiene KYC liviano. Para vender alcanza con verificar mail + un documento. Para retirar dinero arriba de cierto monto pedimos selfie con el DNI, pero eso es después.',
    steps: [
      {
        title: 'Registrate con Google',
        body:
          'Es la forma más rápida. Si preferís email, tocá "Crear cuenta con email" y poné contraseña fuerte (≥ 12 caracteres, mezcla letras y números).',
        visualHint:
          'Pantalla de login con botón Google y opción email/password debajo.',
      },
      {
        title: 'Activá el modo vendedor',
        body:
          'Desde tu cuenta, andá a Configuración → Convertirme en vendedor. Te pedimos rubro, nombre comercial y zona de venta (CABA / GBA / Interior).',
        visualHint:
          'Modal con switch "Activar modo vendedor" + selector de rubro y zona.',
      },
      {
        title: 'Verificá tu identidad',
        body:
          'Subí frente y dorso del DNI. La validación es automática y suele tardar menos de 1 hora. Recibís email cuando queda OK.',
        visualHint:
          'Dos placeholders rectangulares con label "Frente DNI" y "Dorso DNI" + barra de progreso.',
      },
      {
        title: 'Sumá tus medios de cobro',
        body:
          'Vinculá Mercado Pago en un click. Los pagos de tus ventas caen directo ahí, no hacés nada. Después podés agregar más medios desde Configuración.',
        visualHint:
          'Toggle "Vincular Mercado Pago" con OAuth confirmation popup.',
      },
    ],
    ctaLabel: 'Crear mi cuenta',
    ctaHref: '/auth/register',
    related: ['publicar-producto', 'configurar-pagos'],
  },
  {
    slug: 'publicar-producto',
    title: 'Publicar tu primer producto',
    subtitle: 'Foto, precio, stock y listo: en menos de 5 minutos',
    audience: 'seller',
    duration: '6 min',
    level: 'fácil',
    tags: ['catálogo', 'fotos', 'SEO'],
    icon: 'package',
    summary:
      'Cómo subir un producto que se venda: las 4 cosas que importan y los errores típicos de los que recién arrancan.',
    intro:
      'Las publicaciones que se venden tienen siempre lo mismo: foto cuadrada con fondo limpio, título que arranca con el "qué" antes del "para qué", precio coherente y stock real. Acá te mostramos el flujo completo.',
    steps: [
      {
        title: 'Andá a Vender → Publicar producto',
        body:
          'Desde el panel del seller, abrí el wizard. Te guía por las 4 partes: foto, datos, precio y envío. Podés guardar borradores en cualquier paso.',
        visualHint:
          'Sidebar del dashboard con "Vender" expandido y "Publicar producto" highlighted.',
      },
      {
        title: 'Subí 3 fotos en formato cuadrado',
        body:
          'La primera es la que aparece en buscador. Fondo claro, producto centrado, sin watermarks. Madsjeez recorta y comprime automáticamente. Tamaño mínimo recomendado: 1200×1200 px.',
        visualHint:
          'Grid de 3 cuadrados con producto. Texto overlay "Foto principal", "Detalle", "Uso real".',
      },
      {
        title: 'Título: 60 caracteres con keyword al inicio',
        body:
          'Ej: "Taladro inalámbrico 18V Bosch 2 baterías + maletín". Empezá por la palabra que buscaría tu cliente (no la marca). Madsjeez sugiere mejoras con IA mientras escribís.',
        visualHint:
          'Input de título con sugerencia IA debajo: "Probá: \'Taladro inalámbrico 18V...\'"',
      },
      {
        title: 'Precio + cuotas + stock real',
        body:
          'Cargá precio base. Madsjeez calcula automáticamente las cuotas con Mercado Pago. Stock: poné lo que realmente tenés, no más. Sobrevender es la causa #1 de mala reputación.',
        visualHint:
          'Form con precio $ + preview "12 cuotas sin interés de $...". Stock numeric input.',
      },
      {
        title: 'Configurá envío',
        body:
          'Elegí: Envío gratis (lo paga el seller), Envío con costo (lo paga el comprador), o Retiro en local. Si activás Envío gratis y tu precio cubre el costo, tu publicación aparece más arriba en el listado.',
        visualHint:
          'Radio group con 3 opciones de envío + tooltip "Recomendado: envío gratis arriba de $30.000".',
      },
      {
        title: 'Publicar y revisar a las 24 hs',
        body:
          'Una vez activa, mirá Métricas → vistas y preguntas. Si tenés muchas vistas y pocas preguntas, ajustá título o foto. Si tenés preguntas y no ventas, revisá precio.',
        visualHint:
          'Dashboard de métricas: vistas (línea verde subiendo), preguntas (barras), conversión.',
      },
    ],
    ctaLabel: 'Publicar mi primer producto',
    ctaHref: '/seller/publish',
    related: ['gestionar-preguntas', 'usar-ads', 'ver-metricas'],
  },
  {
    slug: 'configurar-pagos',
    title: 'Configurar pagos con Mercado Pago',
    subtitle: 'Cobrar en tu cuenta MP sin fricción y con todas las cuotas',
    audience: 'seller',
    duration: '5 min',
    level: 'fácil',
    tags: ['pagos', 'mercado pago', 'cuotas'],
    icon: 'credit-card',
    summary:
      'Vinculá Mercado Pago una sola vez y dejá que cobramos los pagos de tus ventas y los acreditemos en tu CVU.',
    intro:
      'Madsjeez no toca tu plata: el pago va directo del comprador a tu cuenta de Mercado Pago. No tomamos comisión por venta — las cuotas y los costos de MP los configurás vos en tu cuenta. Cero retrasos por nuestra parte.',
    steps: [
      {
        title: 'Entrá a Configuración → Pagos',
        body:
          'En el panel del seller, andá al menú de cobros. Vas a ver "Vincular Mercado Pago" con un botón azul.',
        visualHint:
          'Settings page con sección Pagos y botón "Vincular Mercado Pago".',
      },
      {
        title: 'Autorizá Madsjeez en MP',
        body:
          'Te lleva al login oficial de Mercado Pago. Iniciás sesión y aceptás los permisos. Solo pedimos: leer pagos de tus ventas y emitir cobros en tu nombre. Nunca pedimos retirar tu plata.',
        visualHint:
          'Mock del modal OAuth de MP listando permisos solicitados.',
      },
      {
        title: 'Confirmá la conexión',
        body:
          'Volvés al panel con un cartel verde "Mercado Pago vinculado". Desde acá tus publicaciones automáticamente muestran cuotas y aceptan tarjetas, tarjetas de débito, efectivo en Rapipago / Pago Fácil y dinero en cuenta.',
        visualHint:
          'Banner verde "✓ Mercado Pago vinculado" + grid de medios de pago aceptados.',
      },
      {
        title: 'Configurá las cuotas',
        body:
          'Por default damos 18 cuotas sin interés (Mercado Pago lo subsidia con sus tasas). Podés bajarlo a 6 o 12 si querés precio más competitivo, o subir a 24 con interés.',
        visualHint:
          'Slider de cuotas + preview del precio final con/sin interés.',
      },
    ],
    ctaLabel: 'Vincular Mercado Pago',
    ctaHref: '/dashboard/payments',
    related: ['publicar-producto', 'ver-metricas'],
  },
  {
    slug: 'gestionar-preguntas',
    title: 'Responder preguntas rápido (y vender más)',
    subtitle: 'El 70 % de las compras se cierra cuando respondés en menos de 1 hora',
    audience: 'seller',
    duration: '4 min',
    level: 'fácil',
    tags: ['preguntas', 'conversión'],
    icon: 'message',
    summary:
      'Dónde ver las preguntas, cómo configurar respuestas automáticas con IA, y los template que más convierten.',
    intro:
      'La velocidad de respuesta es el factor que más mueve la aguja de conversión. Madsjeez te avisa por WhatsApp cuando entra una pregunta y te deja responder en 1 click desde el celular.',
    steps: [
      {
        title: 'Activá notificaciones por WhatsApp',
        body:
          'En Configuración → Notificaciones, activá WhatsApp para preguntas. Te llega un mensaje con el texto de la pregunta y un link para responder. No necesitás abrir la app.',
        visualHint:
          'Mock de chat de WhatsApp con notif "Lucía preguntó: ¿hacés envío a Mendoza?" + botón Responder.',
      },
      {
        title: 'Configurá respuestas frecuentes',
        body:
          'Desde Panel → Preguntas → Plantillas, guardá las 5-10 que más respondés. Cuando llega una similar, la IA te sugiere la respuesta y vos solo confirmás.',
        visualHint:
          'Lista de templates con campos: trigger, respuesta, cantidad de usos.',
      },
      {
        title: 'Responde directo desde la pregunta',
        body:
          'Cada pregunta tiene: el texto, el producto al que aplica, y un botón "Responder". Si tenés sugerencia IA, aparece pre-cargada — la podés editar antes de enviar.',
        visualHint:
          'Card con pregunta + textarea con sugerencia IA + botón "Enviar respuesta".',
      },
      {
        title: 'Cerrá la venta con un link',
        body:
          'Si la persona pregunta algo que es señal de compra ("¿tenés stock?", "¿llega hoy?"), respondé y mandale el link directo del producto. Eso reduce 30 % la fricción.',
        visualHint:
          'Respuesta tipo "Sí, hay 4 en stock. Link directo para comprar: madsjeez.com.ar/p/...".',
      },
    ],
    ctaLabel: 'Ver mis preguntas',
    ctaHref: '/dashboard/questions',
    related: ['publicar-producto', 'usar-ads'],
  },
  {
    slug: 'generar-etiquetas',
    title: 'Generar etiquetas de envío en lote',
    subtitle: 'Imprimí 20 etiquetas en PDF unificado, listo para despachar',
    audience: 'seller',
    duration: '5 min',
    level: 'medio',
    tags: ['envíos', 'logística', 'PDF'],
    icon: 'truck',
    summary:
      'Cómo seleccionar varias ventas pendientes y generar un PDF con todas las etiquetas listas para imprimir.',
    intro:
      'Si despachás muchos paquetes por semana, esta es la herramienta que más tiempo te ahorra. En vez de generar etiquetas una por una, marcás todas las ventas pendientes y bajás un único PDF.',
    steps: [
      {
        title: 'Filtrá tus ventas pendientes de envío',
        body:
          'Andá a Panel → Ventas y filtrá por estado "Para despachar". Vas a ver las que están pagas pero todavía no enviaste.',
        visualHint:
          'Lista de ventas con checkbox a la izquierda y filtro "Estado: Para despachar".',
      },
      {
        title: 'Seleccionar todo / selección manual',
        body:
          'Tocá el checkbox del header para marcar todas, o seleccioná manualmente las que tenés físicas para hoy. Arriba aparece "Seleccionadas: 12".',
        visualHint:
          'Header con "Seleccionar todo" + chip "12 seleccionadas" + botón "Generar etiquetas".',
      },
      {
        title: 'Generar PDF unificado',
        body:
          'Tocá "Generar etiquetas". Madsjeez compila las 12 etiquetas en un único PDF con cortes claros entre cada una. Tarda 5-10 segundos.',
        visualHint:
          'Loader con texto "Compilando 12 etiquetas..." y preview del PDF al final.',
      },
      {
        title: 'Imprimir y pegar',
        body:
          'Imprimí en papel A4 o etiquetas térmicas. Si usás etiquetas, ajustá la escala al 100 % (sin "ajustar a página"). Cortá por las líneas de corte y pegá en cada paquete.',
        visualHint:
          'Mock de impresora con 4 etiquetas saliendo + medida 10×15 cm.',
      },
    ],
    ctaLabel: 'Ir a etiquetas',
    ctaHref: '/dashboard/shipping/labels',
    related: ['gestionar-preguntas', 'ver-metricas'],
  },
  {
    slug: 'ver-metricas',
    title: 'Entender tus métricas de venta',
    subtitle: 'Las 4 cifras que definen si tu negocio crece o se estanca',
    audience: 'seller',
    duration: '7 min',
    level: 'medio',
    tags: ['analytics', 'crecimiento'],
    icon: 'chart',
    summary:
      'GMV, conversión, ticket promedio y reputación. Qué significa cada una y qué hacer si baja.',
    intro:
      'No mires todas las métricas todos los días. Estas 4 son suficientes: si las cuatro crecen, tu negocio crece. Si una baja, sabés exactamente dónde mirar.',
    steps: [
      {
        title: 'GMV (Gross Merchandise Value)',
        body:
          'La plata bruta que vendiste en el período. Si baja: revisá si pausaste publicaciones, si subiste precio sin justificación, o si tu competencia bajó.',
        visualHint:
          'KPI big number "$ 2.450.000" + sparkline 30 días.',
      },
      {
        title: 'Conversión',
        body:
          'Cuántas de las personas que vieron tu publicación, te compraron. Promedio sano: 2-5 %. Si tenés menos: probablemente tu precio está alto vs competencia, o tu foto no convence.',
        visualHint:
          'Donut chart 3.2 % conversión + comparativa "promedio del rubro".',
      },
      {
        title: 'Ticket promedio',
        body:
          'Cuánto gasta en promedio cada comprador. Si está bajo, probá agregar combos o cross-sell ("comprá esto, te recomendamos...").',
        visualHint:
          'Bar chart por mes con valor en cada barra.',
      },
      {
        title: 'Reputación',
        body:
          'Verde, amarilla o roja. Verde abre todas las puertas: aparecés más arriba en buscador, te dan más cuotas, te mostramos en home. Roja te penaliza visibilidad fuerte.',
        visualHint:
          'Termómetro vertical de 3 colores + indicadores de reclamos / demoras / cancelaciones.',
      },
      {
        title: 'Plan semanal',
        body:
          'Una vez por semana (lunes a la mañana), abrí Métricas y revisá: GMV vs semana anterior, conversión vs mes anterior, reclamos abiertos. 15 minutos y sabés qué corregir.',
        visualHint:
          'Calendario marcado con "Lunes 10:00 - Revisar métricas" + checklist de 3 ítems.',
      },
    ],
    ctaLabel: 'Ver mis métricas',
    ctaHref: '/dashboard/analytics',
    related: ['gestionar-preguntas', 'usar-ads'],
  },
  {
    slug: 'usar-ads',
    title: 'Usar MADSJEEZ Ads para más visibilidad',
    subtitle: 'Aparecer arriba en buscador y en home sin pagar fortunas',
    audience: 'seller',
    duration: '6 min',
    level: 'medio',
    tags: ['ads', 'marketing', 'visibilidad'],
    icon: 'megaphone',
    summary:
      'Cómo crear tu primera campaña, qué presupuesto mínimo conviene, y cómo medir si te trae ventas reales.',
    intro:
      'MADSJEEZ Ads cobra solo por click (CPC). Empezás con $5.000 y ya empezás a aparecer en buscador y home. La diferencia con publicidad tradicional: vos elegís qué publicaciones promocionás, no obligamos a invertir en toda la tienda.',
    steps: [
      {
        title: 'Crear campaña desde una publicación',
        body:
          'Entrá a una publicación tuya y tocá "Promocionar". Te abre el wizard de campaña con la publicación ya pre-seleccionada.',
        visualHint:
          'Botón "Promocionar" en el detalle de una publicación + wizard abriéndose.',
      },
      {
        title: 'Definí presupuesto diario',
        body:
          'Empezá con $1.500-3.000 por día. Madsjeez nunca te cobra más del presupuesto que ponés. Podés pausar cuando quieras.',
        visualHint:
          'Slider de presupuesto $0 - $20.000 con marker en $2.500/día.',
      },
      {
        title: 'Elegí dónde aparecer',
        body:
          'Tres opciones: buscador (sale cuando alguien busca palabras relacionadas), home (rotación equitativa), o ambos. Para empezar, "ambos" te da más exposición.',
        visualHint:
          'Toggle 3 opciones con preview de cada formato.',
      },
      {
        title: 'Medí los resultados en 3 días',
        body:
          'Andá a Ads → Campañas y mirá: impresiones, clicks, ventas atribuidas. Si el costo por venta (CPA) es menor a tu margen, la campaña es rentable. Si es mayor, pausá y ajustá presupuesto o foto.',
        visualHint:
          'Tabla con columnas: Impresiones / Clicks / Ventas / CPA / ROAS.',
      },
    ],
    ctaLabel: 'Crear mi primera campaña',
    ctaHref: '/dashboard/ads',
    related: ['publicar-producto', 'ver-metricas'],
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALES.find((t) => t.slug === slug);
}

export function getRelated(slug: string): Tutorial[] {
  const t = getTutorial(slug);
  if (!t?.related) return [];
  return t.related.map((s) => getTutorial(s)).filter((x): x is Tutorial => !!x);
}
