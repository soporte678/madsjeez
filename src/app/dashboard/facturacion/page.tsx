import { Receipt } from "lucide-react";

export default function FacturacionPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Facturación</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Receipt size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Facturación electrónica</h3>
        <p className="text-sm text-muted-foreground">Configurá tu datos fiscales y descargá tus comprobantes.</p>
      </div>
    </div>
  );
}
