import Link from "next/link";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

export const metadata: Metadata = {
  title: "Pago no completado | Madsjeez",
  robots: ROBOTS_NOINDEX_FOLLOW,
};

export default function SubscriptionFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-5">
          <XCircle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">No se completó el pago</h1>
        <p className="text-muted-foreground mb-6">
          El pago no se procesó. No se te cobró nada. Podés intentar de nuevo o
          probar con otro medio de pago.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/subscriptions"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Reintentar
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
