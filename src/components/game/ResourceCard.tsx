"use client";

import type { Resource } from "./game-data";
import { fmt, pct } from "./game-data";
import AssetImg from "./AssetImg";
import { CornerMarks, ResourceIcon } from "./icons";

export default function ResourceCard({ resource }: { resource: Resource }) {
  const colors = {
    cyan: { border: "border-cyan-500/20", glow: "shadow-[0_0_20px_rgba(0,200,255,0.12)]", bar: "from-cyan-400 to-blue-500", text: "text-cyan-400", iconBg: "bg-cyan-500/10", iconBorder: "border-cyan-400/20" },
    purple: { border: "border-purple-500/20", glow: "shadow-[0_0_20px_rgba(140,70,255,0.12)]", bar: "from-purple-500 to-fuchsia-400", text: "text-purple-400", iconBg: "bg-purple-500/10", iconBorder: "border-purple-400/20" },
    gold: { border: "border-yellow-500/20", glow: "shadow-[0_0_20px_rgba(255,180,40,0.12)]", bar: "from-yellow-400 to-orange-500", text: "text-yellow-400", iconBg: "bg-yellow-500/10", iconBorder: "border-yellow-400/20" },
  }[resource.tone];

  return (
    <div className={`relative overflow-hidden rounded-xl border ${colors.border} bg-[#0a1628]/90 ${colors.glow} p-3`}>
      <CornerMarks />
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${colors.iconBorder} ${colors.iconBg} lg:h-12 lg:w-12`}>
          <AssetImg name={resource.webpName} folder="ui" alt={resource.label} className="h-7 w-7 object-contain lg:h-8 lg:w-8" fallback={<ResourceIcon type={resource.key} />} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} lg:text-xs`}>{resource.label}</p>
          <p className="text-xl font-black tracking-tight text-white lg:text-2xl">{fmt(resource.value)}</p>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500">/ {fmt(resource.max)}</p>
            {resource.rate ? <p className="text-[10px] font-bold text-emerald-400">{resource.rate}</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full bg-gradient-to-r ${colors.bar} shadow-[0_0_6px_currentColor]`} style={{ width: `${pct(resource.value, resource.max)}%` }} />
      </div>
    </div>
  );
}
