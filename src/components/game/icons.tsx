"use client";

import type { ResourceKey, BuildingType } from "./game-data";

export function CornerMarks() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-cyan-400/50" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-cyan-400/50" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-cyan-400/50" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-cyan-400/50" />
    </>
  );
}

export function AvatarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <path d="M32 4L40 22L58 30L40 38L32 56L24 38L6 30L24 22L32 4Z" fill="url(#ag)" stroke="#67E8F9" strokeWidth="2" />
      <defs><linearGradient id="ag" x1="6" y1="4" x2="58" y2="56"><stop stopColor="#74F0FF"/><stop offset="1" stopColor="#0B88FF"/></linearGradient></defs>
    </svg>
  );
}

export function ExitIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17L15 12L10 7"/><path d="M15 12H3"/><path d="M8 4H19V20H8"/></svg>;
}

export function ChevronRight() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18L15 12L9 6"/></svg>;
}

export function UpArrow() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15L12 9L6 15"/></svg>;
}

export function LockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7A5 5 0 0117 7v4"/></svg>;
}

export function PlanetIconSmall() {
  return <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#67E8F9" strokeWidth="2.5"/><path d="M5 19C12 24 23 24 30 13" stroke="#67E8F9" strokeWidth="2.5"/></svg>;
}

export function ResourceIcon({ type }: { type: ResourceKey }) {
  if (type === "metal") return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
      <path d="M14 24L32 14L50 24L32 34L14 24Z" fill="#9DEBFF"/><path d="M14 24V38L32 48V34L14 24Z" fill="#4BA3D8"/><path d="M50 24V38L32 48V34L50 24Z" fill="#1E5F9A"/><path d="M14 24L32 14L50 24V38L32 48L14 38V24Z" stroke="#8CEAFF" strokeWidth="2"/>
    </svg>
  );
  if (type === "plasma") return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="20" fill="#5111A8" stroke="#B56DFF" strokeWidth="2"/><circle cx="32" cy="32" r="10" fill="#9F49FF"/><circle cx="32" cy="32" r="5" fill="#F4D4FF"/><path d="M32 10V18M32 46V54M10 32H18M46 32H54" stroke="#C783FF" strokeWidth="3"/>
    </svg>
  );
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
      <rect x="18" y="16" width="28" height="32" rx="5" fill="#F6A800"/><rect x="23" y="22" width="18" height="20" rx="3" fill="#FFD166"/><path d="M27 28H37M27 34H33" stroke="#513400" strokeWidth="3"/><rect x="14" y="24" width="6" height="6" rx="1" fill="#B86A00"/><rect x="44" y="34" width="6" height="6" rx="1" fill="#B86A00"/><rect x="18" y="16" width="28" height="32" rx="5" stroke="#FFE082" strokeWidth="2"/>
    </svg>
  );
}

export function ResourceIconSmall({ type }: { type: ResourceKey }) {
  const s = 14;
  if (type === "metal") return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none"><path d="M14 24L32 14L50 24L32 34L14 24Z" fill="#9DEBFF"/><path d="M14 24V38L32 48V34L14 24Z" fill="#4BA3D8"/><path d="M50 24V38L32 48V34L50 24Z" fill="#1E5F9A"/></svg>
  );
  if (type === "plasma") return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="20" fill="#5111A8" stroke="#B56DFF" strokeWidth="2"/><circle cx="32" cy="32" r="10" fill="#9F49FF"/></svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none"><rect x="18" y="16" width="28" height="32" rx="5" fill="#F6A800"/><rect x="23" y="22" width="18" height="20" rx="3" fill="#FFD166"/></svg>
  );
}

