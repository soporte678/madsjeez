"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  MessageSquare,
  Headphones,
  Star,
} from "lucide-react";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  source?: "prisma" | "supabase";
  perspective: "buyer" | "seller";
  fulfillmentStage?: string | null;
  fulfillmentStageLabel?: string | null;
  delayLabel?: string | null;
  delayDays?: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  shippingAddress: string;
  shippingZip: string;
  shippingPhone: string;
  buyer: { name: string | null; email: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string | null;
      title: string;
      images: { url: string }[];
      seller: { id: string; name: string | null } | null;
    };
  }>;
};

function formatPrice(n: number) {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    PENDING: "Pendiente de pago",
    PAID: "Pago confirmado",
    PROCESSING: "Preparando envío",
    SHIPPED: "En camino",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelada",
    REFUNDED: "Reembolsado",
  };
  return m[status] ?? status;
}

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "DELIVERED" ? (
      <CheckCircle2 className="w-4 h-4" />
    ) : status === "SHIPPED" ? (
      <Truck className="w-4 h-4" />
    ) : status === "PENDING" ? (
      <Clock className="w-4 h-4" />
    ) : status === "CANCELLED" || status === "REFUNDED" ? (
      <XCircle className="w-4 h-4" />
    ) : (
      <Package className="w-4 h-4" />
    );
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium text-foreground">
      {icon}
      {statusLabel(status)}
    </span>
  );
}

