'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquareQuote,
  MoreVertical,
  Package2,
  Sparkles,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  question: string | null;
  questionDate: string | null;
  answer: string | null;
  answerDate: string | null;
  status: string;
  shipping: string | null;
  installments: string | null;
}

interface ApiResponse {
  questions: QuestionItem[];
  total: number;
  isRealData: boolean;
  tableExists: boolean;
}

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

function getStockText(stock: number): string | null {
  if (stock <= 0) return 'Sin stock por el momento';
  if (stock <= 10) return `Quedan solo ${stock} unidades`;
  return 'Hay stock disponible';
}

export default function PreguntasView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/questions')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        const answered = new Set<string>();
        d.questions.forEach((q) => {
          if (q.answer && q.question) answered.add(q.id);
        });
        setExpandedIds(answered);
        setExpandAll(d.questions.length > 0 && answered.size === d.questions.filter((q) => q.question).length);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar las preguntas');
        setLoading(false);
      });
  }, []);

  const questionIds = useMemo(
    () => (data ? data.questions.filter((q) => q.question).map((q) => q.id) : []),
    [data]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandAll(questionIds.length > 0 && next.size === questionIds.length);
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    const nextExpand = !expandAll;
    setExpandAll(nextExpand);
    setExpandedIds(nextExpand ? new Set(questionIds) : new Set());
  };

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

  if (!data || data.questions.length === 0) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="mb-6 flex items-center gap-2 text-[14px]">
          <span className="font-semibold text-[#3483fa]">Compras</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-500 dark:text-slate-400">Preguntas</span>
        </div>
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <h3 className="mb-2 text-[18px] font-semibold text-slate-900 dark:text-slate-100">No tenés preguntas</h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400">Cuando hagas preguntas sobre productos, aparecerán acá.</p>
        </div>
      </div>
    );
  }

  const { questions, total, isRealData } = data;
  const answeredCount = questions.filter((q) => q.answer).length;

  return (
    <div className="max-w-[1040px] w-full pb-12">
      <div className="mb-6 flex items-center gap-2 text-[14px]">
        <span className="font-semibold text-[#3483fa]">Compras</span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <span className="text-slate-500 dark:text-slate-400">Preguntas</span>
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
              Seguimiento de preguntas
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Tus preguntas, más claras y listas para retomar la compra.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Revisá respuestas, compará contexto del producto y volvé a preguntar sin perder visibilidad dentro del panel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{total}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">preguntas</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{answeredCount}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">respondidas</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{total - answeredCount}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">pendientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-[14px] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-100 dark:hover:bg-slate-800">
          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          Todas las fechas
          <ChevronDown className="ml-1 h-4 w-4 text-slate-700 dark:text-slate-300" />
        </button>

        <div className="flex items-center gap-6 text-[14px] text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">1 - {total} de {total} preguntas</span>
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700 dark:text-slate-200">Ampliar todas</span>
            <button
              type="button"
              aria-pressed={expandAll}
              onClick={handleToggleExpandAll}
              className={`relative h-6 w-11 rounded-full transition-colors ${expandAll ? 'bg-[#3483fa]' : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.28)] transition-transform ${
                  expandAll ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const stockText = getStockText(item.stock);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92"
            >
              <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
                <div className="flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900">
                      <Package2 className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-[220px] flex-1 pr-4">
                  <h4 className="text-[17px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.productTitle}</h4>
                  <a
                    href={`/producto/${item.productId}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#3483fa] hover:text-blue-700"
                  >
                    {item.sellerName ? `Ver más productos de ${item.sellerName}` : 'Ir a la página del vendedor'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="w-[150px] flex-shrink-0">
                  <span className="block text-[22px] font-semibold leading-none text-slate-900 dark:text-slate-100">
                    {formatPrice(item.price)}
                  </span>
                  {item.comparePrice && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[14px] text-slate-500 dark:text-slate-400">{formatPrice(item.comparePrice)}</span>
                    </div>
                  )}
                  {item.installments && (
                    <p className="mt-1 text-[14px] leading-tight text-[#00a650]">{item.installments}</p>
                  )}
                </div>

                <div className="w-[190px] flex-shrink-0">
                  {stockText && (
                    <p className={`text-[14px] font-medium ${item.stock <= 3 ? 'text-[#ff7733]' : 'text-slate-500 dark:text-slate-400'}`}>
                      {stockText}
                    </p>
                  )}
                  {item.shipping && <p className="mt-1 text-[14px] leading-tight text-[#00a650]">{item.shipping}</p>}
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <button className="rounded-xl bg-[#3483fa] px-6 py-2.5 text-[16px] font-semibold text-white transition-colors hover:bg-[#2968c8]">
                    Comprar
                  </button>
                  <button className="flex items-center justify-center rounded-full p-2 text-[#3483fa] transition-colors hover:bg-[#f0f4ff] dark:hover:bg-slate-800">
                    <MoreVertical className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

              <div className="px-6 py-4">
                <a
                  href={`/producto/${item.productId}#preguntas`}
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#3483fa] hover:text-blue-700"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Hacer otra pregunta
                </a>
              </div>

              {item.question && (
                <>
                  <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

                  <div className="flex items-start justify-between gap-4 px-6 py-5">
                    <div className="flex w-full flex-col gap-3">
                      <p className="text-[14px] text-slate-800 dark:text-slate-200">
                        {item.question}{' '}
                        <span className="ml-1 text-[13px] text-slate-400">- {item.questionDate}</span>
                      </p>

                      {item.answer && isExpanded && (
                        <div className="relative mt-1 flex gap-0">
                          <div className="mt-0.5 ml-1 mr-3 h-5 w-5 flex-shrink-0 rounded-bl-sm border-b-2 border-l-2 border-slate-200 dark:border-slate-700"></div>
                          <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                            {item.answer}{' '}
                            {item.answerDate && <span className="ml-1 text-[13px] text-slate-400">- {item.answerDate}</span>}
                          </p>
                        </div>
                      )}
                    </div>

                    <button onClick={() => toggleExpand(item.id)} className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
