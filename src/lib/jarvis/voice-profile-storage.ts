import type { AtlasVoiceProfile } from "@/lib/jarvis/atlas-speech-synthesis";

export type { AtlasVoiceProfile };

const STORAGE_KEY = "atlas_voice_profile";

export function getStoredVoiceProfile(): AtlasVoiceProfile {
  if (typeof window === "undefined") return "atlas";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "nova" ? "nova" : "atlas";
}

export function storeVoiceProfile(profile: AtlasVoiceProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, profile);
}

export const ATLAS_VOICE_OPEN_EVENT = "atlas-voice-open";

export function openAtlasVoiceWidget(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ATLAS_VOICE_OPEN_EVENT));
}
