"use client";

import { useState, useCallback, useMemo } from "react";

import { allBuildings, initialBuildings, player, resources, pct } from "./game-data";

import ResourceCard from "./ResourceCard";
import PlanetPanel from "./PlanetPanel";
import BuildingGrid from "./BuildingGrid";
import BuildingDetailPanel from "./BuildingDetailPanel";
import StructureLibrary from "./StructureLibrary";
import BottomNavigation from "./BottomNavigation";

import { CornerMarks, AvatarIcon, ExitIcon } from "./icons";

export default function PlanetDashboardPremium() {
  const [selId, setSelId] = useState("b2");
  const sel = useMemo(() => allBuildings.find((b) => b.id === selId) || allBuildings[0], [selId]);
  const onSel = useCallback((id: string) => setSelId(id), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020814] text-white select-none">
      {/* Deep space background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(0,140,255,0.12)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(0,80,180,0.10)_0%,transparent_50%),radial-gradient(ellipse_at_50%_50%,rgba(0,40,100,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%220.8%22%20fill%3D%22white%22%20opacity%3D%220.4%22%2F%3E%3Ccircle%20cx%3D%2280%22%20cy%3D%2240%22%20r%3D%220.5%22%20fill%3D%22white%22%20opacity%3D%220.3%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22120%22%20r%3D%220.6%22%20fill%3D%22white%22%20opacity%3D%220.5%22%2F%3E%3Ccircle%20cx%3D%22180%22%20cy%3D%2260%22%20r%3D%220.4%22%20fill%3D%22white%22%20opacity%3D%220.3%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%22160%22%20r%3D%220.7%22%20fill%3D%22white%22%20opacity%3D%220.4%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%22180%22%20r%3D%220.5%22%20fill%3D%22white%22%20opacity%3D%220.3%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
      </div>

      <div className="relative z-10 mx-auto flex h-screen max-w-[1920px] flex-col gap-2 p-2 lg:gap-3 lg:p-3">
        <Header />

        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          {resources.map((r) => (
            <ResourceCard key={r.key} resource={r} />
          ))}
        </div>

        <div className="flex flex-1 gap-2 overflow-hidden lg:gap-3">
          <PlanetPanel />
          <BuildingGrid buildings={initialBuildings} selId={selId} onSel={onSel} />
          <BuildingDetailPanel building={sel} />
        </div>

        <StructureLibrary buildings={allBuildings} onSelect={onSel} />

        <BottomNavigation />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="relative flex h-[72px] shrink-0 items-center justify-between overflow-hidden rounded-xl border border-cyan-500/20 bg-[#0a1628]/90 px-4 lg:px-6">
      <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(0,220,255,0.1),inset_0_-1px_0_rgba(0,100,200,0.1)]" />
      <CornerMarks />
      <div className="relative flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full border border-cyan-400/30 bg-[#0d1f35] shadow-[0_0_15px_rgba(0,200,255,0.25)]">
          <AvatarIcon />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wide text-white lg:text-2xl">{player.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400">Nivel {player.level}</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-800 lg:w-36">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(0,200,255,0.8)]" style={{ width: `${pct(player.xp, player.xpMax)}%` }} />
            </div>
            <span className="text-[10px] text-slate-500">{player.xp} / {player.xpMax} XP</span>
          </div>
        </div>
      </div>
      <button className="relative flex h-9 items-center gap-2 rounded-lg border border-red-500/40 bg-red-900/30 px-4 text-sm font-bold text-red-300 shadow-[0_0_12px_rgba(255,50,50,0.2)] transition hover:bg-red-800/40">
        <ExitIcon />
        Salir
      </button>
    </header>
  );
}
