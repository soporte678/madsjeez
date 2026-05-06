"use client";

import { useEffect } from "react";

type ThemeTone = "light" | "soft" | "dark";

const THEME_KEY = "madsjeez-theme-tone";

export default function ThemeToneInit() {
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeTone | null;
    const tone: ThemeTone = saved === "soft" || saved === "dark" ? saved : "light";
    document.documentElement.setAttribute("data-theme", tone);
  }, []);

  return null;
}
