"use client";

import { ReactNode } from "react";

export function WaPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="wa-inbox-header">
      <div>
        <h1 className="wa-page-title">{title}</h1>
        {subtitle ? <p className="wa-page-sub">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function WaMetricCard({
  label,
  value,
  foot,
  muted,
}: {
  label: string;
  value: string | number;
  foot?: string;
  muted?: boolean;
}) {
  return (
    <div className={`wa-metric-card ${muted ? "wa-metric-card--muted" : ""}`}>
      <p className="wa-metric-label">{label}</p>
      <p className="wa-metric-value">{value}</p>
      {foot ? <p className="wa-metric-foot">{foot}</p> : null}
    </div>
  );
}

export function WaEmpty({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="wa-soft p-8 text-center">
      <p className="font-bold text-white">{title}</p>
      {desc ? <p className="mt-2 text-sm text-slate-400">{desc}</p> : null}
    </div>
  );
}

export function WaBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="wa-soft p-4 flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full rounded-t bg-blue-500/60"
            style={{ height: `${Math.max(8, (d.value / max) * 100)}%` }}
          />
          <span className="text-[10px] text-slate-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
