'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  MessageSquareHeart,
  Package2,
  Sparkles,
  Star,
  ThumbsUp,
} from 'lucide-react';

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

function renderStars(count: number, activeColor: string) {
  return [1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      className={`h-5 w-5 ${star <= count ? activeColor : 'text-slate-300 dark:text-slate-600'}`}
      fill={star <= count ? 'currentColor' : 'none'}
    />
  ));
}

export default function OpinionesView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'realizadas'>('pendientes');
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});

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

  const pendingCount = data?.pending.length ?? 0;
  const completedCount = data?.completed.length ?? 0;
  const averageRating = useMemo(() => {
    if (!data?.completed.length) return 0;
    const total = data.completed.reduce((acc, item) => acc + item.rating, 0);
    return total / data.completed.length;
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#3483fa]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-12 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <p className="text-[16px] text-slate-800 dark:text-slate-100">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-[10px] bg-[#3483fa] px-6 py-2 text-white transition-colors hover:bg-[#2968c8]"
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
    <div className="max-w-[1040px] w-full pb-12">
      <div className="mb-6 flex items-center gap-2 text-[14px]">
        <span className="font-semibold text-[#3483fa]">Compras</span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <span className="text-slate-500 dark:text-slate-400">Opiniones</span>
        {isRealData && (
          <span className="ml-2 rounded-full bg-[#00a650] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Datos reales
          </span>
        )}
      </div>

      <div className="mb-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-[#0f172a] via-[#131d31] to-[#1d3557] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#7dd3fc]" />
              Reputaci&oacute;n de compra
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Opin&aacute; con claridad y cuid&aacute; tu historial de compra.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Desde ac&aacute; pod&eacute;s revisar productos pendientes, retomar el pedido correcto y dejar opiniones que ayuden a otros compradores.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{pendingCount}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">pendientes</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{completedCount}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">realizadas</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">promedio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-[22px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all ${
              activeTab === 'pendientes'
                ? 'bg-[#3483fa] text-white shadow-[0_10px_25px_rgba(52,131,250,0.28)]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setActiveTab('realizadas')}
            className={`rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all ${
              activeTab === 'realizadas'
                ? 'bg-[#3483fa] text-white shadow-[0_10px_25px_rgba(52,131,250,0.28)]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Realizadas
          </button>
        </div>

        <div className="flex flex-col gap-3 text-[14px] sm:flex-row sm:items-center sm:gap-5">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Todas las fechas
          </button>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {activeTab === 'pendientes'
              ? `1 - ${pendingCount} de ${pendingCount} opiniones pendientes`
              : `1 - ${completedCount} de ${completedCount} opiniones realizadas`}
          </span>
        </div>
      </div>

      {activeTab === 'pendientes' && pending.length === 0 && (
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <h3 className="mb-2 text-[18px] font-semibold text-slate-900 dark:text-slate-100">No ten&eacute;s opiniones pendientes</h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400">Cuando recibas pedidos entregados, vas a poder calificarlos desde ac&aacute;.</p>
        </div>
      )}

      {activeTab === 'realizadas' && completed.length === 0 && (
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <h3 className="mb-2 text-[18px] font-semibold text-slate-900 dark:text-slate-100">Todav&iacute;a no hiciste opiniones</h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400">Tus valoraciones completadas van a aparecer ac&aacute; con su historial.</p>
        </div>
      )}

      <div className="space-y-4">
        {activeTab === 'pendientes' &&
          pending.map((item) => {
            const selectedRating = draftRatings[item.id] ?? 0;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92"
              >
                <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
                  <div className="flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productTitle} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900">
                        <Package2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#3483fa]">Pendiente de opini&oacute;n</p>
                    <h3 className="mt-2 text-[18px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.productTitle}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-slate-500 dark:text-slate-400">
                      <span>{item.purchaseDate}</span>
                      {item.sellerName && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Vendedor: {item.sellerName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full max-w-[320px] rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-950/70">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Marc&aacute; una calificaci&oacute;n preliminar</p>
                    <div className="mt-3 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= selectedRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setDraftRatings((prev) => ({
                                ...prev,
                                [item.id]: star,
                              }))
                            }
                            className="rounded-full p-1 transition-transform hover:scale-105"
                            aria-label={`Calificar con ${star} estrellas`}
                          >
                            <Star
                              className={`h-7 w-7 ${active ? 'text-[#3483fa]' : 'text-slate-300 dark:text-slate-600'}`}
                              fill={active ? 'currentColor' : 'none'}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                      {selectedRating > 0
                        ? `Elegiste ${selectedRating} estrella${selectedRating > 1 ? 's' : ''}. Abrimos el pedido para completar la opini&oacute;n final.`
                        : 'Eleg&iacute; una puntuaci&oacute;n para seguir al detalle del pedido y completar la rese&ntilde;a.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200/80 px-6 py-4 dark:border-slate-700/80 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={`/orders/${item.orderId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#2968c8]"
                  >
                    Completar opini&oacute;n
                  </a>
                  <a
                    href={`/product/${item.productId}`}
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#3483fa] hover:text-blue-700"
                  >
                    Ver producto
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}

        {activeTab === 'realizadas' &&
          completed.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92"
            >
              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
                <div className="flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900">
                      <Package2 className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-emerald-500">Opini&oacute;n publicada</p>
                  <h3 className="mt-2 text-[18px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.productTitle}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">{renderStars(item.rating, 'text-[#3483fa]')}</div>
                    <span className="text-[13px] text-slate-500 dark:text-slate-400">{item.date}</span>
                  </div>
                  {item.comment && (
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-950/70">
                      <p className="text-[14px] leading-7 text-slate-600 dark:text-slate-300">{item.comment}</p>
                    </div>
                  )}
                </div>

                <div className="flex w-full max-w-[220px] flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-950/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Reacci&oacute;n</span>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-[14px] font-semibold">{item.likes}</span>
                    </div>
                  </div>
                  <a
                    href={`/product/${item.productId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Ver producto
                  </a>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92">
        <div className="flex items-start gap-3">
          <MessageSquareHeart className="mt-0.5 h-5 w-5 text-[#3483fa]" />
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Consejo para dejar mejores opiniones</h3>
            <p className="mt-1 text-[14px] leading-6 text-slate-500 dark:text-slate-400">
              Cont&aacute; si el producto lleg&oacute; como esperabas, si el env&iacute;o fue correcto y si volver&iacute;as a comprar. Eso mejora la confianza del marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
