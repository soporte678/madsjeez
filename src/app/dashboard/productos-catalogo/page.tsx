import { Package, Plus } from "lucide-react";

export default function ProductosCatalogoPage() {
  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Productos de catálogo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ordená tu base, vinculá fichas y dejá trazabilidad de SKU, marca y estado.</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} className="inline mr-1" /> Nuevo producto
        </button>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-24 flex flex-col items-center justify-center text-center">
        <Package size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay productos en el catálogo</h3>
        <p className="text-sm text-muted-foreground">Agregá productos para mantener un catálogo organizado.</p>
      </div>
    </div>
  );
}
