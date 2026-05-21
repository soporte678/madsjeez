export type AdminTheme = "dark" | "soft" | "light"

export const ADMIN_THEME_STORAGE_KEY = "madsjeez-admin-theme"

export const ADMIN_THEME_LABELS: Record<AdminTheme, string> = {
  dark: "Oscuro",
  soft: "Intermedio",
  light: "Claro",
}

export function isAdminTheme(value: string | null | undefined): value is AdminTheme {
  return value === "dark" || value === "soft" || value === "light"
}

export function getStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "dark"
  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (isAdminTheme(stored)) return stored
  } catch {
    /* ignore */
  }
  return "dark"
}

export function storeAdminTheme(theme: AdminTheme): void {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
