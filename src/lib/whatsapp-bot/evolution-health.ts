import { getWhatsappBotEnv } from "./config";
import { buildEvolutionRequestUrl, evolutionJson, logEvolutionSafe } from "./providers/evolution-client";

export type EvolutionHealthResult = {
  ok: boolean;
  error?: string;
  hint?: string;
  checkedUrl?: string;
};

/**
 * Verifica que EVOLUTION_API_URL apunte al servidor Evolution (no a Madsjeez).
 */
export async function checkEvolutionApiHealth(): Promise<EvolutionHealthResult> {
  const { evolutionUrl, evolutionKey, evolutionConfigured } = getWhatsappBotEnv();
  if (!evolutionConfigured) {
    return {
      ok: false,
      error: "evolution_not_configured",
      hint: "Definí EVOLUTION_API_URL y EVOLUTION_API_KEY en Railway o .env.local",
    };
  }

  const checkedUrl = buildEvolutionRequestUrl("/instance/fetchInstances");

  // No debe ser la misma app Next.js
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "";
  if (appBase && evolutionUrl.replace(/\/$/, "") === appBase.replace(/\/$/, "")) {
    return {
      ok: false,
      error: "evolution_url_is_app_url",
      hint:
        "EVOLUTION_API_URL no puede ser la URL de Madsjeez. Debe ser la URL pública de tu servidor Evolution API (otro host/puerto).",
      checkedUrl,
    };
  }

  try {
    await evolutionJson<unknown>("/instance/fetchInstances", { method: "GET" });
    return { ok: true, checkedUrl };
  } catch (e) {
    const err = e as Error & { status?: number; url?: string };
    const status = err.status;
    logEvolutionSafe("health_check_failed", { status, url: err.url });

    if (status === 404) {
      return {
        ok: false,
        error: "evolution_404",
        hint:
          "Evolution respondió 404 en /instance/fetchInstances. Revisá que EVOLUTION_API_URL sea la URL base del servidor Evolution (ej. https://evo.tudominio.com:8080) y, si tu proxy usa prefijo, EVOLUTION_API_BASE_PATH (ej. /api). No uses la URL de www.madsjeez.com.ar.",
        checkedUrl: err.url ?? checkedUrl,
      };
    }
    if (status === 401 || status === 403) {
      return {
        ok: false,
        error: "evolution_auth_failed",
        hint: "EVOLUTION_API_KEY no coincide con AUTHENTICATION_API_KEY del servidor Evolution.",
        checkedUrl: err.url ?? checkedUrl,
      };
    }

    return {
      ok: false,
      error: err.message || "evolution_unreachable",
      hint: "No se pudo contactar Evolution. ¿Está el contenedor/servicio corriendo y accesible desde Railway?",
      checkedUrl: err.url ?? checkedUrl,
    };
  }
}
