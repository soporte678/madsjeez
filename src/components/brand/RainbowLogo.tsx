"use client";

import Image from "next/image";
import Link from "next/link";

type RainbowLogoProps = {
  href?: string;
  textSizeClassName?: string;
  iconSizeClassName?: string;
  /** false = solo palabra MADSJEEZ (p. ej. barra admin) */
  showIcon?: boolean;
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
  showIcon = true,
}: RainbowLogoProps) {
  const logo = (
    <div className="flex items-center gap-2 group">
      {showIcon ? (
        <div
          className={`relative ${iconSizeClassName} rounded-xl overflow-hidden shadow-lg border border-white/15 flex-shrink-0`}
        >
          <Image
            src="/brand/madsjeez-icon-512.webp"
            alt="MadsJeez Marketplace"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      ) : null}
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
