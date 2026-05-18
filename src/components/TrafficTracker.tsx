"use client";
import { useEffect } from "react";

export default function TrafficTracker() {
  useEffect(() => {
    const key = `visit:${window.location.pathname}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`${window.location.origin}/api/traffic/track${window.location.search}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer || null }),
      keepalive: true,
    }).catch(() => null);
  }, []);
  return null;
}
