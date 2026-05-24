"use client";

import AssetImg from "./AssetImg";
import { CornerMarks, PlanetIconSmall, ChevronRight, InfoIcon } from "./icons";

export default function PlanetPanel() {
  return (
    <section className="relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-cyan-500/20 bg-[#0a1628]/90 lg:w-[320px]">
      <CornerMarks />
      <div className="flex items-center gap-2 border-b border-cyan-500/10 px-3 py-2">
        <PlanetIconSmall />
        <h2 className="text-xs font-black uppercase tracking-wider text-cyan-400">Planeta Principal</h2>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center p-2">
        <div className="relative h-[200px] w-[200px] lg:h-[240px] lg:w-[240px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#c8e6ff_0%,#5fb8ff_8%,#16599a_22%,#0a2752_48%,#031326_75%,transparent_76%)] shadow-[0_0_60px_rgba(0,150,255,0.4)]" />
          <AssetImg name="main-planet" folder="planets" alt="Planeta" className="absolute inset-0 h-full w-full object-contain" fallback={null} />
        </div>
      </div>
      <div className="border-t border-cyan-500/10">
        <InfoRow icon="map" label="Coordenadas" value="X: 125  Y: 307" />
        <InfoRow icon="people" label="Población" value="1.250" />
        <InfoRow icon="shield" label="Defensa Planetaria" value="850" />
        <InfoRow icon="bolt" label="Producción Total" value="+150/h" highlight />
      </div>
      <button className="flex items-center justify-between border-t border-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/5">
        <span>VER DETALLES</span>
        <ChevronRight />
      </button>
    </section>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-500/5 px-3 py-1.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <InfoIcon type={icon} />
        <span className="text-[10px] text-slate-500 lg:text-xs">{label}</span>
      </div>
      <span className={`text-[10px] font-bold lg:text-xs ${highlight ? "text-emerald-400" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}
