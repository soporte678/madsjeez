"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

type ThemeTone = "light" | "soft" | "dark";

const THEME_KEY = "madsjeez-theme-tone";

export default function ThemeToneSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [themeTone, setThemeTone] = useState<ThemeTone>("light");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeTone | null;
    const tone: ThemeTone = saved === "soft" || saved === "dark" ? saved : "light";
    setThemeTone(tone);
    document.documentElement.setAttribute("data-theme", tone);
  }, []);

  const applyThemeTone = (tone: ThemeTone) => {
    setThemeTone(tone);
    localStorage.setItem(THEME_KEY, tone);
    document.documentElement.setAttribute("data-theme", tone);
  };

  return (
    <label className={`inline-flex items-center ${compact ? "gap-1.5" : "gap-2"} text-xs`}>
      <Palette size={compact ? 13 : 14} />
      <select
        value={themeTone}
        onChange={(e) => applyThemeTone(e.target.value as ThemeTone)}
        className={`border rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          compact ? "px-1.5 py-1 text-[11px]" : "px-2 py-1 text-xs"
        } bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]`}
      >
        <option value="light">Claro</option>
        <option value="soft">Suave</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
