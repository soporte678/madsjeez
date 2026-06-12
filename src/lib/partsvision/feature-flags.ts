/**
 * Feature flags de PartsVision (y genéricos). Se leen de la tabla `feature_flags`
 * con cache en memoria (30s) para no martillar la DB. Todo PartsVision arranca
 * apagado (despliegue gradual): se prende por flag cuando hay contenido real.
 */

import { supabaseService } from "@/lib/supabase/service";

type FlagCache = { values: Record<string, boolean>; at: number };
let cache: FlagCache | null = null;
const TTL_MS = 30_000;

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.values;
  try {
    const { data } = await supabaseService.from("feature_flags").select("key, enabled");
    const values: Record<string, boolean> = {};
    for (const r of data ?? []) values[(r as { key: string }).key] = !!(r as { enabled: boolean }).enabled;
    cache = { values, at: Date.now() };
    return values;
  } catch {
    return cache?.values ?? {};
  }
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] === true;
}

/** Conveniencia: ¿está PartsVision visible al público? */
export async function isPartsVisionEnabled(): Promise<boolean> {
  return isFeatureEnabled("partsvision_enabled");
}
