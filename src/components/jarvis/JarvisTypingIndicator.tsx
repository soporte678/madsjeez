"use client";

import React from "react";
import { Brain } from "lucide-react";

// ============================================================
// JarvisTypingIndicator — "JARVIS está pensando..."
// ============================================================

export interface JarvisTypingIndicatorProps {
  text?: string;
}

export const JarvisTypingIndicator: React.FC<JarvisTypingIndicatorProps> = ({
  text = "JARVIS está pensando",
}) => {
  return (
    <div
      className="flex items-end gap-3 px-2 py-3"
      role="status"
      aria-live="polite"
      aria-label="JARVIS está escribiendo una respuesta"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EB5204]/20 border border-[#EB5204]/30 flex items-center justify-center">
        <Brain className="w-4 h-4 text-[#EB5204]" aria-hidden="true" />
      </div>

      {/* Burbuja con puntos animados */}
      <div className="bg-[#2d2d44] border border-[#3d3d5c]/50 rounded-2xl rounded-bl-md px-5 py-3.5 max-w-[80%]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">{text}</span>
          <div className="flex items-center gap-0.5" aria-hidden="true">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#EB5204] animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "900ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#EB5204] animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "900ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#EB5204] animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "900ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JarvisTypingIndicator;
