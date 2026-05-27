/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                 JARVIS CONVERSATION MEMORY SYSTEM                        ║
 * ║                                                                          ║
 * ║  Memoria de conversacion persistente para el orquestador JARVIS.        ║
 * ║  Almacena el historial de mensajes (user, assistant, tool) con metadatos ║
 * ║  para proporcionar contexto en conversaciones multi-turno.              ║
 * ║                                                                          ║
 * ║  Responsabilidades:                                                      ║
 * ║  - Almacenar mensajes de conversacion (addMessage)                      ║
 * ║  - Recuperar mensajes recientes (getRecentMessages)                     ║
 * ║  - Generar resumen de contexto (getConversationContext)                 ║
 * ║  - Limpiar historial (clearHistory)                                     ║
 * ║  - Limitar tamano para no exceder context window del LLM                ║
 * ║                                                                          ║
 * ║  NOTA: Implementacion actual usa Map en memoria.                        ║
 * ║  Para produccion, migrar a Supabase (tabla jarvis_conversations).       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module lib/jarvis/orchestrator/conversation-memory
 */

import { logSecurityEvent } from "../governance/auditor";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Representa un mensaje en la conversacion.
 * Puede ser del usuario, del asistente, o resultado de una herramienta.
 */
export interface ConversationMessage {
  /** ID unico del mensaje */
  id: string;
  /** Rol del emisor */
  role: "user" | "assistant" | "tool";
  /** Contenido del mensaje */
  content: string;
  /** Llamadas a herramientas hechas por el asistente */
  toolCalls?: ToolCallReference[];
  /** Resultados de herramientas ejecutadas */
  toolResults?: ToolResultReference[];
  /** Timestamp ISO 8601 */
  timestamp: string;
  /** ID del usuario (para conversaciones multi-usuario) */
  userId?: string;
  /** Token estimados en este mensaje */
  estimatedTokens?: number;
  /** Metadata adicional */
  metadata?: Record<string, unknown>;
}

