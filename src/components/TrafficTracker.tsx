"use client";
import { useEffect } from "react";

function sendVisit(path: string) {
  const key = `visit:${path}:${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  fetch(`${window.location.origin}/api/traffic/track${window.location.search}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, referrer: document.referrer || null }),
    keepalive: true,
  }).catch(() => null);
}

export default function TrafficTracker() {
  useEffect(() => {
    const path = window.location.pathname;
    const run = () => sendVisit(path);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 2500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
