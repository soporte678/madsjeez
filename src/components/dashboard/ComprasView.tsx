'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface CompraItem {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  total: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  productTitle: string;
  productImage: string | null;
  productQuantity: number;
  productPrice: number;
  sellerName: string | null;
  createdAt: string;
}

interface ApiResponse {
  compras: CompraItem[];
  total: number;
  isRealData: boolean;
  tableExists: boolean;
}

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'DELIVERED':
      return <CheckCircle2 className="w-4 h-4 text-[#00a650]" />;
    case 'SHIPPED':
      return <Truck className="w-4 h-4 text-[#3483fa]" />;
    case 'PENDING':
      return <Clock className="w-4 h-4 text-[#f23d4f]" />;
    case 'CANCELLED':
    case 'REFUNDED':
      return <XCircle className="w-4 h-4 text-[#999]" />;
    default:
      return <Package className="w-4 h-4 text-[#3483fa]" />;
  }
}

export default function ComprasView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/compras')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar las compras');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1000px] w-full pb-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3483fa]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1000px] w-full pb-12">
        <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-12 text-center">
          <p className="text-[16px] text-[#333]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-2 px-6 rounded-[6px] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.compras.length === 0) {
    return (
      <div className="max-w-[1000px] w-full pb-12">
        <div className="flex items-center gap-2 text-[14px] mb-6">
          <span className="text-[#3483fa] font-semibold">Compras</span>
        </div>
        <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
          <Package className="w-16 h-16 text-[#e6e6e6] mx-auto mb-4" />
          <h3 className="text-[18px] text-[#333] font-semibold mb-2">No tenés compras</h3>
          <p className="text-[14px] text-[#666]">Cuando compres productos, aparecerán aquí.</p>
          <button className="mt-6 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold text-[14px] py-2 px-6 rounded-[6px] transition-colors">
            Descubrir productos
          </button>
        </div>
      </div>
    );
  }

  const { compras, isRealData } = data;

  return (
    <div className="max-w-[1000px] w-full pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] mb-6">
        <span className="text-[#3483fa] font-semibold">Compras</span>
        {isRealData && (
          <span className="ml-2 text-[10px] bg-[#00a650] text-white px-1.5 py-0.5 rounded font-bold">DATOS REALES</span>
        )}
      </div>

      <h1 className="text-[24px] font-semibold text-[#333333] mb-6">Mis compras</h1>

      {/* Lista de Compras */}
      <div className="space-y-4">
        {compras.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden"
          >
            {/* Header de la orden */}
            <div className="px-6 py-4 bg-[#f5f5f5] border-b border-[#e6e6e6] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: item.statusColor }}
                  >
                    {item.statusLabel}
                  </span>
                </div>
                <span className="text-[13px] text-[#999]">|</span>
                <span className="text-[13px] text-[#666]">{item.createdAt}</span>
              </div>
              <span className="text-[13px] text-[#999]">N° {item.orderNumber}</span>
            </div>

            {/* Detalle del producto */}
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-[80px] h-[80px] flex-shrink-0 border border-[#e6e6e6] rounded flex items-center justify-center p-1">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productTitle}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center text-[#999] text-[10px]">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-[200px]">
                <h4 className="text-[16px] text-[#333333] font-light leading-snug mb-1">
                  {item.productTitle}
                </h4>
                {item.sellerName && (
                  <p className="text-[13px] text-[#666]">Vendedor: {item.sellerName}</p>
                )}
                <p className="text-[13px] text-[#999] mt-1">
                  {item.productQuantity} {item.productQuantity > 1 ? 'unidades' : 'unidad'}
                </p>
              </div>

              <div className="w-[180px] flex-shrink-0 text-right">
                <span className="text-[20px] text-[#333333] font-light block leading-none">
                  {formatPrice(item.total)}
                </span>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="px-6 py-4 border-t border-[#e6e6e6] flex items-center justify-between">
              <div className="text-[13px] text-[#666]">
                <span className="text-[#999]">Envío a: </span>
                {item.shippingCity}, {item.shippingState}
              </div>
              <div className="flex items-center gap-4">
                <button className="text-[14px] text-[#3483fa] font-semibold hover:text-blue-700 transition-colors">
                  Ver detalle
                </button>
                {item.status === 'DELIVERED' && (
                  <button className="text-[14px] text-[#3483fa] font-semibold hover:text-blue-700 transition-colors">
                    Opinar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
