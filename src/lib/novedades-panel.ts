export const NOVEDADES_PANEL_OPEN_EVENT = "madsjeez:open-novedades-panel";

/** El usuario ya vio y cerró el panel de novedades en esta sesión. */
export const NOVEDADES_SESSION_SEEN_KEY = "madsjeez_novedades_shown";

export function openNovedadesPanel() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOVEDADES_PANEL_OPEN_EVENT));
}

export function hasSeenNovedadesPanelThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NOVEDADES_SESSION_SEEN_KEY) === "1";
}

export function markNovedadesPanelSeen() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NOVEDADES_SESSION_SEEN_KEY, "1");
}
