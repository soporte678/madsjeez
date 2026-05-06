"use client";

import { Suspense } from "react";
import MeliIntegrationView from "@/components/dashboard/MeliIntegrationView";

export default function MeliDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Cargando Mercado Libre…</div>
      }
    >
      <MeliIntegrationView />
    </Suspense>
  );
}
