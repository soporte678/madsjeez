'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

interface FavoritoItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  verified: boolean;
  oldPrice: number | null;
  price: number;
  discount: string | null;
  installments: string | null;
  shipping: string | null;
  fullShipping: boolean;
}

interface ApiResponse {
  favoritos: FavoritoItem[];
  total: number;
  isRealData: boolean;
  tableExists: boolean;
}

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

export default function FavoritosView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mis_favoritos' | 'listas'>('mis_favoritos');

  useEffect(() => {
    fetch('/api/dashboard/favoritos')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los favoritos');
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

  if (!data || data.favoritos.length === 0) {
    return (
      <div className="max-w-[1000px] w-full pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[14px] mb-6">
          <span className="text-[#3483fa] font-semibold">Compras</span>
          <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          <span className="text-[#666666]">Favoritos</span>
        </div>
        <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
          <h3 className="text-[18px] text-[#333] font-semibold mb-2">No tenés favoritos</h3>
          <p className="text-[14px] text-[#666]">Cuando marques productos como favoritos, aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  const { favoritos, isRealData } = data;

  return (
    <div className="max-w-[1000px] w-full pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] mb-6">
        <span className="text-[#3483fa] font-semibold">Compras</span>
        <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
        <span className="text-[#666666]">Favoritos</span>
        {isRealData && (
          <span className="ml-2 text-[10px] bg-[#00a650] text-white px-1.5 py-0.5 rounded font-bold">DATOS REALES</span>
        )}
      </div>

      {/* Header con Título y Botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[24px] font-semibold text-[#333333]">Favoritos</h1>
        <button className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold text-[14px] py-1.5 px-4 rounded-[6px] transition-colors flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Crear lista
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-[#e6e6e6]">
        <button
          onClick={() => setActiveTab('mis_favoritos')}
          className={`py-3 text-[14px] font-semibold border-b-[3px] transition-colors ${activeTab === 'mis_favoritos' ? 'border-[#3483fa] text-[#3483fa]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
        >
          Mis favoritos
        </button>
        <button
          onClick={() => setActiveTab('listas')}
          className={`py-3 text-[14px] font-semibold border-b-[3px] transition-colors ${activeTab === 'listas' ? 'border-[#3483fa] text-[#3483fa]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
        >
          Listas
        </button>
      </div>

      {/* Lista de Tarjetas */}
      {activeTab === 'listas' ? (
        <div className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
          <p className="text-[16px] text-[#333] font-semibold mb-2">Aún no tenés listas</p>
          <p className="text-[14px] text-[#666]">Creá listas para organizar tus productos favoritos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6]">
          {favoritos.map((item, index) => (
            <div
              key={item.id}
              className={`p-6 flex flex-col md:flex-row gap-6 ${index !== favoritos.length - 1 ? 'border-b border-[#e6e6e6]' : ''}`}
            >
              {/* Imagen del Producto */}
              <div className="w-[120px] h-[120px] flex-shrink-0 flex items-center justify-center p-1">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productTitle} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center text-[#999] text-[10px]">Sin imagen</div>
                )}
              </div>

              {/* Detalles del Producto */}
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-[16px] text-[#333333] font-light leading-snug mb-1">
                  {item.productTitle}
                </h4>

                {/* Vendedor Oficial */}
                {item.sellerName && (
                  <div className="flex items-center gap-1 text-[12px] text-[#999999] mb-3">
                    <span>Por {item.sellerName}</span>
                    {item.verified && (
                      <svg className="w-3.5 h-3.5 text-[#3483fa]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Bloque de Precios */}
                <div className="flex flex-col mb-2">
                  {item.oldPrice && (
                    <span className="text-[12px] text-[#999999] line-through">
                      {formatPrice(item.oldPrice)}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] text-[#333333] font-light leading-none">
                      {formatPrice(item.price)}
                    </span>
                    {item.discount && (
                      <span className="text-[14px] text-[#00a650]">{item.discount}</span>
                    )}
                  </div>
                </div>

                {/* Cuotas y Envío */}
                {item.installments && (
                  <p className="text-[14px] text-[#333333] mb-1">{item.installments}</p>
                )}
                {item.shipping && (
                  <p className="text-[14px] text-[#00a650] font-semibold flex items-center gap-1">
                    {item.shipping}
                    {item.fullShipping && (
                      <span className="w-4 h-4 bg-[#00a650] text-white flex items-center justify-center rounded-sm text-[10px] font-bold ml-1 italic">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </span>
                    )}
                  </p>
                )}

                {/* Botones de Acción */}
                <div className="flex items-center gap-4 mt-4">
                  <a href="#" className="text-[14px] text-[#3483fa] font-semibold hover:text-blue-700">
                    Agregar a lista
                  </a>
                  <a href="#" className="text-[14px] text-[#3483fa] font-semibold hover:text-blue-700">
                    Eliminar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
