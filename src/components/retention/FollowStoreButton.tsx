"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

/**
 * Botón "Seguir tienda" para perfiles de vendedor / tiendas.
 * Optimista; si no hay sesión, redirige a login.
 */
export function FollowStoreButton({
  sellerId,
  className = "",
}: {
  sellerId: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/follows", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set((d.follows || []).map((s: { id: string }) => s.id));
        setFollowing(ids.has(sellerId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, sellerId]);

  const toggle = async () => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = next
        ? await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sellerId }),
          })
        : await fetch(`/api/follows?sellerId=${sellerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (next) {
        trackEvent("store_followed", { seller_id: sellerId });
        toast.success("Ahora seguís esta tienda");
      }
    } catch {
      setFollowing(!next);
      toast.error("No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <button disabled className={`inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
        following
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-primary text-primary-foreground hover:opacity-90"
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${following ? "fill-primary" : ""}`} />
      {following ? "Siguiendo" : "Seguir tienda"}
    </button>
  );
}