export default function PedidoDetallePage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [sellerStage, setSellerStage] = useState("pending_pickup");
  const [sellerBusy, setSellerBusy] = useState(false);

  useEffect(() => {
    if (!rawId) {
      queueMicrotask(() => setLoading(false));
      queueMicrotask(() => setError("ID invalido"));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/orders/${encodeURIComponent(rawId)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "No se pudo cargar el pedido");
        return j as { order: OrderDetail };
      })
      .then((d) => {
        if (!cancelled) {
          setOrder(d.order);
          setSellerStage(d.order.fulfillmentStage ?? "pending_pickup");
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rawId]);

  const backHref =
    order?.perspective === "seller" ? "/dashboard#ventas-lista" : "/dashboard#compras";

  async function createSupportTicket() {
    if (!order || supportBusy) return;
    setSupportBusy(true);
    try {
      const message =
        supportMessage.trim() ||
        `Necesito ayuda con el pedido #${order.orderNumber}. Estado actual: ${statusLabel(order.status)}.`;
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Ayuda con pedido #${order.orderNumber}`,
          category: "PEDIDOS",
          orderId: order.source === "prisma" ? order.id : null,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo crear la consulta");
      setSupportMessage("");
      alert("Consulta creada. Podes verla en Ayuda dentro del dashboard.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo crear la consulta");
    } finally {
      setSupportBusy(false);
    }
  }

  async function saveSellerStage() {
    if (!order || order.source !== "supabase" || sellerBusy) return;
    setSellerBusy(true);
    try {
      const res = await fetch(
        `/api/dashboard/marketplace-orders/${encodeURIComponent(order.id)}/fulfillment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: sellerStage }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la gestion");
      setOrder({
        ...order,
        fulfillmentStage: data.fulfillment?.stage ?? sellerStage,
        fulfillmentStageLabel: sellerStageLabel(data.fulfillment?.stage ?? sellerStage),
        delayLabel: data.delayLabel ?? null,
        delayDays: data.delayDays ?? 0,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar la gestion");
    } finally {
      setSellerBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando pedido…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-foreground font-medium mb-4">{error || "Pedido no encontrado"}</p>
        <Link href="/dashboard#compras" className="text-primary font-semibold hover:underline">
          Volver al panel
        </Link>
      </div>
    );
  }

  const shipLine = [order.shippingAddress, order.shippingCity, order.shippingState, order.shippingZip]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {order.perspective === "seller" ? "Volver a ventas" : "Volver a compras"}
      </Link>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-muted/20">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pedido</p>
            <h1 className="text-xl font-semibold text-foreground font-mono">#{order.orderNumber}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {order.perspective === "seller" ? "Vista vendedor" : "Vista comprador"} ·{" "}
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <StatusBadge status={order.status} />
            <span className="text-2xl font-semibold text-foreground">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-2 text-sm">
          <h2 className="text-sm font-semibold text-foreground mb-2">Envío</h2>
          {order.shippingName && <p className="text-foreground">{order.shippingName}</p>}
          {shipLine && <p className="text-muted-foreground">{shipLine}</p>}
          {order.shippingPhone && (
            <p className="text-muted-foreground">Tel: {order.shippingPhone}</p>
          )}
          {!order.shippingName && !shipLine && !order.shippingPhone && (
            <p className="text-muted-foreground">Sin datos de envío registrados para este pedido.</p>
          )}
        </div>

        {order.buyer?.email && (
          <div className="px-6 py-4 border-t border-border text-sm">
            <span className="text-muted-foreground">Comprador: </span>
            <span className="text-foreground font-medium">
              {order.buyer.name || order.buyer.email}
            </span>
          </div>
        )}

        <div className="border-t border-border px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Productos</h2>
          <ul className="space-y-4">
            {order.items.map((it) => {
              const img = it.product.images[0]?.url;
              return (
                <li key={it.id} className="flex gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{it.product.title}</p>
                    {it.product.seller?.name && (
                      <p className="text-xs text-muted-foreground mt-0.5">Vendedor: {it.product.seller.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Cantidad: {it.quantity} · {formatPrice(it.price)} c/u
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-foreground shrink-0">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            {order.perspective === "seller" ? "Acciones del vendedor" : "Acciones de la compra"}
          </h2>

          {order.perspective === "buyer" && (
            <>
              <div className="flex flex-wrap gap-2">
                {canContactSellerForOrder(order) && (
                  <Link
                    href={`/messages?seller=${encodeURIComponent(getFirstSeller(order)?.id ?? "")}${
                      getFirstProductId(order) ? `&product=${encodeURIComponent(getFirstProductId(order))}` : ""
                    }`}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contactar vendedor
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void createSupportTicket()}
                  disabled={supportBusy}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                >
                  <Headphones className="w-4 h-4" />
                  {supportBusy ? "Creando consulta..." : "Pedir ayuda"}
                </button>
                {order.status === "DELIVERED" && (
                  <Link
                    href="/dashboard#opiniones"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
                  >
                    <Star className="w-4 h-4" />
                    Opinar compra
                  </Link>
                )}
              </div>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Detalle opcional para soporte..."
                className="w-full min-h-[74px] rounded-md border border-border bg-background p-2 text-sm"
              />
            </>
          )}

          {order.perspective === "seller" && (
            <div className="space-y-4">
              {/* Datos completos del envío — el seller los necesita para despachar */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Datos para despachar
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Destinatario</dt>
                    <dd className="font-semibold text-foreground">{order.shippingName}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Teléfono</dt>
                    <dd className="font-mono text-foreground">{order.shippingPhone || "—"}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Dirección</dt>
                    <dd className="text-foreground">{order.shippingAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Ciudad</dt>
                    <dd className="text-foreground">{order.shippingCity}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Provincia</dt>
                    <dd className="font-semibold text-foreground">{order.shippingState}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Código postal</dt>
                    <dd className="font-mono text-foreground">{order.shippingZip}</dd>
                  </div>
                  {order.buyer?.email && (
                    <div>
                      <dt className="text-[11px] font-bold uppercase text-muted-foreground/80">Email comprador</dt>
                      <dd className="text-foreground text-[13px] break-all">{order.buyer.email}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/orders/${order.id}/label?autoprint=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-4 py-2.5 text-sm font-bold transition-colors"
                >
                  🖨 Imprimir etiqueta de envío
                </a>
                {(order.shippingPhone ?? "").trim() && (
                  <a
                    href={`https://wa.me/${(order.shippingPhone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Soy del marketplace Madsjeez. Tu pedido ${order.orderNumber} ya está siendo preparado para enviarte.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2.5 text-sm font-bold hover:bg-emerald-100 transition-colors"
                  >
                    💬 WhatsApp comprador
                  </a>
                )}
              </div>

              {order.fulfillmentStageLabel && (
                <p className="text-sm text-muted-foreground">
                  Gestión actual: <span className="font-medium text-foreground">{order.fulfillmentStageLabel}</span>
                  {order.delayLabel ? ` · ${order.delayLabel}` : ""}
                </p>
              )}
              {canManageSellerOrder(order) ? (
                <div className="flex flex-wrap gap-2">
                  <select
                    value={sellerStage}
                    onChange={(e) => setSellerStage(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="pending_pickup">Pendiente de despacho</option>
                    <option value="preparing">En proceso de preparación</option>
                    <option value="awaiting_stock">Por ingresar stock</option>
                    <option value="dispatched">Despachado</option>
                    <option value="sent">Enviado</option>
                    <option value="completed">Entrega finalizada</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void saveSellerStage()}
                    disabled={sellerBusy}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {sellerBusy ? "Guardando..." : "Guardar gestión"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Las opciones operativas se activan cuando el pago está confirmado y el pedido admite gestión.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sellerStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    pending_pickup: "Pendiente de despacho",
    preparing: "En proceso de preparacion",
    awaiting_stock: "Por ingresar stock",
    dispatched: "Despachado",
    sent: "Enviado",
    completed: "Entrega finalizada",
  };
  return labels[stage] ?? stage;
}

function getFirstSeller(order: OrderDetail): { id: string; name: string | null } | null {
  return order.items.find((it) => it.product.seller)?.product.seller ?? null;
}

function getFirstProductId(order: OrderDetail): string {
  return order.items.find((it) => it.product.id)?.product.id ?? "";
}

function canContactSellerForOrder(order: OrderDetail): boolean {
  return order.perspective === "buyer" && Boolean(getFirstSeller(order)?.id);
}

function canManageSellerOrder(order: OrderDetail): boolean {
  return (
    order.perspective === "seller" &&
    order.source === "supabase" &&
    ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)
  );
}
