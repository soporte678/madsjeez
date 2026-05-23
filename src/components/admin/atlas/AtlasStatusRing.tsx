"use client";

type Props = {
  label: string;
  value: string;
  state: "ok" | "off" | "warn" | "na";
  progress?: number;
};

const COLORS = {
  ok: "#00ffaa",
  off: "#ff4466",
  warn: "#ffb020",
  na: "rgba(255,255,255,0.25)",
};

export function AtlasStatusRing({ label, value, state, progress = 0.75 }: Props) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = state === "ok" ? progress : state === "warn" ? 0.5 : state === "off" ? 0.15 : 0.08;
  const stroke = COLORS[state];

  return (
    <div className={`atlas-status-node is-${state === "na" ? "warn" : state}`}>
      <svg className="atlas-ring" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(0,229,255,0.12)" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 26 26)"
          style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
        />
      </svg>
      <span className="atlas-ring-label">{label}</span>
      <span className={`atlas-ring-value ${state}`}>{value}</span>
    </div>
  );
}
