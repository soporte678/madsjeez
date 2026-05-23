"use client";



import clsx from "clsx";

import { LucideIcon } from "lucide-react";

import { ReactNode } from "react";

import { toast } from "sonner";



export async function waFetch<T = Record<string, unknown>>(

  url: string,

  init?: RequestInit

): Promise<T> {

  const res = await fetch(url, init);

  const data = (await res.json().catch(() => ({}))) as T & {

    error?: string;

    message?: string;

  };

  if (!res.ok) {

    const msg =

      typeof data.message === "string"

        ? data.message

        : typeof data.error === "string"

          ? data.error

          : `No pudimos completar la operación (${res.status})`;

    throw new Error(msg);

  }

  return data;

}



export function waCatch(err: unknown, fallback = "La operación falló. Probá de nuevo.") {

  const raw = err instanceof Error ? err.message : fallback;

  const msg = raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;

  toast.error(msg);

}



export function waSuccess(message: string) {

  toast.success(message);

}



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

    <header className="wa-inbox-header wa-page-header-block">

      <div>

        <h1 className="wa-page-title">{title}</h1>

        {subtitle ? <p className="wa-page-sub">{subtitle}</p> : null}

      </div>

      {action ? <div className="wa-page-header-action">{action}</div> : null}

    </header>

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

    <div className={clsx("wa-metric-card", muted && "wa-metric-card--muted")}>

      <p className="wa-metric-label">{label}</p>

      <p className="wa-metric-value">{value}</p>

      {foot ? <p className="wa-metric-foot">{foot}</p> : null}

    </div>

  );

}



export function WaEmpty({

  title,

  desc,

  icon: Icon,

  action,

}: {

  title: string;

  desc?: string;

  icon?: LucideIcon;

  action?: ReactNode;

}) {

  return (

    <div className="wa-empty">

      {Icon ? (

        <div className="wa-empty-icon" aria-hidden>

          <Icon className="h-8 w-8" />

        </div>

      ) : null}

      <p className="wa-empty-title">{title}</p>

      {desc ? <p className="wa-empty-desc">{desc}</p> : null}

      {action ? <div className="wa-empty-action">{action}</div> : null}

    </div>

  );

}



export function WaBarChart({ data }: { data: { label: string; value: number }[] }) {

  const max = Math.max(1, ...data.map((d) => d.value));

  return (

    <div className="wa-soft wa-bar-chart p-4 flex items-end gap-2 h-32">

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



export function WaSectionBlock({

  title,

  children,

  className,

}: {

  title: string;

  children: ReactNode;

  className?: string;

}) {

  return (

    <section className={clsx("wa-section-block", className)}>

      <h2 className="wa-section-title wa-section-block-title">{title}</h2>

      {children}

    </section>

  );

}


