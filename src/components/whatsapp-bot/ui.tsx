import clsx from "clsx";
import { ReactNode } from "react";

export function WaCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("wa-panel p-4", className)}>{children}</section>;
}

export function WaPill({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
}) {
  const tones = {
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    green: "border-green-400/25 bg-green-500/10 text-green-200",
    purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",
    orange: "border-orange-400/25 bg-orange-500/10 text-orange-200",
    red: "border-red-400/25 bg-red-500/10 text-red-200",
    slate: "border-white/10 bg-white/[0.05] text-slate-200",
  } as const;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function WaAvatar({ label, className }: { label: string; className?: string }) {
  const initials = label
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  return (
    <div
      className={clsx(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-emerald-500 text-sm font-black text-white shadow-lg shadow-blue-500/20",
        className
      )}
    >
      {initials}
    </div>
  );
}
