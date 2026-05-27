import { Search } from "lucide-react";

export default function BusquedasGuardadasPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Búsquedas guardadas</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Search size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No tienes búsquedas guardadas</h3>
        <p className="text-sm text-muted-foreground">Guarda tus búsquedas favoritas para recibir alertas cuando haya novedades.</p>
      </div>
    </div>
  );
}
