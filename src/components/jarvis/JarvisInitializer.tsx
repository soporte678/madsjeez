"use client";

/**
 * JarvisInitializer
 * Se monta en el layout principal y ejecuta la inicialización automática
 * de JARVIS al cargar la aplicación. No renderiza nada visual.
 *
 * Flujo:
 * 1. Verifica si JARVIS está inicializado (GET /api/jarvis/init)
 * 2. Si no está listo, ejecuta inicialización (POST /api/jarvis/init)
 * 3. Reporta estado por consola
 *
 * @module components/jarvis/JarvisInitializer
 */

import { useEffect, useRef } from "react";

interface InitStatus {
  status: "ready" | "pending" | "error";
  tables: Record<string, boolean>;
  message: string;
}

interface InitResult {
  success: boolean;
  steps: Array<{
    step: string;
    status: "ok" | "error" | "skipped";
    message: string;
  }>;
  errors: string[];
  summary?: {
    tablesCreated: number;
    tablesSkipped: number;
    configRows: number;
    taskRows: number;
  };
}

/**
 * Check JARVIS initialization status
 */
async function checkStatus(): Promise<InitStatus | null> {
  try {
    const response = await fetch("/api/jarvis/init", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Run JARVIS initialization
 */
async function runInitialization(): Promise<InitResult | null> {
  try {
    const response = await fetch("/api/jarvis/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * JarvisInitializer component
 * Runs once on mount, invisible to the user
 */
export function JarvisInitializer(): null {
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (initialized.current) return;
    initialized.current = true;

    // Wait a bit for the page to fully load
    const timer = setTimeout(async () => {
      console.log("[JARVIS] Checking initialization status...");

      const status = await checkStatus();

      if (!status) {
        console.warn("[JARVIS] Could not check status - JARVIS may not be available");
        return;
      }

      if (status.status === "ready") {
        console.log("[JARVIS] ✅ Fully initialized and ready");
        console.log("[JARVIS] Tables:", status.tables);
        return;
      }

      if (status.status === "pending") {
        console.log("[JARVIS] ⏳ Not fully initialized. Running auto-init...");

        const result = await runInitialization();

        if (result?.success) {
          console.log("[JARVIS] ✅ Initialization complete!");
          if (result.summary) {
            console.log(`[JARVIS]   Tables created: ${result.summary.tablesCreated}`);
            console.log(`[JARVIS]   Tables skipped: ${result.summary.tablesSkipped}`);
            console.log(`[JARVIS]   Config rows: ${result.summary.configRows}`);
            console.log(`[JARVIS]   Task rows: ${result.summary.taskRows}`);
          }
          if (result.steps) {
            result.steps.forEach((step) => {
              const icon = step.status === "ok" ? "✅" : step.status === "skipped" ? "⏭️" : "❌";
              console.log(`[JARVIS]   ${icon} ${step.step}: ${step.message}`);
            });
          }
        } else {
          console.error("[JARVIS] ❌ Initialization failed");
          if (result?.errors?.length) {
            result.errors.forEach((err) => console.error(`[JARVIS]   Error: ${err}`));
          }
          // Some tables may need manual SQL execution in Supabase dashboard
          console.log("[JARVIS] 💡 Tip: If tables could not be created, you may need to run the SQL manually in your Supabase SQL Editor");
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export default JarvisInitializer;
