"use client";

import { useState } from "react";

export default function AssetImg({
  name,
  folder,
  alt,
  className,
  fallback,
}: {
  name: string;
  folder: "buildings" | "ui" | "planets";
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [err, setErr] = useState(false);
  const src = `/game/assets/${folder}/${name}.webp`;
  if (err) return <div className={className}>{fallback}</div>;
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} loading="lazy" />;
}
