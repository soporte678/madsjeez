"use client";

import Link from "next/link";

type RainbowLogoProps = {
  href?: string;
  textSizeClassName?: string;
  iconSizeClassName?: string;
};

const letters = [
  { char: "M", color: "#fef08a" },
  { char: "A", color: "#fcd34d" },
  { char: "D", color: "#fdba74" },
  { char: "S", color: "#fb923c" },
  { char: "J", color: "#67e8f9" },
  { char: "E", color: "#7dd3fc" },
  { char: "E", color: "#86efac" },
  { char: "Z", color: "#5eead4" },
];

export default function RainbowLogo({
  href = "/",
  textSizeClassName = "text-[22px]",
  iconSizeClassName = "w-10 h-10",
}: RainbowLogoProps) {
  const logo = (
    <div className="flex items-center gap-2 group">
      <div
        className={`relative ${iconSizeClassName} rounded-xl flex items-center justify-center shadow-lg border border-white/15 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]`}
      >
        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]" aria-hidden>
          <path d="M 15 80 L 35 30 L 55 55" stroke="#f97316" fill="none" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 85 80 L 65 30 L 45 65" stroke="#00b4d8" fill="none" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#ff4d2e]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className={`font-black tracking-tighter leading-none uppercase flex items-center ${textSizeClassName}`}>
        {letters.map((l, i) => (
          <span key={`${l.char}-${i}`} style={{ color: l.color, textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}>
            {l.char}
          </span>
        ))}
      </span>
    </div>
  );

  return (
    <Link href={href} className="inline-flex items-center cursor-pointer">
      {logo}
    </Link>
  );
}
