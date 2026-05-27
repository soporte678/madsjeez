import { Store } from "lucide-react";

export default function TiendasSigoPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[26px] font-semibold text-foreground">Tiendas que sigo</h1>
        <span className="text-sm text-muted-foreground font-medium">0 tiendas que sigo</span>
      </div>
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-2">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar nombre de la tienda"
            className="w-full py-2 pl-9 pr-4 text-sm border border-border rounded-full focus:outline-none focus:border-primary bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Store size={40} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No sigues ninguna tienda</h3>
        <p className="text-sm text-muted-foreground mb-6">Sigue a tus marcas favoritas para enterarte de sus novedades.</p>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Recomendadas para ti</h3>
        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between opacity-50 italic text-muted-foreground">
          Pronto verás recomendaciones aquí...
        </div>
      </div>
    </div>
  );
}
