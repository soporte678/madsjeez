/**
 * TTS del widget web — voces premium tipo asistente sci-fi (Atlas / Nova).
 * No clona voces de personajes; usa voces neurales del sistema o en línea del navegador.
 */

export type AtlasVoiceProfile = "atlas" | "nova";

/** Preferencias: masculino calmado (Atlas/Jarvis) y femenino fluido (Nova/Friday). */
const VOICE_RANK_ATLAS = [
  "microsoft raul online",
  "microsoft pablo online",
  "microsoft jorge online",
  "google español",
  "microsoft david",
  "microsoft pablo",
  "daniel",
  "male",
  "es-mx",
  "es-ar",
  "es-es",
];

const VOICE_RANK_NOVA = [
  "microsoft elena online",
  "microsoft sabina online",
  "microsoft helena online",
  "google español de estados unidos",
  "microsoft zira",
  "microsoft sabina",
  "female",
  "es-mx",
  "es-ar",
];

function scoreVoice(name: string, rank: string[]): number {
  const n = name.toLowerCase();
  for (let i = 0; i < rank.length; i++) {
    if (n.includes(rank[i])) return rank.length - i;
  }
  return 0;
}

export function pickBrowserVoice(
  voices: SpeechSynthesisVoice[],
  profile: AtlasVoiceProfile
): SpeechSynthesisVoice | undefined {
  const rank = profile === "nova" ? VOICE_RANK_NOVA : VOICE_RANK_ATLAS;
  const es = voices.filter((v) => /es(-|_)/i.test(v.lang));
  const pool = es.length ? es : voices;
  return [...pool].sort((a, b) => scoreVoice(b.name, rank) - scoreVoice(a.name, rank))[0];
}

export function atlasSpeechSettings(profile: AtlasVoiceProfile): {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
} {
  if (profile === "nova") {
    return { lang: "es-AR", rate: 0.96, pitch: 1.06, volume: 1 };
  }
  return { lang: "es-AR", rate: 0.9, pitch: 0.88, volume: 1 };
}

let voicesReady: Promise<void> | null = null;

export function ensureBrowserVoices(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  if (window.speechSynthesis.getVoices().length > 0) {
    return Promise.resolve();
  }
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const done = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", done);
        resolve();
      };
      window.speechSynthesis.addEventListener("voiceschanged", done);
      setTimeout(done, 800);
    });
  }
  return voicesReady;
}

export async function speakAtlasBrowser(
  text: string,
  profile: AtlasVoiceProfile = "atlas"
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  await ensureBrowserVoices();
  window.speechSynthesis.cancel();

  const clean = text.replace(/\s+/g, " ").trim().slice(0, 600);
  if (!clean) return;

  const u = new SpeechSynthesisUtterance(clean);
  const settings = atlasSpeechSettings(profile);
  u.lang = settings.lang;
  u.rate = settings.rate;
  u.pitch = settings.pitch;
  u.volume = settings.volume;

  const voice = pickBrowserVoice(window.speechSynthesis.getVoices(), profile);
  if (voice) u.voice = voice;

  return new Promise((resolve) => {
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}
