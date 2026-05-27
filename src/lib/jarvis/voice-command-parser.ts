/**
 * =============================================================================
 * JARVIS VOICE COMMAND PARSER — Natural Language → Structured Intent
 * =============================================================================
 * Parser de comandos de voz para MADSJEEZ Marketplace.
 * Convierte lenguaje natural en acciones estructuradas para el orquestador.
 *
 * Comandos soportados:
 * - "Publicar producto X con precio Y"       → action: "publish_product"
 * - "Mostrar ventas de hoy"                  → action: "show_sales"
 * - "Enviar mensaje a cliente X"             → action: "send_message"
 * - "Sincronizar con MercadoLibre"           → action: "meli_sync"
 * - "Activar modo marketing"                 → action: "activate_marketing"
 * - "Pausar publicaciones"                   → action: "pause_listings"
 * - "Reanudar publicaciones"                 → action: "resume_listings"
 * - "Mostrar inventario"                     → action: "show_inventory"
 * - "Mostrar analiticas"                     → action: "show_analytics"
 * - "Mostrar dashboard"                      → action: "show_dashboard"
 * - "Estado del sistema"                     → action: "health_check"
 * - "Auditar marketplace"                    → action: "audit_marketplace"
 * - "Detectar errores"                       → action: "detect_errors"
 * - "Sugerir mejoras"                        → action: "suggest_improvements"
 * - "Orquestar"                              → action: "orchestrate"
 * - "Crear tarea para [agente]"              → action: "create_agent_task"
 * - "Leer informe de voz"                    → action: "voice_report"
 * =============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceAction =
  | "publish_product"
  | "show_sales"
  | "send_message"
  | "meli_sync"
  | "activate_marketing"
  | "pause_listings"
  | "resume_listings"
  | "show_inventory"
  | "show_analytics"
  | "show_dashboard"
  | "health_check"
  | "audit_marketplace"
  | "detect_errors"
  | "suggest_improvements"
  | "orchestrate"
  | "create_agent_task"
  | "voice_report"
  | "unknown";

export type VoiceCommandParseResult = {
  /** The identified action */
  action: VoiceAction;
  /** Human-readable intent description */
  intent: string;
  /** Extracted named entities */
  entities: VoiceEntities;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether a wake word was detected */
  hasWakeWord: boolean;
  /** Original (cleaned) transcript */
  rawTranscript: string;
};

export type VoiceEntities = {
  /** Product name or ID */
  productName?: string;
  /** Product price */
  price?: number;
  /** Currency (ARS, USD, etc.) */
  currency?: string;
  /** Client name or ID */
  clientName?: string;
  /** Message content */
  message?: string;
  /** Agent target (cursor, claude, windsurf, codex) */
  agentTarget?: string;
  /** Scope (marketplace, whatsapp, ollama, etc.) */
  scope?: string;
  /** Date reference (today, yesterday, week, month) */
  dateRange?: string;
  /** Listing IDs */
  listingIds?: string[];
  /** Category */
  category?: string;
  /** Quantity */
  quantity?: number;
  /** Any other extracted fields */
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Remove accents and normalize text for matching */
function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Replace currency symbols with text
      .replace(/\$/g, " ")
      .replace(/\bpesos?\b/g, " ")
      // Normalize punctuation
      .replace(/[,.;:!?]/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Check if text contains any of the given keywords */
function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

/** Extract price from text (supports $, "pesos", or plain numbers) */
function extractPrice(text: string): { price: number; currency: string } | null {
  // Match $X, X pesos, X ARS, X USD, or plain numbers after "precio" or "a"
  const patterns = [
    /\$\s*(\d[\d.,]*)/,
    /(\d[\d.,]*)\s*(pesos?|ars)/i,
    /(\d[\d.,]*)\s*usd/i,
    /precio\s+(?:de\s+)?\$?\s*(\d[\d.,]*)/i,
    /a\s+\$?\s*(\d[\d.,]*)/i,
    /con\s+(?:precio\s+)?\$?\s*(\d[\d.,]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/\./g, "").replace(/,/g, ".");
      const price = parseFloat(raw);
      if (!isNaN(price) && price > 0) {
        const currency = /usd/i.test(text) ? "USD" : "ARS";
        return { price, currency };
      }
    }
  }
  return null;
}

/** Extract product name from text */
function extractProductName(text: string): string | undefined {
  const patterns = [
    /publicar\s+(?:producto\s+)?[""']?([^""'0-9]+?)[""']?\s+(?:con|a|precio)/i,
    /publicar\s+(?:producto\s+)?[""']?([^""']+?)[""']?\s*$/i,
    /producto\s+[""']?([^""'0-9]+?)[""']?\s+(?:con|a|precio)/i,
    /producto\s+[""']?([^""']+?)[""']?\s*$/i,
    /agregar\s+(?:producto\s+)?[""']?([^""'0-9]+?)[""']?\s+(?:con|a|precio)/i,
    /nuevo\s+(?:producto\s+)?[""']?([^""'0-9]+?)[""']?\s+(?:con|a|precio)/i,
    /subir\s+(?:producto\s+)?[""']?([^""'0-9]+?)[""']?\s+(?:con|a|precio)/i,
    /subir\s+(?:producto\s+)?[""']?([^""']+?)[""']?\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length > 1) return name;
    }
  }
  return undefined;
}

