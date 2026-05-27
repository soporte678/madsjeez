import { Home, Plus } from "lucide-react";

export default function InmueblesInteresPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Inmuebles de interés</h1>
          <p className="mt-2 text-sm text-muted-foreground">Guarda oportunidades, deja notas y marca en qué punto va cada contacto.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} /> Agregar inmueble
        </button>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-24 flex flex-col items-center justify-center text-center">
        <Home size={48} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Todavía no guardaste inmuebles</h3>
        <p className="text-sm text-muted-foreground">Puedes cargarlos manualmente mientras conectamos esta vista con contactos reales.</p>
      </div>
    </div>
  );
}
