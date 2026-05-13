"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  buyer: { id: string | null; name: string | null; email: string | null };
  fulfillmentStage?: string | null;
  fulfillmentStageLabel?: string | null;
  delayLabel?: string | null;
  delayDays?: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id?: string | null;
      title: string;
      price: number;
      images: { url: string }[];
    };
  }>;
};

type TabDef = { key: string; label: string; filter: (o: ApiOrder) => boolean };

const STATUS_TABS: TabDef[] = [
  { key: "all", label: "Todas", filter: () => true },
  { key: "PENDING", label: "Pendiente de pago", filter: (o) => o.status === "PENDING" },
  { key: "PAID", label: "Pago confirmado", filter: (o) => o.status === "PAID" },
  { key: "PROCESSING", label: "Preparando", filter: (o) => o.status === "PROCESSING" },
  { key: "SHIPPED", label: "En camino", filter: (o) => o.status === "SHIPPED" },
  { key: "DELIVERED", label: "Entregadas", filter: (o) => o.status === "DELIVERED" },
  {
    key: "cancel",
    label: "Canceladas / reembolso",
    filter: (o) => o.status === "CANCELLED" || o.status === "REFUNDED",
  },
  {
    key: "delayed",
    label: "Demoradas (24 h)",
    filter: (o) => (o.delayDays ?? 0) > 0,
  },
];

const FULFILLMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "pending_pickup", label: "Pendiente de despacho" },
  { value: "preparing", label: "En proceso de preparación" },
  { value: "awaiting_stock", label: "Por ingresar stock" },
  { value: "dispatched", label: "Despachado" },
  { value: "sent", label: "Enviado" },
  { value: "completed", label: "Entrega finalizada" },
];

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

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "DELIVERED":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    case "SHIPPED":
      return <Truck className="w-4 h-4 text-blue-600 shrink-0" />;
    case "PENDING":
      return <Clock className="w-4 h-4 text-red-500 shrink-0" />;
    case "CANCELLED":
    case "REFUNDED":
      return <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />;
    default:
      return <Package className="w-4 h-4 text-blue-600 shrink-0" />;
  }
}

