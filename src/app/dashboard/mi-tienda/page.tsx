import { StorePublicPanel } from "@/components/dashboard/StorePublicPanel";

export default function MiTiendaPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Mi tienda pública</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Cada vendedor con productos activos tiene una URL propia en MadsJeez. Compartila en tu web
        o redes para generar visitas y backlinks naturales.
      </p>
      <StorePublicPanel />
    </div>
  );
}
