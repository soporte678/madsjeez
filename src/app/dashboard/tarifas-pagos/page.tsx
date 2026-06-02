import { CreditCard } from "lucide-react";
import { SellerMpSettingsForm } from "./SellerMpSettingsForm";

export const dynamic = "force-dynamic";

export default function TarifasPagosPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-3xl">
      <header>
        <h1 className="text-[26px] font-semibold text-foreground tracking-tight">
          Tarifas y pagos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Madsjeez no cobra comisión por venta. Configurá las cuotas y los medios de
          pago que querés ofrecer en tu checkout. El dinero va directo a tu
          cuenta de Mercado Pago.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-amber-900 flex gap-3">
        <CreditCard size={18} className="mt-0.5 shrink-0" />
        <div>
          <strong className="font-semibold">0% comisión sobre tus ventas.</strong>{" "}
          Madsjeez se financia por suscripción mensual. Vos recibís el 100% del
          importe de cada operación (menos lo que MP cobra por procesar el pago).
        </div>
      </div>

      <SellerMpSettingsForm />
    </div>
  );
}
