import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

export const metadata: Metadata = {
  title: "Suscripción confirmada | Madsjeez",
  robots: ROBOTS_NOINDEX_FOLLOW,
};

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mb-5">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">¡Pago confirmado!</h1>
        <p className="text-muted-foreground mb-6">
          Tu suscripción se está activando. En unos minutos vas a tener disponibles
          todos los beneficios de tu plan en el panel.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Ir a mi panel
        </Link>
      </div>
    </div>
  );
}
