import Link from "next/link";
import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

export const metadata: Metadata = {
  title: "Pago en proceso | Madsjeez",
  robots: ROBOTS_NOINDEX_FOLLOW,
};

export default function SubscriptionPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 mb-5">
          <Clock className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Pago en proceso</h1>
        <p className="text-muted-foreground mb-6">
          Tu pago está siendo procesado. Cuando se acredite, activamos tu plan
          automáticamente y te avisamos. Puede demorar unos minutos.
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
