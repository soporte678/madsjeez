"use client";

// ============================================================
// JARVIS Chat Components — Barrel Export
// ============================================================

export { JarvisChatWidget } from "./JarvisChatWidget";
export { JarvisMessage } from "./JarvisMessage";
export { JarvisTypingIndicator } from "./JarvisTypingIndicator";
export { JarvisQuickActions } from "./JarvisQuickActions";
export { JarvisInitializer } from "./JarvisInitializer";

// Re-exportar tipos útiles para consumidores
export type {
  JarvisMessageProps,
} from "./JarvisMessage";

export type {
  JarvisTypingIndicatorProps,
} from "./JarvisTypingIndicator";

export type {
  JarvisQuickActionsProps,
} from "./JarvisQuickActions";

// Default export del widget principal
export { JarvisChatWidget as default } from "./JarvisChatWidget";