/** Referencia a una llamada de herramienta almacenada en un mensaje */
interface ToolCallReference {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Referencia a un resultado de herramienta almacenado en un mensaje */
interface ToolResultReference {
  toolCallId: string;
  toolName: string;
  success: boolean;
  content: string;
}

/** Opciones de configuracion para la memoria */
interface MemoryConfig {
  /** Maximo de mensajes a retener por usuario */
  maxMessagesPerUser: number;
  /** Maximo de tokens estimados en el contexto */
  maxContextTokens: number;
  /** Horas de inactividad antes de expirar una conversacion */
  conversationExpiryHours: number;
  /** Si se debe hacer trim inteligente del contexto */
  enableSmartTrimming: boolean;
}

/** Estado de una conversacion activa */
interface ConversationState {
  messages: ConversationMessage[];
  lastActivityAt: string;
  totalMessages: number;
  metadata: {
    userName?: string;
    userRole?: string;
    conversationStart: string;
    topicsDiscussed: string[];
    toolsUsed: string[];
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Configuracion por defecto de la memoria */
const DEFAULT_CONFIG: MemoryConfig = {
  maxMessagesPerUser: 50,
  maxContextTokens: 6000,
  conversationExpiryHours: 24,
  enableSmartTrimming: true,
};

/** Configuracion activa (puede ser sobreescrita) */
let activeConfig: MemoryConfig = { ...DEFAULT_CONFIG };

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/**
 * Almacenamiento en memoria de conversaciones.
 * Key: userId, Value: estado de la conversacion.
 *
 * NOTA: En produccion, esto debe migrarse a Supabase.
 * CREATE TABLE jarvis_conversations (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id TEXT NOT NULL,
 *   role TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
 *   content TEXT NOT NULL,
 *   tool_calls JSONB,
 *   tool_results JSONB,
 *   estimated_tokens INTEGER DEFAULT 0,
 *   metadata JSONB,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE INDEX idx_jarvis_conv_user ON jarvis_conversations(user_id, created_at);
 */
const conversationStore = new Map<string, ConversationState>();

// ============================================================================
// CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Actualiza la configuracion de la memoria.
 *
 * @param config - Partial config con los valores a actualizar
 */
export function configureMemory(config: Partial<MemoryConfig>): void {
  activeConfig = { ...activeConfig, ...config };
}

/**
 * Obtiene la configuracion actual.
 */
export function getMemoryConfig(): MemoryConfig {
  return { ...activeConfig };
}

/**
 * Resetea la configuracion a los valores por defecto.
 */
export function resetMemoryConfig(): void {
  activeConfig = { ...DEFAULT_CONFIG };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Agrega un mensaje al historial de conversacion del usuario.
 * Si el historial excede el limite, se hace trim inteligente.
 *
 * @param message - Mensaje a almacenar
 * @throws Error si el mensaje es invalido
 *
 * @example
 * ```typescript
 * await addMessage({
 *   id: "msg_001",
 *   role: "user",
 *   content: "Cuantos productos tenemos?",
 *   timestamp: new Date().toISOString(),
 *   userId: "user_123",
 * });
 * ```
 */
export async function addMessage(message: ConversationMessage): Promise<void> {
  // Validacion
  if (!message.id || !message.role || !message.content) {
    throw new Error("Mensaje invalido: se requiere id, role y content");
  }

  if (!message.userId) {
    // Mensajes sin userId van a una conversacion anonima
    message.userId = "anonymous";
  }

  // Estimar tokens si no estan calculados
  if (!message.estimatedTokens) {
    message.estimatedTokens = estimateTokens(message.content);
  }

  // Obtener o crear estado de conversacion
  const state = getOrCreateState(message.userId);

  // Agregar mensaje
  state.messages.push(message);
  state.lastActivityAt = message.timestamp;
  state.totalMessages += 1;

  // Actualizar metadata
  if (message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0) {
    for (const tc of message.toolCalls) {
      if (!state.metadata.toolsUsed.includes(tc.name)) {
        state.metadata.toolsUsed.push(tc.name);
      }
    }
  }

  // Smart trimming si se excede el limite
  if (activeConfig.enableSmartTrimming) {
    trimConversationIfNeeded(state);
  }

  // Actualizar store
  conversationStore.set(message.userId, state);

  // Log (no bloqueante)
  if (message.role === "user") {
    logSecurityEvent({
      service: "orchestrator",
      operation: "conversationMessage",
      target: message.userId,
      status: "success",
      timestamp: message.timestamp,
      details: {
        role: message.role,
        messageId: message.id,
        hasToolCalls: Boolean(message.toolCalls?.length),
      },
    }).catch(() => { /* non-blocking */ });
  }
}

/**
 * Recupera los mensajes recientes de un usuario.
 * Ordenados de mas antiguo a mas reciente para el prompt del LLM.
 *
 * @param userId - ID del usuario
 * @param limit - Maximo de mensajes a retornar (default: 20)
 * @returns Array de mensajes ordenados cronologicamente
 */
export async function getRecentMessages(
  userId: string,
  limit: number = 20
): Promise<ConversationMessage[]> {
  if (!userId) return [];

  const state = conversationStore.get(userId);
  if (!state) return [];

  // Verificar expiracion
  if (isConversationExpired(state)) {
    conversationStore.delete(userId);
    return [];
  }

  // Retornar los ultimos `limit` mensajes ordenados cronologicamente
  const sorted = [...state.messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted.slice(-limit);
}

/**
 * Genera un resumen de contexto para incluir en el system prompt del LLM.
 * Incluye temas discutidos, herramientas usadas, y estadisticas.
 *
 * @param userId - ID del usuario
 * @returns String con el contexto formateado, o vacio si no hay historial
 */
export async function getConversationContext(userId: string): Promise<string> {
  if (!userId) return "";

  const state = conversationStore.get(userId);
  if (!state || state.messages.length === 0) return "";

  const recentMessages = state.messages.slice(-6);
  const msgSummaries = recentMessages.map((m) => {
    const preview = m.content.length > 80 ? m.content.slice(0, 80) + "..." : m.content;
    return `${m.role}: ${preview}`;
  }).join("\n");

  const topics = state.metadata.topicsDiscussed.slice(-5);
  const tools = state.metadata.toolsUsed;

  let context = "--- CONTEXTO DE CONVERSACION ---\n";

  if (state.metadata.userName) {
    context += `Usuario: ${state.metadata.userName}\n`;
  }

  context += `Mensajes en esta sesion: ${state.totalMessages}\n`;
  context += `Inicio: ${new Date(state.metadata.conversationStart).toLocaleString("es-AR")}\n`;

  if (topics.length > 0) {
    context += `Temas discutidos: ${topics.join(", ")}\n`;
  }

  if (tools.length > 0) {
    context += `Herramientas usadas: ${tools.join(", ")}\n`;
  }

  context += `\n--- ULTIMOS MENSAJES ---\n${msgSummaries}\n--- FIN CONTEXTO ---`;

  return context;
}

/**
 * Limpia el historial de conversacion de un usuario.
 *
 * @param userId - ID del usuario
 */
export async function clearHistory(userId: string): Promise<void> {
  if (!userId) return;

  conversationStore.delete(userId);

  await logSecurityEvent({
    service: "orchestrator",
    operation: "clearConversation",
    target: userId,
    status: "success",
    timestamp: new Date().toISOString(),
    details: { userId },
  }).catch(() => { /* non-blocking */ });
}

/**
 * Limpia todas las conversaciones expiradas del store.
 * Util para ejecutar periodicamente (cron).
 */
export function cleanupExpiredConversations(): number {
  const now = Date.now();
  const expiryMs = activeConfig.conversationExpiryHours * 60 * 60 * 1000;
  let cleaned = 0;

  for (const [userId, state] of conversationStore.entries()) {
    const lastActivity = new Date(state.lastActivityAt).getTime();
    if (now - lastActivity > expiryMs) {
      conversationStore.delete(userId);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Obtiene estadisticas de la memoria.
 * Util para monitoreo y debugging.
 */
export function getMemoryStats(): {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  oldestConversation: string | null;
} {
  let totalMessages = 0;
  let oldest: string | null = null;

  for (const [, state] of conversationStore.entries()) {
    totalMessages += state.messages.length;
    if (!oldest || state.metadata.conversationStart < oldest) {
      oldest = state.metadata.conversationStart;
    }
  }

  const totalConversations = conversationStore.size;

  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: totalConversations > 0
      ? Math.round(totalMessages / totalConversations)
      : 0,
    oldestConversation: oldest,
  };
}

/**
 * Obtiene o crea el estado de conversacion para un usuario.
 */
function getOrCreateState(userId: string): ConversationState {
  const existing = conversationStore.get(userId);
  if (existing) return existing;

  const newState: ConversationState = {
    messages: [],
    lastActivityAt: new Date().toISOString(),
    totalMessages: 0,
    metadata: {
      conversationStart: new Date().toISOString(),
      topicsDiscussed: [],
      toolsUsed: [],
    },
  };

  conversationStore.set(userId, newState);
  return newState;
}

/**
 * Verifica si una conversacion ha expirado por inactividad.
 */
function isConversationExpired(state: ConversationState): boolean {
  const expiryMs = activeConfig.conversationExpiryHours * 60 * 60 * 1000;
  const lastActivity = new Date(state.lastActivityAt).getTime();
  return Date.now() - lastActivity > expiryMs;
}

/**
 * Hace trim inteligente de la conversacion si excede los limites.
 * Mantiene siempre el primer mensaje (system/context) y los mas recientes.
 * Los mensajes intermedios se resumen.
 */
function trimConversationIfNeeded(state: ConversationState): void {
  const { maxMessagesPerUser, maxContextTokens } = activeConfig;

  // Trim por cantidad de mensajes
  if (state.messages.length > maxMessagesPerUser) {
    // Mantener primer mensaje + los N mas recientes
    const keepCount = Math.floor(maxMessagesPerUser * 0.8);
    const firstMsg = state.messages[0];
    const recentMsgs = state.messages.slice(-keepCount);

    state.messages = firstMsg ? [firstMsg, ...recentMsgs] : recentMsgs;
  }

  // Trim por tokens estimados
  const totalTokens = state.messages.reduce(
    (sum, m) => sum + (m.estimatedTokens ?? estimateTokens(m.content)),
    0
  );

  if (totalTokens > maxContextTokens) {
    // Estrategia: eliminar mensajes del medio, mantener inicio y fin
    while (
      state.messages.length > 4 &&
      state.messages.reduce((sum, m) => sum + (m.estimatedTokens ?? estimateTokens(m.content)), 0) > maxContextTokens
    ) {
      // Eliminar el mensaje en la posicion 2 (mantener 0, 1 y los ultimos)
      state.messages.splice(2, 1);
    }
  }
}

/**
 * Estima la cantidad de tokens en un texto.
 * Regla aproximada: ~4 caracteres por token para espanol/ingles.
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Convierte mensajes de conversacion al formato que espera el LLM client.
 *
 * @param messages - Mensajes almacenados en memoria
 * @returns Mensajes formateados para el LLM client
 */
export function formatMessagesForLLM(
  messages: ConversationMessage[]
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

/**
 * Construye un mensaje de sistema personalizado con contexto de usuario.
 *
 * @param options - Opciones para el system prompt
 * @returns System prompt completo
 */
export function buildSystemPrompt(options: {
  userRole?: string;
  userName?: string;
  conversationContext?: string;
  toolInstructions?: string;
  customInstructions?: string;
}): string {
  const parts: string[] = [];

  // Base identity
  parts.push(
    "Eres JARVIS (Just A Rather Very Intelligent System), el asistente AI exclusivo de MadsJeez — el marketplace mas grande de Argentina."
  );

  // Capacidades
  parts.push(
    "Tu proposito es ayudar a vendedores, compradores y administradores con: " +
    "gestion de productos y ventas, analisis de datos del marketplace, " +
    "monitoreo de infraestructura (Railway, Supabase), gestion de codigo (GitHub), " +
    "y automatizacion de tareas operativas."
  );

  // Contexto de conversacion
  if (options.conversationContext) {
    parts.push(options.conversationContext);
  }

  // Instrucciones de herramientas
  if (options.toolInstructions) {
    parts.push(options.toolInstructions);
  }

  // Instrucciones personalizadas
  if (options.customInstructions) {
    parts.push(options.customInstructions);
  }

  // Reglas de seguridad siempre al final
  parts.push(
    "REGLAS DE SEGURIDAD:\n" +
    "- NUNCA reveles tokens, claves API, contrasenas ni credenciales.\n" +
    "- NUNCA ejecutes operaciones destructivas sin confirmacion humana.\n" +
    "- Si no sabes algo, dilo honestamente. No inventes datos.\n" +
    "- Responde en espanol argentino (che, boludo, piola son bienvenidos cuando apropiado).\n" +
    "- Manten respuestas concisas y directas. Evita paja innecesaria."
  );

  return parts.join("\n\n");
}