/** Extract client name from text */
function extractClientName(text: string): string | undefined {
  const patterns = [
    /cliente\s+[""']?([^""'0-9]+?)[""']?\s*(?:$|con|que|para)/i,
    /a\s+[""']?([^""'0-9]+?)[""']?\s*(?:enviar|mandar|decir)/i,
    /mensaje\s+(?:a|para)\s+[""']?([^""'0-9]+?)[""']?\s*(?:$|con|que|diciendo)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length > 1) return name;
    }
  }
  return undefined;
}

/** Extract message content from text */
function extractMessage(text: string): string | undefined {
  const patterns = [
    /(?:diciendo|que\s+diga|mensaje|contenido)\s+[""']?([^""']+)[""']?/i,
    /(?:decirle|decir)\s+[""']?([^""']+)[""']?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

/** Extract date range reference */
function extractDateRange(text: string): string | undefined {
  const n = normalize(text);
  if (hasAny(n, ["hoy"])) return "today";
  if (hasAny(n, ["ayer"])) return "yesterday";
  if (hasAny(n, ["semana", "ultimos 7"])) return "week";
  if (hasAny(n, ["mes", "ultimos 30", "este mes"])) return "month";
  if (hasAny(n, ["ano", "year", "ultimos 12"])) return "year";
  if (hasAny(n, ["ultima hora"])) return "hour";
  return undefined;
}

/** Extract agent target */
function extractAgentTarget(text: string): string | undefined {
  const n = normalize(text);
  if (hasAny(n, ["claude"])) return "claude";
  if (hasAny(n, ["cursor"])) return "cursor";
  if (hasAny(n, ["windsurf"])) return "windsurf";
  if (hasAny(n, ["codex"])) return "codex";
  return undefined;
}

/** Extract quantity from text */
function extractQuantity(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:unidades?|piezas?|items?|productos?)/i);
  if (match) return parseInt(match[1], 10);
  return undefined;
}

