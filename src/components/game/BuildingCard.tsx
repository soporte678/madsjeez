"use client";

import type { Building } from "./game-data";
import AssetImg from "./AssetImg";
import { BuildingIcon } from "./icons";

export default function BuildingCard({
  building,
  selected,
  onClick,
}: {
  building: Building;
  selected: boolean;
  onClick: () => void;
}) {
  const empty = building.type === "empty";
  return (
    <button
      onClick={onClick}
      className={[
        "group relative flex flex-col items-center overflow-hidden rounded-lg border p-2 transition lg:p-3",
        selected
          ? "border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,200,255,0.25),inset_0_0_20px_rgba(0,200,255,0.05)]"
          : "border-cyan-500/10 bg-[#0d1b2f]/80 hover:border-cyan-400/30 hover:bg-cyan-500/5",
      ].join(" ")}
    >
      {!empty && (
        <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border border-yellow-400/60 bg-yellow-500 text-[10px] font-black text-black shadow-[0_0_8px_rgba(255,200,50,0.6)]">
          {building.level}
        </div>
      )}
      <div className="mb-1 text-center">
        <p className="text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-300 lg:text-[10px]">{empty ? "" : building.name}</p>
        {!empty && <p className="text-[9px] text-cyan-400/70">Nivel {building.level}</p>}
      </div>
      <div className="relative flex h-[60px] w-full items-center justify-center lg:h-[80px]">
        {empty ? (
          <div className="flex flex-col items-center gap-1">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-400/20 text-xl text-cyan-400/50 lg:h-12 lg:w-12">+</div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/50">CONSTRUIR</p>
          </div>
        ) : (
          <AssetImg
            name={building.webpName}
            folder="buildings"
            alt={building.name}
            className="h-full w-full object-contain drop-shadow-[0_0_24px_rgba(0,220,255,0.75)] transition group-hover:drop-shadow-[0_0_30px_rgba(0,220,255,0.9)]"
            fallback={<BuildingIcon type={building.type} />}
          />
        )}
      </div>
    </button>
  );
}
