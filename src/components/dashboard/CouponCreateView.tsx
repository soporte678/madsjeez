"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Info,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

type DiscountType = "porcentaje" | "monto_fijo";
type Tab = "audiencia" | "visibilidad" | "publicaciones";

export default function CouponCreateView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("audiencia");
  const [discountType, setDiscountType] = useState<DiscountType>("porcentaje");
  const [couponName, setCouponName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [startsAt, setStartsAt] = useState("2026-05-06");
  const [expiresAt, setExpiresAt] = useState("2026-05-11");
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos del vendedor para mostrar en selector (tab publicaciones)
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products/my");
        if (!res.ok) return;
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        // silent fail
      }
    }
    fetchProducts();
  }, []);

  async function handleCreateCoupon() {
    if (!couponCode.trim() || !couponName.trim()) {
      setError("El nombre y código del cupón son obligatorios");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          description: couponName,
          discountType: discountType === "porcentaje" ? "percentage" : "fixed",
          discountValue: parseFloat(totalBudget) || 10,
          minPurchase: minPurchase ? parseFloat(minPurchase) : null,
          maxUses: null,
          maxDiscount: null,
          startsAt,
          expiresAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear cupón");
      }
      router.push("/dashboard?section=publicidad");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-blue-600">
        <span className="hover:underline cursor-pointer">Publicaciones</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="hover:underline cursor-pointer">Listado</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="hover:underline cursor-pointer">Promos</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">Creá tu cupón</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold text-gray-800">Creá tu cupón</h1>
        <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <HelpCircle size={14} /> Necesito ayuda
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex items-center gap-1">
        {[
          { id: "audiencia" as Tab, label: "Audiencia", desc: "Publicaciones de tu página de ML para..." },
          { id: "visibilidad" as Tab, label: "Visibilidad", desc: "Definí dónde se va a ver el cupón en tu..." },
          { id: "publicaciones" as Tab, label: "Publicaciones", desc: "Todas las publicaciones de tu tienda..." },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-left p-3 rounded-lg transition-colors ${
              activeTab === t.id
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className={`text-sm font-semibold ${activeTab === t.id ? "text-blue-700" : "text-gray-700"}`}>
              {t.label}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Nombre</label>
          <p className="text-xs text-gray-500 mb-2">Te ayudará a identificar tu cupón en el centro de promociones.</p>
          <input
            type="text"
            value={couponName}
            onChange={(e) => setCouponName(e.target.value)}
            placeholder="Cupón"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Código</label>
          <p className="text-xs text-gray-500 mb-2">Código único que los compradores usarán para obtener el descuento.</p>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="EJ: MADS20"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Descuento */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Descuento</label>
          <p className="text-xs text-gray-500 mb-3">Seleccioná el tipo de descuento que ofrecerás en cada compra.</p>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="porcentaje"
                checked={discountType === "porcentaje"}
                onChange={() => setDiscountType("porcentaje")}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Porcentaje</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="monto_fijo"
                checked={discountType === "monto_fijo"}
                onChange={() => setDiscountType("monto_fijo")}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Monto fijo</span>
            </label>
          </div>
        </div>

        {/* Condiciones */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Condiciones</label>
          <p className="text-xs text-gray-500 mb-3">Definí las características de tu cupón.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Monto mínimo de compra
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="text"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                El monto mínimo de compra es el valor total de la compra, que es igual o superior a este monto.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                Presupuesto total
                <Info size={12} className="text-gray-400" />
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="text"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Se mostrará a los compradores dependiendo del cupón y no podrá editarse.
              </p>
            </div>
          </div>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Duración</label>
          <p className="text-xs text-gray-500 mb-3">Tu cupón puede tener una vigencia máxima de un mes.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Fecha de inicio</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Fecha de finalización</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard?section=publicidad")}
          className="px-4 py-2 text-sm text-blue-600 font-medium hover:underline"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreateCoupon}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creando..." : "Crear cupón"}
        </button>
      </div>
    </div>
  );
}
