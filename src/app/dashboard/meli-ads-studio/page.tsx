import { Suspense } from "react";
import MeliAdsStudioView from "@/components/dashboard/MeliAdsStudioView";
export default function MeliAdsStudioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Cargando Mercado Libre Ads…</div>}>
      <MeliAdsStudioView />
    </Suspense>
  );
}
