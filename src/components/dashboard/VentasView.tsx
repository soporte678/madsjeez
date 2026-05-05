"use client";

import React, { useState } from "react";
import {
  Search,
  Info,
  ChevronDown,
  Filter,
  MoreVertical,
  MessageSquare,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Zap,
  FileText,
} from "lucide-react";

type Tab = "hoy" | "proximos" | "transito" | "finalizadas";

const VentasView: React.FC = () => {
  const [tab, setTab] = useState<Tab>("hoy");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === orders[tab].length) setSelected([]);
    else setSelected(orders[tab].map((o) => o.id));
  };

  const tabsConfig: { id: Tab; label: string; count?: number }[] = [
    { id: "hoy", label: "Envíos de hoy", count: 9 },
    { id: "proximos", label: "Próximos días", count: 9 },
    { id: "transito", label: "En tránsito", count: 22 },
    { id: "finalizadas", label: "Finalizadas" },
  ];

  const summaryCards: Record<
    Tab,
    { title: string; subtitle: string; status: string; count: number; type: "flex" | "full" | "mixed" }[]
  > = {
    hoy: [
      { title: "PRÓXIMO A DESPACHAR", subtitle: "Flex", status: "Reprogramadas", count: 1, type: "flex" },
      { title: "EN SEGUIMIENTO", subtitle: "Full", status: "En centro de almacenamiento", count: 8, type: "full" },
    ],
    proximos: [
      { title: "Flex | Mañana", subtitle: "Etiquetas por imprimir", status: "", count: 4, type: "flex" },
      { title: "Correo | Mañana", subtitle: "Etiquetas por imprimir", status: "", count: 4, type: "full" },
      { title: "Devoluciones", subtitle: "En camino", status: "", count: 1, type: "mixed" },
    ],
    transito: [
      { title: "Por retirar", subtitle: "Esperando retiro del comprador", status: "", count: 4, type: "mixed" },
      { title: "En camino", subtitle: "Flex: 1, Correo: 14, Full: 3", status: "", count: 18, type: "mixed" },
    ],
    finalizadas: [
      { title: "Cerradas", subtitle: "Entregadas: 258, No entregadas: 38, Canceladas: 8, Devoluciones completadas: 32, Devoluciones no concretadas: 10", status: "", count: 346, type: "mixed" },
    ],
  };

  const orders: Record<
    Tab,
    {
      id: string;
      orderId: string;
      date: string;
      reputation: string;
      shipping: string;
      buyer: string;
      username: string;
      status: string;
      statusDetail: string;
      product: string;
      price: string;
      qty: string;
      sku: string;
      tag?: string;
      actionLabel: string;
      actionType: "blue" | "outline";
      messages?: number;
    }[]
  > = {
    hoy: [
      {
        id: "1",
        orderId: "2000012814745185",
        date: "4 may, 22:02 hs",
        reputation: "No afecta tu reputación",
        shipping: "FULL",
        buyer: "carina suazo",
        username: "SUAZOCARINA",
        status: "Procesando en la bodega",
        statusDetail: "Llega el miércoles 6 de mayo",
        product: "Soporte De Tanque Plástico Para Motoguadañas 43 Y 52cc",
        price: "$ 3.899",
        qty: "1 unidad",
        sku: "MAQJEEZ-00034",
        actionLabel: "Seguir envío",
        actionType: "blue",
        messages: 0,
      },
      {
        id: "2",
        orderId: "2000012620232962",
        date: "4 may, 11:41 hs",
        reputation: "No afecta tu reputación",
        shipping: "FULL",
        buyer: "Ferrer Marianela",
        username: "MIRKOPIE252",
        status: "Procesando en la bodega",
        statusDetail: "Llega mañana",
        product: "Tapa Arranque Cilambre + Cazoleta Desmalezadoras Chinas",
        price: "$ 39.999",
        qty: "1 unidad",
        sku: "MAQJEEZ-00031",
        actionLabel: "Seguir envío",
        actionType: "blue",
        messages: 0,
      },
    ],
    proximos: [
      {
        id: "3",
        orderId: "2000012815083797",
        date: "4 may, 22:19 hs",
        reputation: "No afecta tu reputación",
        shipping: "",
        buyer: "Alfredo Javier",
        username: "JALPARO243",
        status: "Etiqueta lista para imprimir",
        statusDetail: "Tenés que despachar el paquete hoy o mañana en Correo Argentino",
        product: "Bomba Sin Fin Aceite Mangueiras Filtro Motosierra 45cc 52cc",
        price: "$ 33.999",
        qty: "1 unidad",
        sku: "MAQJEEZ-00014",
        tag: "Etiqueta lista para imprimir",
        actionLabel: "Imprimir etiqueta",
        actionType: "blue",
        messages: 0,
      },
      {
        id: "4",
        orderId: "2000012814713503",
        date: "4 may, 21:59 hs",
        reputation: "No afecta tu reputación",
        shipping: "FLEX",
        buyer: "claudio lopez",
        username: "LOPEZ23CLAUD...",
        status: "Etiqueta lista para imprimir",
        statusDetail: "Tenés que cortar el paquete a tu conductor mañana.",
        product: "Paquete de 2 productos",
        price: "$ 42.800",
        qty: "2 unidades",
        sku: "",
        tag: "Etiqueta lista para imprimir",
        actionLabel: "Imprimir etiqueta",
        actionType: "blue",
        messages: 0,
      },
    ],
    transito: [
      {
        id: "5",
        orderId: "2000012803531107",
        date: "4 may, 11:51 hs",
        reputation: "No afecta tu reputación",
        shipping: "FULL",
        buyer: "Pablo Diego Di Martino",
        username: "PADLODIGOO...",
        status: "En camino",
        statusDetail: "Llega mañana al centro de envío",
        product: "Kunini Cm-0020 Cadena Repuesto Motosierra 20 Peso 325 - ...",
        price: "$ 35.999",
        qty: "1 unidad",
        sku: "MAQJEEZ-00022",
        actionLabel: "Seguir envío",
        actionType: "blue",
        messages: 0,
      },
      {
        id: "6",
        orderId: "2000012622405946",
        date: "4 may, 11:15 hs",
        reputation: "No afecta tu reputación",
        shipping: "",
        buyer: "Beatriz Santa Ledesma",
        username: "LEDESMABEAT...",
        status: "En camino",
        statusDetail: "Llega entre el 8 y 13 de mayo",
        product: "Caja Engranajes Desmalezadora 9 Estrias 28mm + Cuchilla 3p...",
        price: "$ 48.699",
        qty: "1 unidad",
        sku: "",
        actionLabel: "Seguir envío",
        actionType: "blue",
        messages: 0,
      },
    ],
    finalizadas: [
      {
        id: "7",
        orderId: "2000012778140023",
        date: "2 may, 16:32 hs",
        reputation: "No afecta tu reputación",
        shipping: "FLEX",
        buyer: "Angel Clemente Putr",
        username: "PA2024070031...",
        status: "Entregado",
        statusDetail: "Llegó el 4 de mayo",
        product: "Bomba Sin Fin Aceite Mangueiras Filtro Motosierra 45cc 52cc",
        price: "$ 34.799",
        qty: "1 unidad",
        sku: "MAQJEEZ-00054",
        actionLabel: "Ver detalle",
        actionType: "outline",
        messages: 0,
      },
      {
        id: "8",
        orderId: "2000012777035541",
        date: "2 may, 15:12 hs",
        reputation: "No afecta tu reputación",
        shipping: "FLEX",
        buyer: "EDGARDO AMSTOR MARTIN",
        username: "MAHANGO000...",
        status: "Entregado",
        statusDetail: "Llegó el 4 de mayo",
        product: "Tapa Arranque Roci + Cazoleta Desmalezadoras Chinas 43-52cc",
        price: "$ 39.999",
        qty: "1 unidad",
        sku: "MAQJEEZ-00070",
        actionLabel: "Ver detalle",
        actionType: "outline",
        messages: 0,
      },
    ],
  };

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-[26px] font-semibold text-gray-800">Ventas</h1>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabsConfig.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tab === t.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  tab === t.id ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50">
            Gestionar Posventa <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards[tab].map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className="flex items-center gap-1">
                {card.type === "flex" && <Zap size={14} className="text-blue-500" />}
                {card.type === "full" && <Package size={14} className="text-blue-500" />}
                {card.count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
                    {card.count}
                  </span>
                )}
                <Info size={14} className="text-gray-400" />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800">{card.subtitle}</div>
            {card.status && (
              <div className="text-xs text-gray-500 mt-0.5">{card.status}</div>
            )}
          </div>
        ))}
        {/* Placeholder empty cards to fill grid */}
        {Array.from({ length: Math.max(0, 4 - summaryCards[tab].length) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-100 rounded-xl border border-gray-200 p-4 min-h-[80px]" />
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
          Últimos 2 meses <ChevronDown size={14} />
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
          <Filter size={14} /> Filtrar y ordenar
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">{orders[tab].length} ventas</span>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={selected.length === orders[tab].length && orders[tab].length > 0}
            onChange={selectAll}
          />
          <span className="text-xs text-gray-700">Seleccioná ventas para accionar masivamente</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-xs text-gray-500 hover:text-gray-700">Enviar facturas</button>
          <button className="text-xs text-gray-500 hover:text-gray-700">Imprimir facturas</button>
          <button className="text-xs text-gray-500 hover:text-gray-700">Imprimir etiquetas</button>
          <button className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
            <FileText size={14} /> Descargar Excel de ventas <Info size={12} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {orders[tab].map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Order header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selected.includes(order.id)}
                onChange={() => toggleSelect(order.id)}
              />
              {order.shipping && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    order.shipping === "FULL"
                      ? "bg-yellow-400 text-gray-800"
                      : order.shipping === "FLEX"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {order.shipping}
                </span>
              )}
              <span className="text-xs text-gray-500">#{order.orderId}</span>
              <span className="text-xs text-gray-400">{order.date}</span>
              <span className="text-xs text-gray-500">{order.reputation}</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">{order.buyer}</span>
                <span className="text-xs text-blue-600 font-medium">{order.username}</span>
                {order.messages !== undefined && (
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <MessageSquare size={14} /> {order.messages > 0 ? `Mensajes (${order.messages})` : "Mensajes"}
                  </button>
                )}
              </div>
            </div>

            {/* Order body */}
            <div className="p-4">
              {order.tag && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {order.tag}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {tab === "finalizadas" ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <Truck size={16} className="text-blue-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{order.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{order.statusDetail}</p>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <Package size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{order.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{order.price}</p>
                      <p className="text-xs text-gray-500">{order.qty}</p>
                      {order.sku && <p className="text-[10px] text-gray-400">SKU: {order.sku}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      order.actionType === "blue"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {order.actionLabel}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Info size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VentasView;
