import Link from "next/link";
import { Wand2 } from "lucide-react";
import { StoreBuilderPanel } from "@/components/dashboard/StoreBuilderPanel";

export default function MiTiendaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Mi tienda</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Personalizá tu tienda dentro de Madsjeez: nombre, dirección, diseño, SEO y dominios.
        Compartí tu link para vender más y atraer compradores.
      </p>
      <Link
        href="/dashboard/mi-tienda/crear"
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
      >
        <Wand2 className="h-4 w-4" /> ¿Primera vez? Usá el asistente paso a paso
      </Link>
      <StoreBuilderPanel />
    </div>
  );
}
