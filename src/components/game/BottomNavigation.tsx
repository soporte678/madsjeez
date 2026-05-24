"use client";

import { CornerMarks, NavIcon, LockIcon } from "./icons";

export default function BottomNavigation() {
  const items = [
    { label: "ASTILLERO", icon: "ship" as const, active: true, disabled: false },
    { label: "INVESTIGACIÓN", icon: "research" as const, active: false, disabled: false },
    { label: "FLOTAS", icon: "fleet" as const, active: false, disabled: true },
    { label: "MISIONES", icon: "mission" as const, active: false, disabled: true },
  ];

  return (
    <nav className="grid grid-cols-4 gap-2 lg:gap-3">
      {items.map((item) => (
        <button
          key={item.label}
          disabled={item.disabled}
          className={[
            "relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-lg border px-2 text-xs font-black uppercase tracking-wider transition lg:h-16 lg:gap-3 lg:text-sm",
            item.disabled
              ? "cursor-not-allowed border-slate-700/40 bg-[#0a1628]/80 text-slate-600"
              : item.active
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(0,200,255,0.15)]"
                : "border-cyan-500/15 bg-[#0a1628]/80 text-slate-400 hover:border-cyan-400/30 hover:bg-cyan-500/5 hover:text-cyan-300",
          ].join(" ")}
        >
          <CornerMarks />
          {item.disabled ? <LockIcon /> : <NavIcon type={item.icon} />}
          <div className="text-left">
            <p>{item.label}</p>
            {item.disabled && <p className="text-[9px] font-normal text-slate-600">PRÓXIMAMENTE</p>}
          </div>
        </button>
      ))}
    </nav>
  );
}
