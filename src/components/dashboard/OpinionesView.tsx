'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

interface PendingOpinion {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  purchaseDate: string;
}

interface CompletedOpinion {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  rating: number;
  comment: string | null;
  date: string;
  likes: number;
}

interface ApiResponse {
  pending: PendingOpinion[];
  completed: CompletedOpinion[];
  isRealData: boolean;
  tableExists: boolean;
}

export default function OpinionesView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'realizadas'>('pendientes');

  useEffect(() => {
    fetch('/api/dashboard/opiniones')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar las opiniones');
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

  if (!data) return null;

  const { pending, completed, isRealData } = data;

  return (
    <div className="max-w-[1000px] w-full pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold text-[#333333]">Opiniones</h1>
        {isRealData && (
          <span className="text-[10px] bg-[#00a650] text-white px-1.5 py-0.5 rounded font-bold">DATOS REALES</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-[#e6e6e6]">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`py-3 text-[14px] font-semibold border-b-[3px] transition-colors ${activeTab === 'pendientes' ? 'border-[#3483fa] text-[#3483fa]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('realizadas')}
          className={`py-3 text-[14px] font-semibold border-b-[3px] transition-colors ${activeTab === 'realizadas' ? 'border-[#3483fa] text-[#3483fa]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
        >
          Realizadas
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] text-[#666]">
          {activeTab === 'pendientes'
            ? 'Opina y ayuda a más personas'
            : 'Gracias por contribuir con la comunidad'}
        </span>
        <span className="text-[14px] text-[#999]">
          {activeTab === 'pendientes'
            ? `1 - ${pending.length} de ${pending.length} opiniones pendientes`
            : `1 - ${completed.length} de ${completed.length} opiniones realizadas`}
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {activeTab === 'pendientes' && pending.length === 0 && (
          <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
            <p className="text-[16px] text-[#333] font-semibold mb-2">No tenés opiniones pendientes</p>
            <p className="text-[14px] text-[#666]">Cuando compres productos, podrás calificarlos aquí.</p>
          </div>
        )}

        {activeTab === 'realizadas' && completed.length === 0 && (
          <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
            <p className="text-[16px] text-[#333] font-semibold mb-2">Aún no has realizado opiniones</p>
            <p className="text-[14px] text-[#666]">Cuando califiques un producto, aparecerá aquí.</p>
          </div>
        )}

        {activeTab === 'pendientes' &&
          pending.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden p-5 flex flex-col md:flex-row items-center gap-6 hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.15)] transition-shadow cursor-pointer"
            >
              <div className="flex flex-1 items-center gap-4 w-full">
                <div className="w-12 h-12 flex-shrink-0 border border-[#e6e6e6] rounded flex items-center justify-center p-0.5">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center text-[#999] text-[10px]">Sin imagen</div>
                  )}
                </div>
                <h4 className="text-[14px] text-[#333333] font-light leading-snug line-clamp-2 pr-4 w-[40%]">
                  {item.productTitle}
                </h4>
                <div className="flex items-center gap-1 mx-auto flex-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-[30px] h-[30px] text-[#cccccc] hover:text-[#3483fa] stroke-[1.5px] cursor-pointer transition-colors"
                    />
                  ))}
                </div>
              </div>
              <div className="w-[200px] text-right flex-shrink-0">
                <span className="text-[13px] text-[#999999]">{item.purchaseDate}</span>
              </div>
            </div>
          ))}

        {activeTab === 'realizadas' &&
          completed.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden p-5 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="flex flex-1 items-center gap-4 w-full">
                <div className="w-12 h-12 flex-shrink-0 border border-[#e6e6e6] rounded flex items-center justify-center p-0.5">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center text-[#999] text-[10px]">Sin imagen</div>
                  )}
                </div>
                <h4 className="text-[14px] text-[#333333] font-semibold leading-snug line-clamp-2 pr-4 w-[40%]">
                  {item.productTitle}
                </h4>
                <div className="flex items-center gap-1 mx-auto flex-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-[24px] h-[24px] ${star <= item.rating ? 'fill-[#3483fa] text-[#3483fa] stroke-[#3483fa]' : 'text-[#cccccc] stroke-[#cccccc] stroke-[1.5px]'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="w-[300px] flex items-center justify-end gap-6 flex-shrink-0">
                <span className="text-[12px] text-[#999999]">{item.date}</span>
                <div className="flex items-center gap-1.5 text-[#999999] cursor-pointer hover:text-[#3483fa] transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-[13px]">{item.likes}</span>
                </div>
                <button className="bg-[#3483fa] hover:bg-blue-600 text-white font-semibold text-[14px] py-1.5 px-4 rounded-md transition-colors">
                  Editar opinión
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
