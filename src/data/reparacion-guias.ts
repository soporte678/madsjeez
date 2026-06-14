/**
 * Guías de reparación y mantenimiento (orientación general).
 * Reglas: contenido seguro y honesto. NO damos pasos riesgosos específicos por
 * modelo (ej: vueltas exactas de tornillos de carburador) y siempre recordamos
 * "ante la duda, service oficial". Distinto de GUIAS_COMPRA (guías de compra) y
 * de PartsVision /diagnostico (no activo). Rutea a búsqueda real de repuestos.
 */

export type RepMaquina = "Desmalezadora" | "Motosierra" | "General";

export type RepGuia = {
  slug: string;
  maquina: RepMaquina;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  intro: string;
  causas?: string[];
  pasos: { titulo: string; detalle: string }[];
  seguridad: string[];
  faqs: { question: string; answer: string }[];
  searchQuery: string;
  related: string[];
};

const SEG_BASE = [
  "Apagá el motor y esperá a que se enfríe antes de cualquier revisión.",
  "Desconectá el capuchón de la bujía para evitar un arranque accidental.",
  "Usá guantes y protección ocular. La cadena y las cuchillas cortan incluso detenidas.",
];

export const REP_GUIAS: RepGuia[] = [
  {
    slug: "desmalezadora-no-arranca",
    maquina: "Desmalezadora",
    title: "Mi desmalezadora no arranca: qué revisar",
    seoTitle: "Desmalezadora no arranca: causas y qué revisar | Madsjeez",
    metaDescription: "Si tu desmalezadora no arranca, revisá combustible, bujía, filtro y mezcla. Guía de causas comunes paso a paso.",
    excerpt: "Las causas más comunes y en qué orden revisarlas.",
    intro: "Cuando una desmalezadora 2 tiempos no arranca, casi siempre es algo de combustible, chispa o aire. Revisalas en orden antes de pensar en una falla mayor.",
    causas: ["Combustible viejo o mezcla incorrecta", "Bujía sucia o gastada", "Filtro de aire tapado", "Falta de cebado (primer)", "Carburador sucio por nafta estacionada"],
    pasos: [
      { titulo: "Combustible y mezcla", detalle: "Verificá que haya combustible fresco y con la proporción de aceite 2T que indica el fabricante. La nafta vieja (más de unas semanas) suele impedir el arranque." },
      { titulo: "Bujía", detalle: "Sacá la bujía y mirá si está húmeda, negra o con depósitos. Una bujía sucia o mojada puede impedir la chispa; limpiala o reemplazala si está gastada." },
      { titulo: "Filtro de aire", detalle: "Un filtro tapado ahoga el motor. Revisalo y limpialo o cambialo si está sucio." },
      { titulo: "Cebado", detalle: "Accioná la pera de cebado (primer) las veces que indique el manual para llevar combustible al carburador." },
      { titulo: "Si sigue sin arrancar", detalle: "Puede ser el carburador sucio por nafta estacionada. La limpieza de carburador conviene hacerla con cuidado o en un service." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Por qué no arranca después del invierno?", answer: "Suele ser nafta estacionada que se degrada y ensucia el carburador. Vaciar el tanque al guardar la máquina lo evita." },
      { question: "¿Conviene limpiar el carburador yo mismo?", answer: "Es posible, pero requiere cuidado. Si no tenés experiencia, conviene un service para no dañar piezas internas." },
    ],
    searchQuery: "bujia desmalezadora",
    related: ["como-hacer-mezcla-2-tiempos", "mantenimiento-desmalezadora", "limpiar-carburador-orientacion"],
  },
  {
    slug: "motosierra-no-arranca",
    maquina: "Motosierra",
    title: "Mi motosierra no arranca: qué revisar",
    seoTitle: "Motosierra no arranca: causas y solución | Madsjeez",
    metaDescription: "Motosierra que no arranca: revisá combustible, bujía, filtro y cebado. Causas comunes y pasos para diagnosticar.",
    excerpt: "Combustible, chispa y aire: el orden para diagnosticar.",
    intro: "Una motosierra que no arranca suele tener un problema de combustible, chispa o aire. Revisá lo simple primero.",
    causas: ["Combustible viejo o mezcla mal hecha", "Bujía sucia o sin chispa", "Filtro de aire tapado", "Interruptor en posición de apagado", "Carburador sucio"],
    pasos: [
      { titulo: "Interruptor y cebado", detalle: "Verificá que el interruptor esté en encendido y accioná el cebador/estárter según el manual." },
      { titulo: "Combustible y mezcla", detalle: "Usá nafta fresca con la proporción 2T correcta. La mezcla vieja es la causa más frecuente." },
      { titulo: "Bujía", detalle: "Revisá la bujía: si está negra, húmeda o gastada, limpiala o cambiala." },
      { titulo: "Filtro de aire", detalle: "Limpiá o reemplazá el filtro si está sucio: el motor necesita aire para arrancar." },
      { titulo: "Si persiste", detalle: "Un carburador sucio o un problema de bobina/chispa requieren revisión más profunda, idealmente en un service." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "Tiene combustible y bujía nueva pero no arranca, ¿qué puede ser?", answer: "Puede ser el filtro tapado, el carburador sucio o falta de chispa por la bobina. Si descartaste lo simple, conviene un service." },
      { question: "¿Cómo sé si la bujía da chispa?", answer: "Con el capuchón puesto, apoyá la rosca de la bujía a metal del motor y tirá del arranque: deberías ver una chispa. Hacelo con cuidado y lejos de combustible." },
    ],
    searchQuery: "bujia motosierra",
    related: ["motosierra-no-lubrica-cadena", "mantenimiento-motosierra", "cuando-llevar-al-service"],
  },
  {
    slug: "motosierra-no-lubrica-cadena",
    maquina: "Motosierra",
    title: "La motosierra no lubrica la cadena",
    seoTitle: "Motosierra no lubrica la cadena: causas y solución | Madsjeez",
    metaDescription: "Si tu motosierra no aceita la cadena, revisá el aceite, el conducto y el agujero de la espada. Causas comunes y qué hacer.",
    excerpt: "Por qué la cadena se calienta o no recibe aceite.",
    intro: "Si la cadena trabaja en seco se calienta, se desgasta y se afloja. La falta de lubricación casi siempre es aceite, conducto o espada.",
    causas: ["Falta de aceite de cadena", "Aceite demasiado espeso o sucio", "Conducto de aceite tapado", "Agujero de engrase de la espada obstruido", "Bomba de aceite con falla"],
    pasos: [
      { titulo: "Nivel y tipo de aceite", detalle: "Verificá que el depósito de aceite de cadena tenga nivel y uses aceite adecuado para cadena (no aceite usado de motor)." },
      { titulo: "Salida de aceite", detalle: "Con el motor en marcha y a media aceleración, acercá la punta de la espada a una superficie clara: debería marcar una línea de aceite. Si no, hay obstrucción." },
      { titulo: "Limpiar conducto y espada", detalle: "Sacá la espada y limpiá el agujero de engrase y la ranura, donde se acumula aserrín y grasa endurecida." },
      { titulo: "Si no mejora", detalle: "Si el aceite no sale aun con todo limpio, puede ser la bomba de aceite: conviene revisión en un service." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Puedo usar aceite de motor usado para la cadena?", answer: "No es recomendable: el aceite usado contamina y lubrica peor. Usá aceite específico para cadena." },
      { question: "La cadena se calienta y suelta humo, ¿es por esto?", answer: "Sí, suele ser falta de lubricación o cadena mal tensada/desafilada. Revisá aceite, tensión y afilado." },
    ],
    searchQuery: "espada cadena motosierra",
    related: ["afilar-tensar-cadena-motosierra", "mantenimiento-motosierra", "cuando-llevar-al-service"],
  },
  {
    slug: "como-hacer-mezcla-2-tiempos",
    maquina: "General",
    title: "Cómo hacer la mezcla 2 tiempos correctamente",
    seoTitle: "Mezcla 2 tiempos: cómo hacerla bien | Madsjeez",
    metaDescription: "Cómo preparar la mezcla de nafta y aceite para motores 2 tiempos. Proporción, orden y errores que dañan el motor.",
    excerpt: "Proporción, orden de mezclado y errores a evitar.",
    intro: "Los motores 2 tiempos se lubrican con el aceite mezclado en la nafta. Una mezcla mal hecha es una de las causas más comunes de fallas y daños.",
    pasos: [
      { titulo: "Respetá la proporción del fabricante", detalle: "Cada máquina indica su proporción (por ejemplo 25:1, 40:1 o 50:1). Usá la que figura en tu manual: no todas son iguales." },
      { titulo: "Usá aceite 2T", detalle: "Usá aceite específico para motores 2 tiempos, no aceite de motor común. El aceite 2T está hecho para quemarse junto al combustible." },
      { titulo: "Mezclá en un bidón limpio", detalle: "Cargá primero parte de la nafta, agregá el aceite, y completá con el resto de la nafta. Agitá para integrar bien." },
      { titulo: "Usá combustible fresco", detalle: "Prepará solo lo que vayas a usar en pocas semanas. La mezcla vieja se degrada y ensucia el carburador." },
    ],
    seguridad: ["Mezclá y cargá combustible con el motor apagado, frío y lejos de fuentes de calor o chispas.", "Hacelo en un lugar ventilado y limpiá cualquier derrame antes de arrancar."],
    faqs: [
      { question: "¿Qué pasa si pongo nafta sola en un 2 tiempos?", answer: "Sin aceite el motor no se lubrica y se daña, muchas veces de forma irreparable. Nunca uses nafta sola en un 2T." },
      { question: "¿Y si le pongo más aceite 'por las dudas'?", answer: "Demasiado aceite genera humo, ensucia la bujía y puede afectar el rendimiento. Respetá la proporción indicada." },
    ],
    searchQuery: "aceite 2 tiempos",
    related: ["desmalezadora-no-arranca", "mantenimiento-desmalezadora", "mantenimiento-motosierra"],
  },
  {
    slug: "mantenimiento-desmalezadora",
    maquina: "Desmalezadora",
    title: "Mantenimiento básico de la desmalezadora",
    seoTitle: "Mantenimiento de desmalezadora: guía básica | Madsjeez",
    metaDescription: "Mantenimiento básico de tu desmalezadora: filtro, bujía, mezcla, cabezal y limpieza. Para que dure más y arranque siempre.",
    excerpt: "Rutina simple para que arranque siempre y dure más.",
    intro: "Un mantenimiento simple y regular evita la mayoría de las fallas y alarga la vida de la máquina.",
    pasos: [
      { titulo: "Antes de cada uso", detalle: "Revisá combustible fresco, nivel correcto y que el cabezal y la protección estén firmes." },
      { titulo: "Cada cierto tiempo", detalle: "Limpiá el filtro de aire, revisá la bujía y limpiá las aletas de refrigeración del motor para que no se recaliente." },
      { titulo: "Al guardar por un tiempo largo", detalle: "Vaciá el combustible o hacé funcionar la máquina hasta agotar el carburador, para evitar que la nafta estacionada lo ensucie." },
      { titulo: "Cabezal y tanza", detalle: "Mantené el cabezal limpio y usá el diámetro de tanza compatible." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Cada cuánto cambio la bujía?", answer: "Depende del uso. Revisala periódicamente y cambiala si está gastada o no da buena chispa." },
      { question: "¿Por qué se recalienta?", answer: "Suele ser por aletas de refrigeración sucias, filtro tapado o mezcla incorrecta. Revisá esos puntos." },
    ],
    searchQuery: "filtro desmalezadora",
    related: ["desmalezadora-no-arranca", "como-hacer-mezcla-2-tiempos", "cambiar-cargar-tanza"],
  },
  {
    slug: "mantenimiento-motosierra",
    maquina: "Motosierra",
    title: "Mantenimiento básico de la motosierra",
    seoTitle: "Mantenimiento de motosierra: guía básica | Madsjeez",
    metaDescription: "Mantenimiento básico de motosierra: cadena, espada, aceite, filtro y bujía. Para cortar mejor y de forma más segura.",
    excerpt: "Cadena, espada, aceite y filtro: la rutina esencial.",
    intro: "Una motosierra bien mantenida corta mejor, gasta menos y es más segura. La cadena y la lubricación son lo más importante.",
    pasos: [
      { titulo: "Cadena y espada", detalle: "Mantené la cadena afilada y con la tensión correcta. Limpiá la ranura de la espada y revisá su desgaste." },
      { titulo: "Lubricación", detalle: "Verificá el nivel de aceite de cadena antes de cada uso y que la salida de aceite funcione." },
      { titulo: "Filtro y bujía", detalle: "Limpiá el filtro de aire y revisá la bujía periódicamente." },
      { titulo: "Combustible", detalle: "Usá mezcla 2T fresca con la proporción correcta y vaciá el tanque si la guardás mucho tiempo." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Cada cuánto afilo la cadena?", answer: "Cuando notes que cuesta cortar, que salta o que produce aserrín muy fino en lugar de viruta. Una cadena desafilada fuerza el motor." },
      { question: "¿Cómo sé si la espada está gastada?", answer: "Si la ranura está despareja, con rebabas o la cadena queda floja de un lado, la espada puede estar gastada." },
    ],
    searchQuery: "cadena motosierra",
    related: ["afilar-tensar-cadena-motosierra", "motosierra-no-lubrica-cadena", "como-hacer-mezcla-2-tiempos"],
  },
  {
    slug: "cambiar-cargar-tanza",
    maquina: "Desmalezadora",
    title: "Cómo cargar o cambiar la tanza del cabezal",
    seoTitle: "Cómo cargar la tanza de la desmalezadora | Madsjeez",
    metaDescription: "Cómo cargar o cambiar la tanza en el cabezal de tu desmalezadora paso a paso, y cómo elegir el diámetro correcto.",
    excerpt: "Cargar el hilo sin errores y elegir el diámetro correcto.",
    intro: "Cargar la tanza es una de las tareas más frecuentes. Hacerla bien evita que se trabe o se corte enseguida.",
    pasos: [
      { titulo: "Apagá y desconectá", detalle: "Con el motor apagado y la bujía desconectada, accedé al cabezal de forma segura." },
      { titulo: "Abrí el cabezal", detalle: "Según el modelo, se abre presionando las trabas o girando la tapa. Sacá el carretel interno." },
      { titulo: "Cargá el diámetro correcto", detalle: "Usá el diámetro de tanza que admite tu cabezal. Bobiná en el sentido indicado (suele estar marcado) y sin cruzar el hilo." },
      { titulo: "Cerrá y probá", detalle: "Pasá las puntas por los orificios, cerrá el cabezal y verificá que la tanza salga libremente." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Cualquier tanza sirve para mi cabezal?", answer: "No. Cada cabezal admite un rango de diámetro. Verificá el diámetro compatible antes de comprar." },
      { question: "La tanza no sale o se traba, ¿por qué?", answer: "Suele ser por bobinar en sentido contrario, cruzar el hilo o usar un diámetro que no corresponde." },
    ],
    searchQuery: "tanza desmalezadora",
    related: ["mantenimiento-desmalezadora", "desmalezadora-no-arranca", "identificar-repuesto-por-medidas"],
  },
  {
    slug: "afilar-tensar-cadena-motosierra",
    maquina: "Motosierra",
    title: "Afilar y tensar la cadena de la motosierra",
    seoTitle: "Cómo afilar y tensar la cadena de motosierra | Madsjeez",
    metaDescription: "Cómo mantener afilada y bien tensada la cadena de tu motosierra para cortar mejor y de forma segura.",
    excerpt: "Una cadena afilada y tensada corta mejor y cuida el motor.",
    intro: "La cadena es el corazón del corte. Afilada y con la tensión justa, corta parejo y reduce el esfuerzo del motor.",
    pasos: [
      { titulo: "Tensión correcta", detalle: "Con el motor frío, la cadena debe ajustar contra la espada pero girar a mano con suavidad. Ni floja (peligrosa) ni demasiado tensa (fuerza la espada)." },
      { titulo: "Afilado", detalle: "Usá la lima del diámetro correspondiente al paso de tu cadena y respetá el ángulo de los dientes. Da las mismas pasadas a cada diente para un corte parejo." },
      { titulo: "Señales de cadena desafilada", detalle: "Si la sierra produce aserrín fino en vez de viruta, salta o exige empujar, la cadena necesita afilado." },
      { titulo: "Cuándo reemplazarla", detalle: "Si los dientes quedaron muy cortos o hay eslabones dañados, conviene reemplazar la cadena." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Qué lima uso?", answer: "El diámetro de lima depende del paso de la cadena. Verificá el paso de tu cadena para elegir la lima correcta." },
      { question: "¿Cadena muy tensa es mejor?", answer: "No. Demasiada tensión fuerza la espada y el motor. Debe girar a mano con suavidad estando fría." },
    ],
    searchQuery: "cadena motosierra",
    related: ["mantenimiento-motosierra", "motosierra-no-lubrica-cadena", "identificar-repuesto-por-medidas"],
  },
  {
    slug: "limpiar-carburador-orientacion",
    maquina: "General",
    title: "Carburador sucio: qué hacer (orientación)",
    seoTitle: "Carburador sucio en máquina 2 tiempos: qué hacer | Madsjeez",
    metaDescription: "Síntomas de carburador sucio en desmalezadora o motosierra y cuándo conviene limpiarlo o llevarlo a un service.",
    excerpt: "Síntomas, prevención y cuándo conviene el service.",
    intro: "El carburador es una pieza sensible. Acá te ayudamos a reconocer cuándo es el problema y a decidir si lo resolvés vos o en un taller.",
    causas: ["Nafta estacionada que dejó depósitos", "Filtro de aire muy sucio", "Mezcla degradada"],
    pasos: [
      { titulo: "Reconocé los síntomas", detalle: "Cuesta arrancar, se apaga al acelerar, anda irregular o solo funciona con el cebador puesto: suelen apuntar a carburador sucio." },
      { titulo: "Descartá lo simple primero", detalle: "Probá con combustible fresco, filtro limpio y bujía en buen estado antes de tocar el carburador." },
      { titulo: "Limpieza", detalle: "La limpieza interna del carburador requiere desarmarlo con cuidado y, a veces, kit de reparación. Si no tenés experiencia, conviene un service para no perder piezas ni desajustarlo." },
      { titulo: "Prevención", detalle: "Vaciá el combustible al guardar la máquina por períodos largos. Es la mejor forma de evitar que el carburador se ensucie." },
    ],
    seguridad: ["Trabajá con el motor frío, sin combustible cerca y en lugar ventilado.", "Si dudás del desarme, no fuerces piezas: un service evita daños mayores."],
    faqs: [
      { question: "¿Puedo limpiarlo solo con limpiador en aerosol?", answer: "Un limpiador externo puede ayudar en casos leves, pero los depósitos internos suelen requerir desarmarlo. Hacelo con cuidado o en un service." },
      { question: "¿Cómo evito que se ensucie?", answer: "Usando combustible fresco y vaciando el tanque cuando guardás la máquina por mucho tiempo." },
    ],
    searchQuery: "carburador desmalezadora",
    related: ["desmalezadora-no-arranca", "motosierra-no-arranca", "cuando-llevar-al-service"],
  },
  {
    slug: "cambiar-bujia-filtro",
    maquina: "General",
    title: "Cambiar la bujía y el filtro de aire",
    seoTitle: "Cómo cambiar bujía y filtro de aire | Madsjeez",
    metaDescription: "Cómo revisar y cambiar la bujía y el filtro de aire en máquinas de jardín 2 tiempos para que arranquen y rindan mejor.",
    excerpt: "Dos cambios simples que resuelven muchos problemas de arranque.",
    intro: "La bujía y el filtro de aire son dos de los repuestos más fáciles de cambiar y los que más resuelven problemas de arranque y rendimiento.",
    pasos: [
      { titulo: "Bujía", detalle: "Con el motor frío, desconectá el capuchón y sacá la bujía con la llave adecuada. Si está negra, húmeda o gastada, reemplazala por una equivalente." },
      { titulo: "Verificá la separación", detalle: "Algunas bujías requieren una separación de electrodos específica. Verificá el valor que indica el fabricante." },
      { titulo: "Filtro de aire", detalle: "Abrí la tapa del filtro, sacá el elemento y limpialo o reemplazalo si está muy sucio. Un filtro tapado ahoga el motor." },
      { titulo: "Volvé a armar", detalle: "Colocá todo en su lugar, reconectá el capuchón y probá el arranque." },
    ],
    seguridad: SEG_BASE,
    faqs: [
      { question: "¿Qué bujía compro?", answer: "Una equivalente a la original de tu modelo. Verificá la referencia de la bujía que trae la máquina antes de comprar." },
      { question: "¿El filtro se lava o se cambia?", answer: "Depende del tipo. Algunos se limpian y reutilizan; otros, de papel, se cambian. Revisá el manual." },
    ],
    searchQuery: "bujia desmalezadora",
    related: ["desmalezadora-no-arranca", "motosierra-no-arranca", "identificar-repuesto-por-medidas"],
  },
  {
    slug: "identificar-repuesto-por-medidas",
    maquina: "General",
    title: "Cómo identificar el repuesto correcto por medidas",
    seoTitle: "Cómo identificar el repuesto correcto por medidas | Madsjeez",
    metaDescription: "Cómo identificar el repuesto exacto para tu máquina: marca, modelo, medidas y número de parte. Evitá comprar la pieza equivocada.",
    excerpt: "Marca, modelo, medidas y número de parte: cómo no errar la compra.",
    intro: "El error más común al comprar repuestos es no verificar la compatibilidad. Con estos datos reducís muchísimo el riesgo de comprar la pieza equivocada.",
    pasos: [
      { titulo: "Marca y modelo", detalle: "Anotá la marca y el modelo exactos de tu máquina (suelen estar en una etiqueta en el cuerpo o cerca del motor)." },
      { titulo: "Número de parte", detalle: "Si la pieza vieja tiene un número de parte impreso, anotalo: es la forma más precisa de pedir el repuesto." },
      { titulo: "Medidas", detalle: "Medí la pieza con precisión (diámetro, largo, paso, tipo de encastre). Para cadenas, el paso y calibre; para tanza, el diámetro; para espadas, largo y encastre." },
      { titulo: "Confirmá antes de comprar", detalle: "Pasale al vendedor marca, modelo y medidas. Verificá siempre medidas, modelo y tipo de encastre antes de comprar." },
    ],
    seguridad: ["Trabajá con el motor apagado y frío al medir piezas montadas."],
    faqs: [
      { question: "¿Alcanza con decir la marca?", answer: "No. La misma marca tiene muchos modelos con piezas distintas. Sumá modelo, medidas y, si podés, número de parte." },
      { question: "¿Y si no encuentro el modelo?", answer: "Llevá la pieza vieja como referencia y compartí fotos y medidas con el vendedor para confirmar compatibilidad." },
    ],
    searchQuery: "repuestos",
    related: ["cambiar-cargar-tanza", "afilar-tensar-cadena-motosierra", "cuando-llevar-al-service"],
  },
  {
    slug: "cuando-llevar-al-service",
    maquina: "General",
    title: "Cuándo conviene llevar la máquina al service",
    seoTitle: "Cuándo llevar tu máquina al service: señales | Madsjeez",
    metaDescription: "Señales de que una falla (pistón, cardán, bobina, embrague) es trabajo de taller y no conviene reparar en casa.",
    excerpt: "Fallas que conviene dejar en manos de un técnico.",
    intro: "Hay reparaciones que conviene dejar a un service: requieren herramientas, repuestos específicos y experiencia. Forzarlas puede dañar más la máquina o ser peligroso.",
    causas: ["Pérdida de compresión / pistón y cilindro", "Cardán o transmisión dañados", "Bobina / sistema de encendido sin chispa", "Campana de embrague desgastada", "Ruidos internos o pérdida de potencia sin causa simple"],
    pasos: [
      { titulo: "Pistón y compresión", detalle: "Si el motor perdió fuerza, hace ruidos internos o no comprime, puede ser pistón/cilindro: es trabajo de taller con herramientas específicas." },
      { titulo: "Cardán o transmisión", detalle: "Si la desmalezadora vibra raro, hace ruido en el eje o el cabezal no gira bien, puede ser el cardán: requiere revisión técnica." },
      { titulo: "Bobina / encendido", detalle: "Si descartaste bujía, combustible y filtro y no hay chispa, puede ser la bobina: medirla y reemplazarla conviene en un service." },
      { titulo: "Embrague", detalle: "Si la cadena o el cabezal giran cuando no deberían, o no transmiten fuerza, la campana de embrague puede estar gastada: es un cambio técnico." },
    ],
    seguridad: ["Ante fallas internas, no sigas usando la máquina: podés agravar el daño o lastimarte.", "Un diagnóstico de service puede salir más barato que una reparación mal hecha."],
    faqs: [
      { question: "¿Cómo sé si es la bobina y no la bujía?", answer: "Primero descartá bujía, combustible y filtro. Si no hay chispa con una bujía nueva, recién ahí se sospecha de la bobina, que conviene medir en un service." },
      { question: "¿Vale la pena reparar o conviene cambiar la máquina?", answer: "Depende del costo del repuesto frente al valor de la máquina. Un service puede darte un presupuesto antes de decidir." },
    ],
    searchQuery: "repuestos",
    related: ["motosierra-no-arranca", "limpiar-carburador-orientacion", "identificar-repuesto-por-medidas"],
  },
];

const BY_SLUG = new Map(REP_GUIAS.map((g) => [g.slug, g]));
export function getRepGuia(slug: string): RepGuia | undefined { return BY_SLUG.get(slug); }
export function allRepGuiaSlugs(): string[] { return REP_GUIAS.map((g) => g.slug); }
