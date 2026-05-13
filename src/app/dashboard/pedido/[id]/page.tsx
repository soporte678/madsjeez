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
} from "lucide-react";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  perspective: "buyer" | "seller";
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

  useEffect(() => {
    if (!rawId) {
      setLoading(false);
      setError("ID inválido");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/orders/${encodeURIComponent(rawId)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "No se pudo cargar el pedido");
        return j as { order: OrderDetail };
      })
      .then((d) => {
        if (!cancelled) {
          setOrder(d.order);
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
      </div>
    </div>
  );
}
