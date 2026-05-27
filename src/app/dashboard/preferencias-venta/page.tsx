import { Settings2 } from "lucide-react";

export default function PreferenciasVentaPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Preferencias de venta</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Settings2 size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Configurá tus preferencias</h3>
        <p className="text-sm text-muted-foreground">Definí métodos de envío, tiempos de preparación y políticas de devolución.</p>
      </div>
    </div>
  );
}
