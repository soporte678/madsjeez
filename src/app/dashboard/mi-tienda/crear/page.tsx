import { StoreOnboarding } from "@/components/dashboard/StoreOnboarding";

export default function CrearTiendaWizardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Crear mi tienda</h1>
      <p className="text-sm text-muted-foreground mb-6">Configurá tu tienda en pocos pasos. Podés cambiar todo después desde tu panel.</p>
      <StoreOnboarding />
    </div>
  );
}
