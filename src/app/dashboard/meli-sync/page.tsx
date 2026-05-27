import { Suspense } from "react";
import MeliIntegrationView from "@/components/dashboard/MeliIntegrationView";

export default function MeliSyncPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Cargando Mercado Libre…</div>}>
      <MeliIntegrationView />
    </Suspense>
  );
}
