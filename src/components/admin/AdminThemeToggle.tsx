"use client"

import { Moon, Sun, Sunset } from "lucide-react"
import type { AdminTheme } from "@/lib/admin-theme"
import { ADMIN_THEME_LABELS } from "@/lib/admin-theme"

const OPTIONS: { id: AdminTheme; icon: typeof Sun }[] = [
  { id: "light", icon: Sun },
  { id: "soft", icon: Sunset },
  { id: "dark", icon: Moon },
]

interface AdminThemeToggleProps {
  theme: AdminTheme
  onChange: (theme: AdminTheme) => void
}

export function AdminThemeToggle({ theme, onChange }: AdminThemeToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg border p-0.5"
      style={{
        borderColor: "var(--admin-border)",
        backgroundColor: "var(--admin-surface-raised)",
      }}
      role="group"
      aria-label="Tema del panel admin"
    >
      {OPTIONS.map(({ id, icon: Icon }) => {
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={ADMIN_THEME_LABELS[id]}
            aria-pressed={active}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors"
            style={
              active
                ? {
                    backgroundColor: "var(--admin-accent)",
                    color: "var(--admin-accent-fg)",
                  }
                : { color: "var(--admin-text-muted)" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{ADMIN_THEME_LABELS[id]}</span>
          </button>
        )
      })}
    </div>
  )
}
