"use client";

import type { Building } from "./game-data";
import AssetImg from "./AssetImg";
import { CornerMarks, BuildingIcon } from "./icons";

export default function StructureLibrary({
  buildings,
  onSelect,
}: {
  buildings: Building[];
  onSelect: (id: string) => void;
}) {
  // Show all non-empty buildings that are NOT built yet (level 0)
  const libraryItems = buildings.filter((b) => b.type !== "empty" && b.level === 0);

  return (
    <section className="relative flex shrink-0 flex-col overflow-hidden rounded-xl border border-cyan-500/20 bg-[#0a1628]/90">
      <CornerMarks />
      <div className="flex items-center gap-2 border-b border-cyan-500/10 px-3 py-2">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-cyan-400">ESTRUCTURAS DISPONIBLES</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto p-2 lg:p-3">
        {libraryItems.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className="group flex shrink-0 flex-col items-center gap-1 rounded-lg border border-cyan-500/10 bg-[#0d1b2f]/80 p-2 transition hover:border-cyan-400/30 hover:bg-cyan-500/5"
          >
            <div className="relative flex h-12 w-12 items-center justify-center lg:h-14 lg:w-14">
              <AssetImg
                name={b.webpName}
                folder="buildings"
                alt={b.name}
                className="h-full w-full object-contain drop-shadow-[0_0_10px_rgba(0,220,255,0.4)] transition group-hover:drop-shadow-[0_0_16px_rgba(0,220,255,0.6)]"
                fallback={<BuildingIcon type={b.type} />}
              />
            </div>
            <p className="max-w-[72px] truncate text-[9px] font-bold uppercase tracking-wider text-slate-300">{b.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
