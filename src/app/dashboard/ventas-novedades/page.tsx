import { Bell } from "lucide-react";

export default function VentasNovedadesPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Novedades</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Bell size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay novedades recientes</h3>
        <p className="text-sm text-muted-foreground">Aquí verás alertas sobre tus publicaciones, ventas y reputación.</p>
      </div>
    </div>
  );
}