export default function VentasView() {
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [totalServer, setTotalServer] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewUrls, setReviewUrls] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/dashboard/ventas/process-sla", { method: "POST" }).catch(() => {});
      const r = await fetch("/api/dashboard/orders?role=seller&limit=200&page=1");
      if (!r.ok) throw new Error("Error al cargar ventas");
      const d = (await r.json()) as {
        orders?: ApiOrder[];
        total?: number;
      };
      setOrders(d.orders ?? []);
      setTotalServer(typeof d.total === "number" ? d.total : (d.orders ?? []).length);
      setError(null);
    } catch {
      setError("No se pudieron cargar las ventas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    const cfg = STATUS_TABS.find((t) => t.key === tab);
    if (!cfg) return orders;
    return orders.filter((o) => cfg.filter(o));
  }, [orders, tab]);

  const tabCount = (key: string) => {
    if (key === "all") return totalServer;
    const cfg = STATUS_TABS.find((t) => t.key === key);
    if (!cfg) return 0;
    return orders.filter(cfg.filter).length;
  };

  async function saveFulfillment(order: ApiOrder, stage: string) {
    if (!order.id.startsWith("sb-")) return;
    setSavingId(order.id);
    try {
      const r = await fetch(
        `/api/dashboard/marketplace-orders/${encodeURIComponent(order.id)}/fulfillment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert((j as { error?: string }).error || "No se pudo guardar");
        return;
      }
      await loadOrders();
    } finally {
      setSavingId(null);
    }
  }

  async function submitDelayReview() {
    if (!reviewOrder?.id.startsWith("sb-")) return;
    const reason = reviewReason.trim();
    if (reason.length < 10) {
      alert("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    setReviewBusy(true);
    try {
      const proof_urls = reviewUrls
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await fetch(
        `/api/dashboard/marketplace-orders/${encodeURIComponent(reviewOrder.id)}/delay-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, proof_urls }),
        }
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert((j as { error?: string }).error || "No se pudo enviar");
        return;
      }
      setReviewOrder(null);
      setReviewReason("");
      setReviewUrls("");
      await loadOrders();
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mr-3" />
        Cargando ventas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl rounded-xl border border-border bg-card p-10 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-foreground font-medium">{error}</p>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-5xl">
      <div>
        <h1 className="text-[26px] font-semibold text-foreground">Ventas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestioná pedidos marketplace (Mercado Pago / Supabase): estado de pago de MP y tu estado de preparación /
          despacho. Si pasan 24 h desde el pago sin despacho, el pedido se marca demorado y afecta tu métrica de
          demoras.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalServer > orders.length
            ? `Mostrando las ${orders.length} más recientes de ${totalServer}.`
            : `${totalServer} pedidos en total (vista actual).`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === t.key ? "bg-primary-foreground/20" : "bg-muted"
              }`}
            >
              {tabCount(t.key)}
            </span>
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <Package className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Todavía no tenés ventas</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Cuando un comprador pague, el pedido aparece acá. Si compró como invitado con mail/tel/DNI en el checkout,
            al iniciar sesión con esos datos también verá su pedido en Compras.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay ventas en esta categoría (en las cargadas recientemente).
            </div>
          ) : (
            filtered.map((order) => {
              const first = order.items[0];
              const extra = order.items.length - 1;
              const title =
                extra > 0
                  ? `${first?.product?.title ?? "Producto"} (+${extra} ítem${extra > 1 ? "s" : ""})`
                  : first?.product?.title ?? "Producto";
              const img = first?.product?.images?.[0]?.url;
              const buyer =
                order.buyer?.name ||
                order.buyer?.email?.split("@")[0] ||
                order.shippingName ||
                "Comprador";
              const canOps = order.id.startsWith("sb-");
              const stageVal = order.fulfillmentStage ?? "pending_pickup";

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 bg-muted/30 text-xs text-muted-foreground">
                    <span className="font-mono text-foreground font-medium">#{order.orderNumber}</span>
                    <span>·</span>
                    <span>{formatWhen(order.createdAt)}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-foreground font-medium">
                      <StatusIcon status={order.status} />
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="w-16 h-16 shrink-0 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Package className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Comprador: {buyer}</p>
                      {(order.shippingCity || order.shippingState) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Envío: {order.shippingCity}
                          {order.shippingCity && order.shippingState ? ", " : ""}
                          {order.shippingState}
                        </p>
                      )}
                      {order.fulfillmentStageLabel && (
                        <p className="text-xs text-primary font-medium mt-1">
                          Tu gestión: {order.fulfillmentStageLabel}
                        </p>
                      )}
                      {order.delayLabel && (
                        <p className="text-xs font-semibold text-amber-700 mt-1">{order.delayLabel}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-semibold text-foreground">{formatPrice(order.total)}</span>
                      <Link
                        href={`/dashboard/pedido/${encodeURIComponent(order.id)}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Ver seguimiento
                      </Link>
                    </div>
                  </div>

                  {canOps && (
                    <div className="border-t border-border px-4 py-3 bg-muted/20 space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Actualizá el estado operativo (no reemplaza el estado de pago de Mercado Pago). Si no despachás
                        en 24 h desde el pago, el pedido entra en demora.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="text-xs border border-border rounded-md px-2 py-1.5 bg-background max-w-[220px]"
                          value={stageVal}
                          disabled={savingId === order.id}
                          onChange={(e) => void saveFulfillment(order, e.target.value)}
                        >
                          {FULFILLMENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {savingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {order.delayLabel && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewOrder(order);
                              setReviewReason("");
                              setReviewUrls("");
                            }}
                            className="text-xs font-semibold text-amber-800 underline"
                          >
                            Solicitar revisión por demora
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {reviewOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl border border-border max-w-md w-full p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-foreground mb-2">Revisión por demora</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Pedido #{reviewOrder.orderNumber}. Contanos el motivo y adjuntá URLs de prueba (tracking, capturas,
              etc.).
            </p>
            <textarea
              className="w-full text-sm border border-border rounded-md p-2 min-h-[100px] bg-background"
              placeholder="Motivo (mín. 10 caracteres)…"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
            />
            <textarea
              className="w-full text-sm border border-border rounded-md p-2 mt-2 min-h-[60px] bg-background"
              placeholder="URLs de prueba, una por línea o separadas por coma"
              value={reviewUrls}
              onChange={(e) => setReviewUrls(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-md border border-border"
                onClick={() => setReviewOrder(null)}
                disabled={reviewBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                onClick={() => void submitDelayReview()}
                disabled={reviewBusy}
              >
                {reviewBusy ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
