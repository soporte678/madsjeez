"use client";

import dynamic from "next/dynamic";

const JarvisChatWidget = dynamic(
  () => import("@/components/jarvis").then((m) => m.JarvisChatWidget),
  { ssr: false, loading: () => null }
);

const JarvisInitializer = dynamic(
  () => import("@/components/jarvis").then((m) => m.JarvisInitializer),
  { ssr: false, loading: () => null }
);

export function JarvisInitializerClient() {
  return <JarvisInitializer />;
}

export function JarvisChatWidgetClient() {
  return <JarvisChatWidget />;
}
