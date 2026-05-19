"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Finalizada";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setLabel(formatRemaining(end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <p className="mb-2 flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-200">
      <Clock className="h-3 w-3 shrink-0" />
      Termina en {label}
    </p>
  );
}
