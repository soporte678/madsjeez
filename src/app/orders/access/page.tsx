import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Package } from "lucide-react";
import { verifyOrderAccessToken } from "@/lib/orders/access-token";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tu orden · Madsjeez",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = { token?: string };

function money(n: number) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

export default async function OrderAccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return <ErrorView title="Link inválido" message="Faltan parámetros en el link." />;
  }

  const verify = verifyOrderAccessToken(token);
  if (!verify.ok) {
    const map: Record<string, string> = {
      malformed: "El link está mal formado.",
      bad_signature: "El link no es válido o fue manipulado.",
      expired: "El link caducó. Recuperá el acceso desde nuestro buscador de orden.",
    };
    return (
      <ErrorView
        title="No pudimos validar el link"
        message={map[verify.reason] ?? "Error desconocido."}
      />
    );
  }

  const { o: orderId, b: buyerEmail } = verify.payload;

  // Buscar la order: aceptamos match por id o por orderNumber
  let order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
      buyer: { email: buyerEmail },
    },
    include: {
      buyer: { select: { email: true, name: true } },
      items: { include: { product: { select: { id: true, title: true } } } },
      payment: true,
    },
  });

  if (!order) {
    return (
      <ErrorView
        title="Orden no encontrada"
        message="No pudimos ubicar la orden. Si pagaste hace pocos minutos, esperá 1-2 min y refrescá."
      />
    );
  }

  const statusLabel: Record<string, { text: string; bg: string; ic: typeof CheckCircle2 }> = {
    PAID: { text: "Pago confirmado", bg: "bg-emerald-50 text-emerald-700 ring-emerald-200", ic: CheckCircle2 },
    PENDING: { text: "Pago pendiente", bg: "bg-amber-50 text-amber-700 ring-amber-200", ic: AlertCircle },
    CANCELLED: { text: "Cancelada", bg: "bg-rose-50 text-rose-700 ring-rose-200", ic: AlertCircle },
    REFUNDED: { text: "Reembolsada", bg: "bg-slate-100 text-slate-700 ring-slate-300", ic: AlertCircle },
  };
  const st = statusLabel[order.status] ?? statusLabel.PENDING;

  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4 font-outfit">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          prefetch={false}
          className="text-[13px] font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Volver al sitio
        </Link>

        <div className="mt-6 rounded-3xl bg-white border border-slate-200 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="px-7 py-8 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Número de orden
                </p>
                <p className="font-mono text-[18px] font-bold text-slate-900 mt-1">
                  {order.orderNumber}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ${st.bg}`}>
                <st.ic size={14} strokeWidth={2.5} />
                {st.text}
              </span>
            </div>
          </div>

          <div className="px-7 py-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-4">
              Productos
            </h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Package className="text-slate-400 mt-0.5 shrink-0" size={16} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">
                        {it.product.title}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {it.quantity} unidad{it.quantity > 1 ? "es" : ""} · ${money(Number(it.price))} c/u
                      </p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-slate-900 shrink-0">
                    ${money(Number(it.price) * it.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 text-[14px] border-t border-slate-200 pt-5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${money(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span>${money(Number(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>${money(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="px-7 py-6 bg-stone-50 border-t border-slate-200">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
              Envío
            </h2>
            <p className="text-[13.5px] text-slate-700 leading-relaxed">
              {order.shippingName}<br />
              {order.shippingAddress}<br />
              {order.shippingCity}, {order.shippingState} ({order.shippingZip})<br />
              {order.shippingPhone}
            </p>
          </div>

          {order.payment && (
            <div className="px-7 py-5 bg-slate-900 text-white text-[12px] font-mono">
              <p className="text-yellow-300 uppercase tracking-[0.22em] font-bold mb-1">
                Comprobante MercadoPago
              </p>
              <p>ID de pago: {order.payment.mpPaymentId ?? "—"}</p>
              <p>Estado: {order.payment.mpStatus ?? order.payment.status}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-[12px] text-slate-500 text-center">
          Guardá este link. Caduca en 90 días. Si lo perdés,{" "}
          <Link href="/orders/lookup" className="text-blue-600 underline">
            recuperalo con tu email + número de orden
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 font-outfit">
      <div className="max-w-md w-full text-center bg-white rounded-3xl border border-slate-200 p-10 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]">
        <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" strokeWidth={1.5} />
        <h1 className="text-xl font-black text-slate-900 mb-2">{title}</h1>
        <p className="text-[14px] text-slate-600 leading-relaxed mb-6">{message}</p>
        <Link
          href="/orders/lookup"
          className="inline-block rounded-xl bg-slate-900 hover:bg-black text-white font-bold px-5 py-3 text-[13.5px]"
        >
          Buscar mi orden
        </Link>
      </div>
    </main>
  );
}