/** Check for wake word */
function detectWakeWord(text: string): boolean {
  const n = normalize(text);
  return hasAny(n, ["jarvis", "atlas", "a tl", "atlas"]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Command Patterns — Each pattern maps to an action with confidence scoring
// ─────────────────────────────────────────────────────────────────────────────

interface CommandPattern {
  action: VoiceAction;
  intent: string;
  keywords: string[];
  negativeKeywords?: string[];
  confidence: number;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  // ── Marketplace Product Commands ──
  {
    action: "publish_product",
    intent: "Publicar producto en el marketplace",
    keywords: [
      "publicar",
      "subir",
      "agregar",
      "nuevo producto",
      "crear producto",
      "publicar producto",
      "subir producto",
      "agregar producto",
      "cargar producto",
      "vender producto",
    ],
    confidence: 0.92,
  },
  {
    action: "show_sales",
    intent: "Mostrar ventas",
    keywords: [
      "ventas",
      "mostrar ventas",
      "ver ventas",
      "cuanto vendi",
      "reporte de ventas",
      "resumen de ventas",
      "ventas de hoy",
      "mis ventas",
      "ordenes",
      "pedidos",
      "transacciones",
    ],
    negativeKeywords: ["enviar", "mensaje"],
    confidence: 0.91,
  },
  {
    action: "send_message",
    intent: "Enviar mensaje a cliente",
    keywords: [
      "enviar mensaje",
      "mandar mensaje",
      "mensaje a",
      "enviar whatsapp",
      "mandar whatsapp",
      "contactar",
      "notificar",
      "avisar",
      "responder",
      "chat",
      "mensaje cliente",
    ],
    confidence: 0.9,
  },
  {
    action: "meli_sync",
    intent: "Sincronizar con MercadoLibre",
    keywords: [
      "sincronizar",
      "sync",
      "mercadolibre",
      "mercado libre",
      "meli",
      "actualizar mercadolibre",
      "conectar mercadolibre",
      "vincular mercadolibre",
      "importar mercadolibre",
      "publicaciones mercadolibre",
    ],
    confidence: 0.93,
  },
  {
    action: "activate_marketing",
    intent: "Activar modo marketing",
    keywords: [
      "marketing",
      "activar marketing",
      "modo marketing",
      "campaña",
      "promocionar",
      "promocion",
      "publicidad",
      "ads",
      "boost",
      "destacar",
    ],
    negativeKeywords: ["pausar", "desactivar", "detener"],
    confidence: 0.88,
  },
  {
    action: "pause_listings",
    intent: "Pausar publicaciones",
    keywords: [
      "pausar",
      "pausar publicaciones",
      "pausar productos",
      "detener ventas",
      "suspender",
      "desactivar publicaciones",
      "ocultar productos",
      "pausar todo",
      "pausa general",
    ],
    negativeKeywords: ["reanudar", "activar", "reanudar"],
    confidence: 0.9,
  },
  {
    action: "resume_listings",
    intent: "Reanudar publicaciones",
    keywords: [
      "reanudar",
      "activar",
      "activar publicaciones",
      "reanudar productos",
      "reanudar ventas",
      "habilitar",
      "despausar",
      "volver a vender",
      "republicar",
      "activar todo",
    ],
    negativeKeywords: ["pausar", "desactivar", "detener"],
    confidence: 0.9,
  },
  {
    action: "show_inventory",
    intent: "Mostrar inventario",
    keywords: [
      "inventario",
      "stock",
      "productos",
      "mostrar productos",
      "ver productos",
      "catalogo",
      "listado",
      "que tengo",
      "mi stock",
      "existencias",
    ],
    negativeKeywords: ["publicar", "subir", "agregar", "enviar"],
    confidence: 0.89,
  },
  {
    action: "show_analytics",
    intent: "Mostrar analiticas",
    keywords: [
      "analiticas",
      "analytics",
      "metricas",
      "estadisticas",
      "graficos",
      "tendencias",
      "performance",
      "kpi",
      "indicadores",
      "reporte analitico",
    ],
    confidence: 0.88,
  },
  {
    action: "show_dashboard",
    intent: "Mostrar dashboard general",
    keywords: [
      "dashboard",
      "panel",
      "panel de control",
      "tablero",
      "vista general",
      "resumen",
      "overview",
      "estado general",
      "home",
    ],
    confidence: 0.87,
  },
  // ── System Commands ──
  {
    action: "health_check",
    intent: "Verificar estado del sistema",
    keywords: [
      "estado del sistema",
      "health check",
      "como estas",
      "estatus",
      "sistema",
      "todo bien",
      "check",
      "salud",
      "diagnostico",
    ],
    confidence: 0.92,
  },
  {
    action: "audit_marketplace",
    intent: "Auditar marketplace",
    keywords: [
      "auditar",
      "auditoria",
      "revisar marketplace",
      "revisar mercado",
      "scan marketplace",
      "chequear marketplace",
      "auditoria completa",
      "revisar todo",
      "revision",
    ],
    confidence: 0.91,
  },
  {
    action: "detect_errors",
    intent: "Detectar errores",
    keywords: [
      "detectar errores",
      "buscar errores",
      "errores",
      "problemas",
      "bugs",
      "fallos",
      "que esta mal",
      "issues",
      "diagnosticar",
    ],
    confidence: 0.89,
  },
  {
    action: "suggest_improvements",
    intent: "Sugerir mejoras",
    keywords: [
      "sugerir",
      "sugerencias",
      "mejoras",
      "mejorar",
      "optimizar",
      "recomendaciones",
      "como puedo mejorar",
      "ideas",
      "enhancement",
    ],
    confidence: 0.88,
  },
  {
    action: "orchestrate",
    intent: "Orquestar agentes de IA",
    keywords: [
      "orquestar",
      "orquesta",
      "coordinar",
      "ejecutar todo",
      "full audit",
      "revision completa",
      "activar agentes",
      "correr todo",
      "procesar todo",
    ],
    confidence: 0.9,
  },
  {
    action: "create_agent_task",
    intent: "Crear tarea para agente IA",
    keywords: [
      "crear tarea",
      "nueva tarea",
      "tarea para",
      "asignar tarea",
      "task",
      "crear agente",
      "agente",
      "manda a",
      "que haga",
    ],
    confidence: 0.88,
  },
  {
    action: "voice_report",
    intent: "Generar reporte de voz",
    keywords: [
      "informe de voz",
      "reporte de voz",
      "leer informe",
      "leeme",
      "audio report",
      "reporte audio",
      "narrar",
      "leer resultado",
      "voz",
    ],
    confidence: 0.87,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a voice transcript into a structured command.
 * This is the main entry point for voice command parsing.
 */
export function parseVoiceCommand(transcript: string): VoiceCommandParseResult {
  const rawTranscript = transcript.trim();
  const normalized = normalize(rawTranscript);
  const hasWakeWord = detectWakeWord(rawTranscript);

  // Score each pattern against the normalized text
  let bestMatch: {
    action: VoiceAction;
    intent: string;
    confidence: number;
    score: number;
  } = {
    action: "unknown",
    intent: "No reconoci el comando",
    confidence: 0,
    score: -1,
  };

  for (const pattern of COMMAND_PATTERNS) {
    // Check negative keywords first
    if (pattern.negativeKeywords && hasAny(normalized, pattern.negativeKeywords)) {
      continue;
    }

    // Score: count how many keywords match (weighted by position)
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword)) {
        // Earlier matches in the command get higher weight
        const index = normalized.indexOf(keyword);
        score += 1 + Math.max(0, (100 - index) / 100);
      }
    }

    // Normalize score by keyword count
    const normalizedScore = score / Math.sqrt(pattern.keywords.length);

    if (normalizedScore > bestMatch.score) {
      bestMatch = {
        action: pattern.action,
        intent: pattern.intent,
        confidence: Math.min(1, pattern.confidence * (0.5 + normalizedScore * 0.5)),
        score: normalizedScore,
      };
    }
  }

  // Minimum threshold for recognition
  if (bestMatch.score < 0.3) {
    bestMatch = {
      action: "unknown",
      intent: "No reconoci el comando. Intenta con: 'JARVIS, mostrar ventas' o 'JARVIS, publicar producto'.",
      confidence: 0,
      score: 0,
    };
  }

  // ── Extract entities ─────────────────────────────────────────────────────
  const entities: VoiceEntities = {};

  // Product-related entities
  if (bestMatch.action === "publish_product") {
    entities.productName = extractProductName(rawTranscript);
    const priceInfo = extractPrice(rawTranscript);
    if (priceInfo) {
      entities.price = priceInfo.price;
      entities.currency = priceInfo.currency;
    }
    entities.quantity = extractQuantity(rawTranscript);
    entities.category = extractCategory(rawTranscript);
  }

  // Sales date range
  if (bestMatch.action === "show_sales") {
    entities.dateRange = extractDateRange(rawTranscript);
  }

  // Message entities
  if (bestMatch.action === "send_message") {
    entities.clientName = extractClientName(rawTranscript);
    entities.message = extractMessage(rawTranscript);
    entities.scope = "whatsapp";
  }

  // Agent target
  if (bestMatch.action === "create_agent_task") {
    entities.agentTarget = extractAgentTarget(rawTranscript);
  }

  // Sync scope
  if (bestMatch.action === "meli_sync") {
    entities.scope = "marketplace";
  }

  return {
    action: bestMatch.action,
    intent: bestMatch.intent,
    entities,
    confidence: bestMatch.confidence,
    hasWakeWord,
    rawTranscript,
  };
}

/** Extract category from text */
function extractCategory(text: string): string | undefined {
  const n = normalize(text);
  const categories: Record<string, string[]> = {
    electronics: [
      "electronica",
      "electronicos",
      "celular",
      "computadora",
      "laptop",
      "tablet",
      "auricular",
      "tecnologia",
    ],
    clothing: ["ropa", "camisa", "pantalon", "remera", "zapatilla", "calzado", "moda", "vestir"],
    home: ["hogar", "casa", "mueble", "decoracion", "cocina", "jardin", "baño"],
    sports: ["deporte", "fitness", "gym", "ejercicio", "running", "bicicleta"],
    books: ["libro", "libros", "lectura", "editorial", "literatura"],
    beauty: ["belleza", "cosmetico", "maquillaje", "perfume", "cuidado personal"],
    toys: ["juguete", "juguetes", "juego", "niños", "bebe"],
    automotive: ["auto", "automotriz", "vehiculo", "moto", "accesorio auto"],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => n.includes(kw))) return cat;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get suggested commands for a failed parse
// ─────────────────────────────────────────────────────────────────────────────

export function getSuggestedCommands(partialText: string): Array<{
  action: VoiceAction;
  suggestion: string;
}> {
  const n = normalize(partialText);
  const suggestions: Array<{ action: VoiceAction; suggestion: string }> = [];

  // Match against keyword prefixes
  if (hasAny(n, ["pub", "sub", "agr", "prod"])) {
    suggestions.push({
      action: "publish_product",
      suggestion: "Publicar producto [nombre] con precio [precio]",
    });
  }
  if (hasAny(n, ["ven", "ord", "ped"])) {
    suggestions.push({
      action: "show_sales",
      suggestion: "Mostrar ventas [de hoy/semana/mes]",
    });
  }
  if (hasAny(n, ["men", "men", "wha", "chat"])) {
    suggestions.push({
      action: "send_message",
      suggestion: "Enviar mensaje a cliente [nombre] diciendo [mensaje]",
    });
  }
  if (hasAny(n, ["sin", "mer", "mel"])) {
    suggestions.push({
      action: "meli_sync",
      suggestion: "Sincronizar con MercadoLibre",
    });
  }
  if (hasAny(n, ["inv", "sto", "prod"])) {
    suggestions.push({
      action: "show_inventory",
      suggestion: "Mostrar inventario",
    });
  }
  if (hasAny(n, ["est", "sis", "sal"])) {
    suggestions.push({
      action: "health_check",
      suggestion: "Estado del sistema",
    });
  }

  return suggestions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Format a voice command result for TTS feedback
// ─────────────────────────────────────────────────────────────────────────────

export function formatVoiceFeedback(result: VoiceCommandParseResult): string {
  if (result.action === "unknown") {
    return "No reconoci ese comando. Intenta decir: JARVIS, mostrar ventas. O: JARVIS, publicar producto.";
  }

  const parts: string[] = [`Entendido. ${result.intent}`];

  if (result.entities.productName) {
    parts.push(`Producto: ${result.entities.productName}.`);
  }
  if (result.entities.price) {
    parts.push(`Precio: ${result.entities.currency === "USD" ? "USD" : "$"}${result.entities.price}.`);
  }
  if (result.entities.clientName) {
    parts.push(`Cliente: ${result.entities.clientName}.`);
  }
  if (result.entities.dateRange) {
    const ranges: Record<string, string> = {
      today: "de hoy",
      yesterday: "de ayer",
      week: "de la semana",
      month: "del mes",
      year: "del año",
    };
    parts.push(`${ranges[result.entities.dateRange] ?? ""}.`);
  }

  return parts.join(" ").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export wake-word utilities for convenience
// ─────────────────────────────────────────────────────────────────────────────
export { hasWakeWord } from "./wake-word";
