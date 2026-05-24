"use client";

import type { Building } from "./game-data";
import BuildingCard from "./BuildingCard";
import { CornerMarks } from "./icons";

export default function BuildingGrid({
  buildings,
  selId,
  onSel,
}: {
  buildings: Building[];
  selId: string;
  onSel: (id: string) => void;
}) {
  return (
    <section className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-cyan-500/20 bg-[#0a1628]/90">
      <CornerMarks />
      <div className="flex-1 overflow-y-auto p-2 lg:p-3">
        <div className="grid grid-cols-3 gap-2">
          {buildings.map((b) => (
            <BuildingCard key={b.id} building={b} selected={selId === b.id} onClick={() => onSel(b.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
