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
  icon:
    | 'rocket' | 'user-plus' | 'package' | 'credit-card' | 'message'
    | 'truck' | 'chart' | 'megaphone' | 'gift' | 'search' | 'camera'
    | 'cart' | 'crown' | 'star' | 'return' | 'help' | 'wallet' | 'tag'
    | 'image' | 'list-checks' | 'banknote';
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
    related: ['crear-cuenta-vendedor', 'publicar-producto', 'configurar-pagos'],
  },
  {
    slug: 'crear-cuenta-vendedor',
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

  /* ═══════════════════════════════════════════════════════════════════ */
  /* COMPRADORES — flujo completo de compra                              */
  /* ═══════════════════════════════════════════════════════════════════ */

  {
    slug: 'crear-cuenta',
    title: 'Crear tu cuenta en 1 minuto',
    subtitle: 'Email + contraseña, sin Google · trial PRO 14 días incluido',
    audience: 'ambos',
    duration: '2 min',
    level: 'fácil',
    tags: ['registro', 'cuenta', 'trial'],
    icon: 'user-plus',
    summary:
      'Crear una cuenta te habilita carrito persistente, favoritos, historial de compras y panel de seller. Al registrarte activamos 14 días gratis con beneficios ULTRA.',
    intro:
      'Madsjeez no requiere cuenta para mirar productos ni para comprar como invitado, pero registrarte te da ventajas concretas: historial, favoritos, direcciones guardadas y 14 días gratis con todos los beneficios del plan ULTRA si querés vender.',
    steps: [
      {
        title: 'Tocá "Crear cuenta" en el navbar',
        body: 'Desde cualquier página, arriba a la derecha. También te aparece automáticamente cuando intentás finalizar una compra sin estar logueado.',
        visualHint: 'Navbar con botón "Creá tu cuenta" en azul resaltado.',
      },
      {
        title: 'Completá nombre, email y contraseña',
        body: 'La contraseña tiene que tener al menos 8 caracteres. El email se valida en el server. No usamos Google: cuenta 100% propia del marketplace.',
        visualHint: 'Form con 3 campos: nombre, email, contraseña + botón "Crear cuenta".',
      },
      {
        title: 'Te logueamos automáticamente',
        body: 'Al crear la cuenta entrás directo al dashboard sin pasar por el login. Recibís un email de bienvenida con tu trial activo.',
        visualHint: 'Dashboard con banner verde "14 días ULTRA gratis activados".',
      },
      {
        title: 'Aprovechá el trial',
        body: 'Tenés 14 días con todos los beneficios del plan ULTRA: publicaciones ilimitadas, marketing IA, exposición máxima. Cuando termine, podés elegir BÁSICO (gratis con 50 pubs), PRO o seguir en ULTRA.',
        visualHint: 'Contador regresivo "Te quedan 14 días de prueba ULTRA".',
      },
    ],
    ctaLabel: 'Crear cuenta ahora',
    ctaHref: '/auth/register',
    related: ['postularte-fundador', 'mads-pro-suscripcion'],
  },

  {
    slug: 'buscar-productos',
    title: 'Buscar productos como un pro',
    subtitle: 'Texto, filtros, categorías y tolerancia a errores de tipeo',
    audience: 'buyer',
    duration: '3 min',
    level: 'fácil',
    tags: ['busqueda', 'filtros', 'navegacion'],
    icon: 'search',
    summary:
      'El buscador acepta errores de tipeo, ignora acentos y aprende de tu historial. Combiná texto + filtros para encontrar exactamente lo que buscás.',
    intro:
      'A diferencia de buscadores que te muestran "0 resultados" si tipeás mal, el de Madsjeez usa coincidencia difusa (pg_trgm + unaccent). "motocierra" matchea "motosierra", "carb" matchea "carburador", y si no hay nada te sugerimos los más vendidos.',
    steps: [
      {
        title: 'Tipeá en la barra del navbar',
        body: 'A medida que escribís te sugiere categorías + productos + búsquedas relacionadas. Las sugerencias se ordenan por relevancia.',
        visualHint: 'Navbar search con dropdown de sugerencias agrupadas (categorías + productos).',
      },
      {
        title: 'Filtrá por categoría, precio y envío',
        body: 'En la página de resultados tenés filtros laterales: categoría, condición (nuevo/usado), rango de precio, envío gratis, FULL, internacional.',
        visualHint: 'Sidebar izquierdo con switches y radio buttons activos en azul.',
      },
      {
        title: 'Si no encuentro nada → "Quizás quisiste decir"',
        body: 'Cuando hay 0 resultados, te mostramos palabras parecidas del catálogo (typo correction) + los 12 productos más vendidos como fallback.',
        visualHint: 'Empty state con chips "Quizás quisiste decir: carburador, motosierra".',
      },
      {
        title: 'Ordenar por relevancia, precio o más nuevos',
        body: 'Arriba a la derecha tenés el sort. Por default "Más relevantes" combina título-match exacto, similarity y ventas.',
        visualHint: 'Select "Ordenar por" con 4 opciones.',
      },
    ],
    ctaLabel: 'Probar el buscador',
    ctaHref: '/search',
    related: ['busqueda-por-imagen', 'pagar-mercadopago'],
  },

  {
    slug: 'busqueda-por-imagen',
    title: 'Buscar productos sacando una foto',
    subtitle: 'IA Gemini identifica el producto y busca similares en el catálogo',
    audience: 'buyer',
    duration: '2 min',
    level: 'fácil',
    tags: ['ia', 'imagen', 'busqueda', 'gemini'],
    icon: 'camera',
    summary:
      'Tenés un repuesto roto y no sabés cómo se llama. Sacale una foto desde el buscador, la IA lo identifica en segundos y te muestra productos compatibles.',
    intro:
      'Madsjeez usa Gemini Vision para reconocer productos en una foto: marca, modelo, categoría y palabras clave. Después busca en el catálogo y te trae los matches. Funciona con celular y con archivos guardados.',
    steps: [
      {
        title: 'Abrí el buscador y tocá "Búsqueda con IA y por imagen"',
        body: 'En la página /search hay un panel colapsable arriba con un ícono de cámara. Tocá para expandir.',
        visualHint: 'Panel desplegado con botón "Subí una foto del producto" y dropzone.',
      },
      {
        title: 'Subí o tomá una foto',
        body: 'Aceptamos JPG, PNG, WEBP hasta 5MB. Si estás en celular, te abre la cámara directo. Si estás en compu, te deja arrastrar el archivo.',
        visualHint: 'Dropzone con preview de imagen subida + spinner "Analizando con IA…".',
      },
      {
        title: 'La IA identifica el producto',
        body: 'Gemini te devuelve nombre, categoría, marca (si la detecta) y nivel de confianza. Ejemplo: "Motosierra Stihl MS 170 · Motosierras · 92% confianza".',
        visualHint: 'Card verde con el resultado del análisis + tags de keywords detectadas.',
      },
      {
        title: 'Te mostramos productos similares',
        body: 'Abajo aparecen 4-12 productos del catálogo que matchean las keywords. Si la confianza es alta, son muy precisos.',
        visualHint: 'Grilla de productos con etiqueta "Encontramos productos similares a: …".',
      },
      {
        title: 'Refiná con texto si querés',
        body: 'Las keywords detectadas se aplican como búsqueda. Podés editar el texto para refinar (ej: agregar "usado" o un precio máximo).',
        visualHint: 'Input con keywords editables tipo chips.',
      },
    ],
    ctaLabel: 'Probar búsqueda por imagen',
    ctaHref: '/search',
    related: ['buscar-productos', 'pagar-mercadopago'],
  },

  {
    slug: 'comprar-como-invitado',
    title: 'Comprar sin crear cuenta',
    subtitle: 'Carrito + checkout sin registro · solo email para el comprobante',
    audience: 'buyer',
    duration: '3 min',
    level: 'fácil',
    tags: ['carrito', 'invitado', 'compra rapida'],
    icon: 'cart',
    summary:
      'Si solo querés comprar una cosa puntual, no hace falta crear cuenta. Agregás al carrito, ponés email y dirección, pagás con Mercado Pago.',
    intro:
      'El checkout de invitado existe para compras one-shot. Tu carrito vive en el navegador (localStorage), no se borra al cerrar la pestaña. Si después decidís crear cuenta, el carrito se sincroniza automáticamente.',
    steps: [
      {
        title: 'Agregá productos al carrito',
        body: 'Desde la ficha del producto, botón "Agregar al carrito". No te pide login. El carrito se guarda en tu navegador.',
        visualHint: 'Botón "Agregar al carrito" + toast verde "Agregado".',
      },
      {
        title: 'Revisá tu carrito en /cart',
        body: 'Subtotal, costo de envío estimado y total. Podés cambiar cantidades o eliminar items.',
        visualHint: 'Página /cart con item, controles +/-, total destacado.',
      },
      {
        title: 'Tocá "Continuar compra"',
        body: 'Si no estás logueado, en vez de mandarte al login te aparece un bloque ámbar "Comprá como invitado" con un input de email.',
        visualHint: 'Form de checkout con bloque amber arriba pidiendo email.',
      },
      {
        title: 'Email + dirección de envío',
        body: 'Ponemos tu email para mandarte el comprobante. Después la dirección estándar (calle, número, ciudad, CP, teléfono).',
        visualHint: 'Form de dirección con campos en grilla 2 col.',
      },
      {
        title: 'Pagás con Mercado Pago',
        body: 'Al confirmar, te llevamos al checkout de MP. Pagás con tarjeta, transferencia, o efectivo. Cuotas según las que el vendedor configuró.',
        visualHint: 'Botón azul "Pagar con Mercado Pago" + logos de medios aceptados.',
      },
    ],
    ctaLabel: 'Ver mi carrito',
    ctaHref: '/cart',
    related: ['pagar-mercadopago', 'crear-cuenta'],
  },

  {
    slug: 'mads-pro-suscripcion',
    title: 'Envíos gratis ilimitados con MADS PRO',
    subtitle: '$30.000/mes · envío $0 en productos desde $25.000',
    audience: 'buyer',
    duration: '2 min',
    level: 'fácil',
    tags: ['mads pro', 'envio gratis', 'suscripcion'],
    icon: 'crown',
    summary:
      'Por una cuota mensual fija tenés envíos gratis ilimitados en todo el marketplace. Sin tope de cantidad ni de monto acumulado.',
    intro:
      'MADS PRO es la suscripción del comprador. Si comprás más de 2 productos por mes desde $25.000, ya se paga sola. No hay letra chica, no hay tope.',
    steps: [
      {
        title: 'Entrá a /mads-pro',
        body: 'Click en el botón "Suscribite a MADS PRO" en el navbar, o entrá directo a la URL. Verás el plan, los beneficios y la comparativa con-vs-sin.',
        visualHint: 'Hero amarillo con "Envíos gratis ilimitados" + precio $30.000 destacado.',
      },
      {
        title: 'Suscribite con tu MP',
        body: 'Tocá "Suscribirme a MADS PRO". Te lleva al checkout de Mercado Pago, pagás con tu tarjeta o saldo. Se renueva automáticamente cada mes.',
        visualHint: 'Botón slate-900 grande "Suscribirme ahora".',
      },
      {
        title: 'Compra normal: envío $0 automático',
        body: 'No hay que activar nada por compra. Cuando agregás un producto de $25.000+ al carrito, el envío se calcula como $0 en el checkout.',
        visualHint: 'Carrito con item de $30.000 mostrando "Envío: $0 (MADS PRO)".',
      },
      {
        title: 'Cancelás cuando quieras',
        body: 'Desde tu cuenta podés cancelar la renovación automática. Mantenés los beneficios hasta el fin del ciclo facturado.',
        visualHint: 'Settings de cuenta con toggle "Renovación automática".',
      },
    ],
    ctaLabel: 'Suscribirme a MADS PRO',
    ctaHref: '/mads-pro',
    related: ['comprar-como-invitado', 'crear-cuenta'],
  },

  {
    slug: 'ver-mis-pedidos',
    title: 'Seguimiento de tus pedidos',
    subtitle: 'Estados, tracking de envío y mensajes con el vendedor',
    audience: 'buyer',
    duration: '3 min',
    level: 'fácil',
    tags: ['pedidos', 'tracking', 'envio'],
    icon: 'list-checks',
    summary:
      'Cada pedido pasa por estados: pagado → preparando → enviado → entregado. Tenés tracking en vivo y chat directo con el vendedor.',
    intro:
      'Después de pagar, tu compra aparece en /orders. Ahí seguís el estado, ves el código de seguimiento del envío y podés mensajear al vendedor si necesitás coordinar algo.',
    steps: [
      {
        title: 'Entrá a "Mis pedidos"',
        body: 'En el menú de tu cuenta, "Mis pedidos". Lista todos tus pedidos con estado actual + fecha + total.',
        visualHint: 'Lista de pedidos con badge de estado coloreado.',
      },
      {
        title: 'Abrí un pedido para ver detalle',
        body: 'Click en una orden te lleva al detalle: ítems, datos del vendedor, dirección de envío, código de tracking, timeline de estados.',
        visualHint: 'Página de detalle con stepper horizontal de 4 estados.',
      },
      {
        title: 'Trackeá el envío',
        body: 'Si el vendedor usa Andreani, Correo Argentino, OCA o Zipnova, ves el código de seguimiento y el link directo a la web del correo.',
        visualHint: 'Card con número de tracking + botón "Seguir en Andreani".',
      },
      {
        title: 'Mensaje directo al vendedor',
        body: 'Si necesitás coordinar algo (cambio de horario, retiro en sucursal, etc.) podés mandar mensaje desde la misma página. El vendedor recibe notificación.',
        visualHint: 'Chat embebido con input "Escribí al vendedor".',
      },
    ],
    ctaLabel: 'Ver mis pedidos',
    ctaHref: '/orders',
    related: ['abrir-reclamo', 'dejar-opinion'],
  },

  {
    slug: 'abrir-reclamo',
    title: 'Abrir reclamo o devolución',
    subtitle: 'Tenés 7 días desde la entrega · plata de vuelta o producto reemplazado',
    audience: 'buyer',
    duration: '4 min',
    level: 'medio',
    tags: ['reclamos', 'devolucion', 'garantia'],
    icon: 'return',
    summary:
      'Si lo que recibiste no es lo que pediste, llegó dañado o no llegó, tenés 7 días para abrir reclamo. Madsjeez media entre vos y el vendedor.',
    intro:
      'La política de devoluciones es de 7 días desde la entrega confirmada. Durante ese período el dinero queda en escrow (no se libera al vendedor) y vos podés pedir reembolso o reemplazo.',
    steps: [
      {
        title: 'Entrá al pedido y tocá "Abrir reclamo"',
        body: 'Desde /orders, abrí el pedido en cuestión y vas a ver el botón "Tengo un problema". Solo disponible si la compra está marcada como entregada y no pasaron más de 7 días.',
        visualHint: 'Botón rojo "Tengo un problema" en la página de detalle.',
      },
      {
        title: 'Seleccioná el motivo',
        body: 'Categorías: producto distinto, producto dañado, no llegó, descripción incorrecta, otro. Cada categoría tiene un formulario específico.',
        visualHint: 'Lista de motivos con radio buttons + descripción de cada uno.',
      },
      {
        title: 'Adjuntá fotos y descripción',
        body: 'Hasta 5 fotos (máx 5MB c/u) que muestren el problema + una descripción de lo que pasó. Cuanto más claro, más rápido se resuelve.',
        visualHint: 'Dropzone múltiple + textarea de descripción.',
      },
      {
        title: 'El vendedor tiene 48hs para responder',
        body: 'Si acepta, te devuelve la plata o coordina reemplazo. Si rechaza, Madsjeez interviene como mediador y revisa las evidencias.',
        visualHint: 'Stepper "Tu reclamo → Vendedor → Mediación Madsjeez".',
      },
      {
        title: 'Resolución y reembolso',
        body: 'Cuando se aprueba el reembolso, MP devuelve la plata al medio de pago original en 3-7 días hábiles.',
        visualHint: 'Card verde "Reclamo resuelto · Reembolso en proceso".',
      },
    ],
    ctaLabel: 'Ver mis pedidos',
    ctaHref: '/orders',
    related: ['ver-mis-pedidos', 'dejar-opinion'],
  },

  {
    slug: 'dejar-opinion',
    title: 'Calificar al vendedor y al producto',
    subtitle: 'Ayudás al próximo comprador · podés agregar fotos',
    audience: 'buyer',
    duration: '2 min',
    level: 'fácil',
    tags: ['reputacion', 'opiniones', 'reviews'],
    icon: 'star',
    summary:
      'Después de recibir el producto te pedimos una opinión. Calificás de 1 a 5 estrellas, escribís un comentario y opcionalmente subís fotos.',
    intro:
      'Las opiniones son el motor de la reputación del marketplace. Tu opinión real ayuda a otros compradores a decidir y al vendedor a mejorar.',
    steps: [
      {
        title: 'Recibí el aviso por email',
        body: 'A los 3 días de marcar el pedido como recibido, te mandamos un email con link directo a la página de calificación.',
        visualHint: 'Inbox con email "¿Cómo te fue con tu compra?".',
      },
      {
        title: 'Puntuá del 1 al 5',
        body: '5 estrellas si todo perfecto. 1 si fue un desastre. Te pedimos que seas honesto: las opiniones falsas las detectamos.',
        visualHint: 'Form con 5 estrellas clickeables.',
      },
      {
        title: 'Contá tu experiencia (opcional)',
        body: 'Lo que querés que sepan otros compradores: calidad del producto, comunicación del vendedor, tiempo de entrega. Mínimo 20 caracteres.',
        visualHint: 'Textarea con placeholder "El producto vino tal como se describía…".',
      },
      {
        title: 'Subí hasta 3 fotos (opcional)',
        body: 'Si tomaste fotos del producto recibido, podés adjuntarlas. Las fotos reales valen oro para el próximo comprador.',
        visualHint: 'Dropzone para fotos + previews.',
      },
    ],
    ctaLabel: 'Ver mis pedidos',
    ctaHref: '/orders',
    related: ['abrir-reclamo'],
  },

  {
    slug: 'preguntar-al-vendedor',
    title: 'Hacer una pregunta antes de comprar',
    subtitle: 'Stock, compatibilidad, garantía · respuestas en horas',
    audience: 'buyer',
    duration: '2 min',
    level: 'fácil',
    tags: ['preguntas', 'pre-venta'],
    icon: 'help',
    summary:
      'En cada producto hay un bloque "Preguntas y Respuestas". Hacés tu consulta y el vendedor responde. Las preguntas son públicas: si tu duda ya está respondida, la ves.',
    intro:
      'Antes de pagar conviene aclarar dudas. Compatibilidad con tu modelo, stock real, plazo de envío. El vendedor tiene 24-48hs para responder y queda registrado público.',
    steps: [
      {
        title: 'Entrá a la ficha del producto',
        body: 'Bajá hasta la sección "Preguntas y Respuestas". Si hay preguntas anteriores, las ves todas con sus respuestas.',
        visualHint: 'Bloque blanco con lista de Q&A previas + botón "Hacer una pregunta".',
      },
      {
        title: 'Tocá "Hacer una pregunta"',
        body: 'Si no tenés cuenta te pedimos que la crees. Si ya estás logueado, se abre un textarea para escribir.',
        visualHint: 'Modal o expandible con textarea.',
      },
      {
        title: 'Escribí tu consulta clara',
        body: 'Ejemplo bueno: "¿Es compatible con motosierra Stihl MS 170?". Ejemplo malo: "Hola, eso?". Mientras más clara la pregunta, más rápida la respuesta.',
        visualHint: 'Textarea con contador de caracteres.',
      },
      {
        title: 'Esperá la respuesta',
        body: 'Te llega notificación + email cuando responde. La pregunta + respuesta quedan visibles para futuros compradores.',
        visualHint: 'Notification "El vendedor respondió tu pregunta".',
      },
    ],
    ctaLabel: 'Explorar productos',
    ctaHref: '/search',
    related: ['comprar-como-invitado', 'ver-mis-pedidos'],
  },

  /* ═══════════════════════════════════════════════════════════════════ */
  /* VENDEDORES — gestión avanzada                                       */
  /* ═══════════════════════════════════════════════════════════════════ */

  {
    slug: 'configurar-cuotas-mercadopago',
    title: 'Configurar cuotas y medios de pago',
    subtitle: 'Vos decidís qué cuotas ofrecer en tu Mercado Pago',
    audience: 'seller',
    duration: '4 min',
    level: 'medio',
    tags: ['mercadopago', 'cuotas', 'pagos'],
    icon: 'credit-card',
    summary:
      'Madsjeez no cobra comisión por venta. Las cuotas que ofrece tu producto las definís vos desde el panel, usando tu cuenta de Mercado Pago.',
    intro:
      'En /dashboard/tarifas-pagos elegís cuántas cuotas ofrecés (1 / 3 / 6 / 9 / 12 / 18 / 24), cuáles cuotas sin interés absorbés vos, y qué medios de pago aceptás (tarjetas, transferencia, efectivo).',
    steps: [
      {
        title: 'Entrá a Tarifas y pagos',
        body: 'En el sidebar del dashboard → Facturación → Tarifas y pagos. Si todavía no vinculaste tu MP, te muestra el botón "Conectar Mercado Pago".',
        visualHint: 'Card amarilla "0% comisión sobre tus ventas" + form de configuración.',
      },
      {
        title: 'Elegí cuotas máximas',
        body: 'Botones: Default MP / 1 / 3 / 6 / 9 / 12 / 18 / 24. Si elegís "Default MP" se usa lo que tengas configurado en tu panel de Mercado Pago.',
        visualHint: 'Botones tipo pill grid horizontal.',
      },
      {
        title: 'Cuotas sin interés que absorbés',
        body: 'Informativo: si querés ofrecer "3 cuotas sin interés", ponelo. El costo financiero real lo cobra Mercado Pago a tu cuenta según las promociones que tengas activas en tu panel.',
        visualHint: 'Input numérico "0-24 cuotas sin interés".',
      },
      {
        title: 'Destildá medios que no querés',
        body: 'Por default aceptamos crédito, débito, efectivo (Rapipago / Pago Fácil), transferencia y cajero. Si querés excluir algún medio, destildá el checkbox.',
        visualHint: 'Lista de 5 medios con checkboxes.',
      },
      {
        title: 'Guardar',
        body: 'Los cambios se aplican a tus PRÓXIMAS ventas. Las pendientes no se modifican.',
        visualHint: 'Botón "Guardar" + toast "Guardado".',
      },
    ],
    ctaLabel: 'Configurar mis cuotas',
    ctaHref: '/dashboard/tarifas-pagos',
    related: ['conectar-mercadopago', 'configurar-envios'],
  },

  {
    slug: 'responder-preguntas-rapido',
    title: 'Responder preguntas en minutos',
    subtitle: 'Panel unificado con IA opcional · meta de 95% en < 2h',
    audience: 'seller',
    duration: '3 min',
    level: 'fácil',
    tags: ['preguntas', 'pre-venta', 'reputacion'],
    icon: 'message',
    summary:
      'Tu velocidad de respuesta es uno de los factores más fuertes del ranking. En el panel de preguntas las contestás de a una con sugerencias de IA.',
    intro:
      'Cada pregunta sin responder es una venta perdida. El panel /dashboard/preguntas las muestra ordenadas por antigüedad. Si tenés plan PRO o ULTRA, la IA te sugiere una respuesta basada en el producto.',
    steps: [
      {
        title: 'Entrá al panel de preguntas',
        body: 'Sidebar → Ventas → Preguntas. Lista filtrable por: pendientes / respondidas / todas. Las pendientes salen primero.',
        visualHint: 'Lista con badge "Pendiente" amarillo en cada item sin responder.',
      },
      {
        title: 'Click en una pregunta',
        body: 'Se expande mostrando: producto al que apunta, foto del comprador, hora exacta. Si es plan PRO+, abajo aparece la sugerencia IA.',
        visualHint: 'Pregunta expandida con sugerencia IA en card verde.',
      },
      {
        title: 'Aceptá la sugerencia o escribí la tuya',
        body: 'La IA usa los datos del producto y preguntas anteriores para sugerirte texto. Podés aceptar tal cual, editar o ignorar.',
        visualHint: 'Botones "Usar sugerencia" / "Escribir manual".',
      },
      {
        title: 'Adjuntá imagen si necesitás (opcional)',
        body: 'Si la respuesta requiere mostrar algo (foto del repuesto, compatibilidad), podés subir hasta 2 imágenes que solo verá el comprador.',
        visualHint: 'Botón "Adjuntar imagen" + previews.',
      },
      {
        title: 'Enviar',
        body: 'Tocá enviar. El comprador recibe notificación + email. Tu tasa de respuesta sube en tiempo real.',
        visualHint: 'Botón "Responder" + métrica "Tasa actual: 98%".',
      },
    ],
    ctaLabel: 'Ir al panel de preguntas',
    ctaHref: '/dashboard/preguntas',
    related: ['gestionar-pedidos', 'ver-metricas'],
  },

  {
    slug: 'configurar-envios',
    title: 'Configurar envíos: Zipnova, Andreani, Flash',
    subtitle: 'Integraciones nativas + opción de envío propio',
    audience: 'seller',
    duration: '6 min',
    level: 'medio',
    tags: ['envios', 'logistica', 'zipnova', 'andreani'],
    icon: 'truck',
    summary:
      'Tenés 4 opciones para despachar: Zipnova (recomendada, integrada), Andreani / Correo / OCA (cotización manual), Flash (ciudad mismo día), o envío propio.',
    intro:
      'En /dashboard/envios elegís qué métodos ofrecés. Lo ideal es vincular Zipnova: el comprador cotiza solo, vos imprimís la etiqueta y un transportista pasa a buscar.',
    steps: [
      {
        title: 'Entrá a Envíos',
        body: 'Sidebar → Configuración → Envíos. Verás los 4 métodos y cuáles tenés activos.',
        visualHint: 'Grid de 4 cards: Zipnova / Andreani / Flash / Propio.',
      },
      {
        title: 'Vinculá Zipnova (recomendado)',
        body: 'Tocá "Conectar Zipnova". Te lleva a su sitio para autorizar la app. Volvés y ya queda integrado: cotización auto + etiquetas.',
        visualHint: 'Botón azul "Conectar Zipnova" + flujo OAuth.',
      },
      {
        title: 'Configurá direcciones de despacho',
        body: 'Agregás 1 o más direcciones desde donde despachás (casa, depósito, sucursal). Madsjeez la usa para cotizar el envío automáticamente.',
        visualHint: 'Form con calle, número, ciudad, código postal.',
      },
      {
        title: 'Definí zonas y precios para envío propio',
        body: 'Si querés usar tu cadete o tu camioneta, configurás zonas (CABA, GBA, interior) y precio por zona. Solo aplica a tus productos.',
        visualHint: 'Tabla zona → precio editable.',
      },
      {
        title: 'Activá Flash para mismo día en CABA',
        body: 'Si vendés productos urgentes (repuestos, recargas, comida) podés activar Flash. El comprador paga extra, un driver pasa en 1-3hs.',
        visualHint: 'Toggle "Flash habilitado" + costo estimado.',
      },
    ],
    ctaLabel: 'Configurar envíos',
    ctaHref: '/dashboard/envios',
    related: ['gestionar-pedidos', 'configurar-cuotas-mercadopago'],
  },

  {
    slug: 'preparar-y-despachar',
    title: 'Preparar y despachar un pedido',
    subtitle: 'Marcar como preparado · imprimir etiqueta · entregar al transportista',
    audience: 'seller',
    duration: '4 min',
    level: 'fácil',
    tags: ['pedidos', 'envio', 'despacho'],
    icon: 'package',
    summary:
      'Cada venta tiene un flujo claro: pagada → preparando → enviada → entregada. Cumplir los tiempos te sube la reputación.',
    intro:
      'Tenés 48hs hábiles para marcar el pedido como "preparado" después de la confirmación de pago. Las demoras impactan tu reputación y el ranking.',
    steps: [
      {
        title: 'Recibí la notificación de venta',
        body: 'Push + email + WhatsApp (si configurado). El estado inicial es "Pagado, esperando preparación".',
        visualHint: 'Notification card "Tenés una venta nueva".',
      },
      {
        title: 'Entrá a Ventas → Pedidos',
        body: 'Filtrá por "Pendientes de preparar". Cada pedido tiene: cliente, productos, dirección de envío, método elegido.',
        visualHint: 'Lista de pedidos pendientes con CTA "Preparar" en cada uno.',
      },
      {
        title: 'Marcá como "Preparado"',
        body: 'Cuando ya tenés el producto embalado, tocá "Preparado". Esto activa la cotización con el transportista (si es Zipnova).',
        visualHint: 'Botón verde "Preparado" + timestamp.',
      },
      {
        title: 'Imprimí la etiqueta',
        body: 'Para Zipnova/Andreani, te aparece botón "Descargar etiqueta PDF". Imprimila y pegala al paquete.',
        visualHint: 'PDF preview + botón "Descargar".',
      },
      {
        title: 'Entregá al transportista o llevalo a sucursal',
        body: 'Según método: Zipnova pasa a buscar, Andreani/OCA tenés que llevarlo a sucursal. Al momento de la entrega marcás "Despachado" y se notifica al comprador.',
        visualHint: 'Botón "Despachado" + input opcional de número de seguimiento.',
      },
    ],
    ctaLabel: 'Ver pedidos pendientes',
    ctaHref: '/dashboard/ventas',
    related: ['responder-preguntas-rapido', 'ver-metricas'],
  },

  {
    slug: 'retirar-dinero',
    title: 'Retirar plata de tus ventas',
    subtitle: 'Mercado Pago te acredita directo · ULTRA tiene retiro inmediato',
    audience: 'seller',
    duration: '3 min',
    level: 'fácil',
    tags: ['retiros', 'dinero', 'mercadopago'],
    icon: 'banknote',
    summary:
      'Madsjeez no toca tu plata. Los pagos van directo a tu Mercado Pago. Desde ahí transferís a tu cuenta bancaria cuando quieras.',
    intro:
      'Como Madsjeez no es un intermediario financiero (no cobra comisión por venta), no hay billetera interna. Cada venta acredita directo en tu cuenta MP, y desde MP transferís a tu CBU/CVU.',
    steps: [
      {
        title: 'Esperá que el pago se libere',
        body: 'Por política de seguridad, el dinero queda retenido en MP hasta que el comprador confirme recepción (o pasen 7 días desde la entrega). En plan ULTRA, el retiro es inmediato.',
        visualHint: 'Timeline de liberación: Pagado → Entregado → Libre para retirar.',
      },
      {
        title: 'Entrá a tu app de Mercado Pago',
        body: 'En tu celular o en mercadopago.com.ar. La plata aparece en "Disponible" cuando se libera.',
        visualHint: 'Pantalla de MP con saldo "Disponible: $X".',
      },
      {
        title: 'Transferir a banco',
        body: 'En MP: Pagos → Transferir → A una cuenta bancaria. Ponés CBU o alias destino. Tarda de minutos a 24hs según el banco.',
        visualHint: 'Form de transferencia en app MP.',
      },
      {
        title: 'O usá la tarjeta prepaga MP',
        body: 'Si preferís no transferir, MP te emite una tarjeta prepaga gratis. Comprás con el saldo directo. Llega en 7-10 días por correo.',
        visualHint: 'Foto de tarjeta MP + CTA "Pedir tarjeta".',
      },
    ],
    ctaLabel: 'Ir a Mercado Pago',
    ctaHref: 'https://www.mercadopago.com.ar',
    related: ['configurar-cuotas-mercadopago', 'ver-metricas'],
  },
  {
    slug: 'importar-catalogo',
    title: 'Importar tu catálogo desde otra tienda',
    subtitle: 'Tienda Nube, Shopify, Empretienda y WooCommerce en minutos',
    audience: 'seller',
    duration: '6 min',
    level: 'fácil',
    tags: ['importación', 'catálogo', 'migración', 'tiendanube', 'shopify'],
    icon: 'list-checks',
    summary:
      'Cómo exportar tus productos de tu tienda actual y subirlos a Madsjeez con un solo archivo, imágenes incluidas.',
    intro:
      'Madsjeez detecta automáticamente de qué plataforma viene tu archivo y mapea las columnas por vos. No hay límite de cantidad de productos. Los duplicados (mismo título) se saltean solos, así podés reimportar sin miedo. Las imágenes se traen desde el link público de tu tienda original.',
    steps: [
      {
        title: 'Exportá el catálogo de tu tienda actual',
        body:
          'Tienda Nube: Productos → Exportar (te llega un CSV por email). Shopify: Products → Export → Plain CSV → All products. Empretienda: Productos → Exportar productos. WooCommerce: Productos → Exportar → todas las columnas → Generar CSV. Guardá el archivo .csv o .xlsx en tu compu.',
        visualHint:
          'Collage de los 4 paneles (Tienda Nube, Shopify, Empretienda, Woo) con el botón Exportar resaltado en cada uno.',
      },
      {
        title: 'Entrá a Importar productos',
        body:
          'En tu panel Madsjeez, andá a Ventas → Importar productos. Vas a ver una zona para arrastrar el archivo.',
        visualHint:
          'Sidebar del dashboard con "Importar productos" resaltado bajo el grupo Ventas.',
      },
      {
        title: 'Subí el archivo',
        body:
          'Arrastrá tu CSV/Excel o tocá "Elegir archivo". Apenas lo subís, Madsjeez lo analiza y te dice qué plataforma detectó (Tienda Nube, Shopify, etc.). Si la detección no es correcta, podés forzar la plataforma con los botones de arriba.',
        visualHint:
          'Dropzone con un archivo siendo arrastrado y un badge verde "Plataforma detectada: Tienda Nube".',
      },
      {
        title: 'Revisá la vista previa',
        body:
          'Vas a ver cuántos productos válidos se detectaron, cuántos traen imagen y cuántos tienen precio. Abajo hay una tabla con los primeros 8 productos: título, categoría, stock, precio y foto. Confirmá que se ve bien.',
        visualHint:
          'Tarjetas de stats (productos válidos / con imágenes / con precio) + tabla preview con miniaturas.',
      },
      {
        title: 'Importá todo',
        body:
          'Tocá "Importar X productos". En unos segundos quedan publicados en tu catálogo con sus imágenes. Te mostramos cuántos se importaron, cuántas imágenes se trajeron y cuántos se saltearon por duplicados.',
        visualHint:
          'Pantalla de éxito con contadores grandes: Importados, Imágenes, Saltados + botón "Ver mis publicaciones".',
      },
      {
        title: 'Revisá precios y envíos',
        body:
          'Después de importar, repasá tus publicaciones. Madsjeez respeta el precio del archivo, pero el envío y las promos las configurás acá según tus reglas. Ajustá categorías si alguna quedó como "General".',
        visualHint:
          'Listado de publicaciones recién importadas con un chip "Importado" y acceso a editar.',
      },
    ],
    ctaLabel: 'Importar mi catálogo',
    ctaHref: '/dashboard/importar',
    related: ['publicar-producto', 'crear-cuenta-vendedor', 'configurar-pagos'],
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