export function BuildingIcon({ type, large }: { type: BuildingType; large?: boolean }) {
  const sz = large ? 100 : 60;
  const c = "#00D5FF";
  const d = "#1F2630";
  switch (type) {
    case "metal_extractor":
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="98" rx="40" ry="10" fill={c} opacity="0.12"/><path d="M24 84H96L84 56H36L24 84Z" fill={d} stroke={c} strokeWidth="1.5"/><path d="M34 58H86V84H34V58Z" fill="#3D3D3D"/><path d="M43 48H53V58H43V48Z" fill="#FF9138"/><path d="M67 45H77V58H67V45Z" fill="#FF9138"/><path d="M44 68H76" stroke="#747474" strokeWidth="4"/></svg>;
    case "plasma_refinery":
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="98" rx="40" ry="10" fill={c} opacity="0.15"/><path d="M30 86H90V58H30V86Z" fill="#162D54" stroke="#0FD7FF"/><rect x="50" y="28" width="20" height="58" rx="8" fill="#6D35E8" stroke="#D88BFF"/><circle cx="60" cy="34" r="11" fill={c} opacity="0.5"/></svg>;
    case "warehouse":
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="98" rx="40" ry="10" fill={c} opacity="0.10"/><rect x="28" y="52" width="64" height="38" rx="6" fill="#26374D" stroke="#7E9DBE"/><path d="M34 46H86V56H34V46Z" fill="#A6B5C7"/><path d="M43 68H77" stroke="#0FD7FF" strokeWidth="3"/></svg>;
    case "energy_generator":
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="98" rx="40" ry="10" fill="#8B5CFF" opacity="0.15"/><path d="M34 86H86V54C86 38 74 28 60 28C46 28 34 38 34 54V86Z" fill="#4736B9" stroke={c}/><path d="M60 20V42" stroke="#9BB6FF" strokeWidth="4"/><circle cx="60" cy="48" r="11" fill="#BDB9FF" opacity="0.6"/></svg>;
    case "control_center":
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><ellipse cx="60" cy="98" rx="40" ry="10" fill={c} opacity="0.10"/><rect x="36" y="44" width="48" height="44" rx="4" fill="#2D3F55" stroke="#83BFFF"/><path d="M46 55H56V66H46V55ZM64 55H74V66H64V55ZM46 72H56V83H46V72ZM64 72H74V83H64V72Z" fill="#74F0FF"/><path d="M60 44V25" stroke="#9FB7D2" strokeWidth="4"/><circle cx="60" cy="24" r="6" fill="#FF4159"/></svg>;
    default:
      return <svg width={sz} height={sz} viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="30" stroke="#2DD9FF" strokeOpacity="0.25"/><path d="M60 42V78M42 60H78" stroke="#8CEAFF" strokeWidth="4" strokeOpacity="0.5"/></svg>;
  }
}

export function NavIcon({ type }: { type: "ship" | "research" | "fleet" | "mission" }) {
  if (type === "ship") return <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><path d="M32 6L46 52L32 43L18 52L32 6Z" fill="#0B88FF" stroke="#6FEAFF" strokeWidth="2"/><path d="M32 18V43" stroke="#C6FAFF" strokeWidth="3"/></svg>;
  if (type === "research") return <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><path d="M25 10H39M29 10V26L16 50C14 54 17 58 22 58H42C47 58 50 54 48 50L35 26V10" stroke="#4EE8FF" strokeWidth="4"/><path d="M23 42H41" stroke="#8B5CFF" strokeWidth="5"/></svg>;
  if (type === "fleet") return <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><path d="M32 10L41 48L32 42L23 48L32 10Z" fill="#4C6D97"/><path d="M16 26L23 52L16 48L9 52L16 26Z" fill="#334760"/><path d="M48 26L55 52L48 48L41 52L48 26Z" fill="#334760"/></svg>;
  return <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="18" stroke="#6D87AD" strokeWidth="3"/><path d="M32 10V18M32 46V54M10 32H18M46 32H54" stroke="#6D87AD" strokeWidth="3"/><circle cx="32" cy="32" r="4" fill="#6D87AD"/></svg>;
}

export function InfoIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    map: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round"><path d="M1 6L8 3L15 6L22 3V18L15 21L8 18L1 21Z"/><path d="M8 3V18"/><path d="M15 6V21"/></svg>,
    people: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    shield: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    bolt: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  };
  return icons[type] || null;
}

export function StatIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    production: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    capacity: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    health: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  };
  return icons[type] || null;
}
