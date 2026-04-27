'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, Calendar, MoreVertical } from 'lucide-react';

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
  if (stock <= 3) return `¡Quedan solo ${stock} unidades!`;
  if (stock <= 10) return `¡Quedan solo ${stock} unidades!`;
  if (stock > 0) return 'Hay stock disponible';
  return null;
}

export default function PreguntasView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/dashboard/questions')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        // Auto-expand answered questions
        const answered = new Set<string>();
        d.questions.forEach((q) => {
          if (q.answer && q.question) answered.add(q.id);
        });
        setExpandedIds(answered);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar las preguntas');
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  if (!data || data.questions.length === 0) {
    return (
      <div className="max-w-[1000px] w-full pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[14px] mb-6">
          <span className="text-[#3483fa] font-semibold">Compras</span>
          <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          <span className="text-[#666666]">Preguntas</span>
        </div>
        <div className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-20 text-center">
          <h3 className="text-[18px] text-[#333] font-semibold mb-2">No tenés preguntas</h3>
          <p className="text-[14px] text-[#666]">Cuando hagas preguntas sobre productos, aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  const { questions, total, isRealData } = data;

  return (
    <div className="max-w-[1000px] w-full pb-12">
      {/* Breadcrumb Meli */}
      <div className="flex items-center gap-2 text-[14px] mb-6">
        <span className="text-[#3483fa] font-semibold">Compras</span>
        <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
        <span className="text-[#666666]">Preguntas</span>
        {isRealData && (
          <span className="ml-2 text-[10px] bg-[#00a650] text-white px-1.5 py-0.5 rounded font-bold">DATOS REALES</span>
        )}
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex items-center justify-between mb-4">
        <button className="flex items-center gap-2 text-[#333] text-[14px] font-semibold bg-white border border-[#e6e6e6] rounded-md px-4 py-2 hover:bg-[#f5f5f5] transition-colors shadow-sm">
          <Calendar className="w-4 h-4 text-[#666]" />
          Todas las fechas
          <ChevronDown className="w-4 h-4 text-[#333] ml-1" />
        </button>

        <div className="flex items-center gap-6 text-[14px] text-[#666]">
          <span>1 - {total} de {total} preguntas</span>
          <div className="flex items-center gap-3">
            <span>Ampliar todas</span>
            <div className="w-9 h-5 bg-[#e6e6e6] rounded-full relative cursor-pointer hover:bg-[#ccc] transition-colors">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0 top-0 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tarjetas de Preguntas */}
      <div className="space-y-4">
        {questions.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const stockText = getStockText(item.stock);

          return (
            <div
              key={item.id}
              className="bg-white rounded-[8px] shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden"
            >
              {/* Sección Superior: Detalles del Producto */}
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Imagen del Producto */}
                <div className="w-[72px] h-[72px] flex-shrink-0 border border-[#e6e6e6] rounded bg-white flex items-center justify-center p-1">
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

                {/* Título y Link */}
                <div className="flex-1 min-w-[200px] pr-4">
                  <h4 className="text-[16px] text-[#333333] font-light leading-snug">
                    {item.productTitle}
                  </h4>
                  <a
                    href={`/producto/${item.productId}`}
                    className="text-[14px] text-[#3483fa] font-semibold mt-1.5 inline-block hover:text-blue-700"
                  >
                    {item.sellerName
                      ? `Ver más productos de ${item.sellerName}`
                      : 'Ir a la página del vendedor'}
                  </a>
                </div>

                {/* Precios y Cuotas */}
                <div className="w-[140px] flex-shrink-0">
                  <span className="text-[20px] text-[#333333] font-light block leading-none">
                    {formatPrice(item.price)}
                  </span>
                  {item.comparePrice && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[14px] text-[#333333] leading-none">
                        {formatPrice(item.comparePrice)}
                      </span>
                    </div>
                  )}
                  {item.installments && (
                    <p className="text-[14px] text-[#00a650] mt-1 leading-tight">
                      {item.installments}
                    </p>
                  )}
                </div>

                {/* Stock y Envío */}
                <div className="w-[180px] flex-shrink-0">
                  {stockText && (
                    <p
                      className={`text-[14px] ${item.stock <= 3 ? 'text-[#ff7733]' : 'text-[#999999]'}`}
                    >
                      {stockText}
                    </p>
                  )}
                  {item.shipping && (
                    <p className="text-[14px] text-[#00a650] mt-1 leading-tight">
                      {item.shipping}
                    </p>
                  )}
                </div>

                {/* Botón Comprar y Menú */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold text-[16px] py-2.5 px-6 rounded-[6px] transition-colors">
                    Comprar
                  </button>
                  <button className="text-[#3483fa] p-2 hover:bg-[#f0f4ff] rounded-full transition-colors flex items-center justify-center">
                    <MoreVertical className="w-6 h-6 text-[#3483fa]" />
                  </button>
                </div>
              </div>

              {/* Separador */}
              <div className="h-[1px] bg-[#e6e6e6] w-full"></div>

              {/* Botón "Hacer otra pregunta" */}
              <div className="px-6 py-4">
                <a
                  href={`/producto/${item.productId}#preguntas`}
                  className="text-[14px] text-[#3483fa] font-semibold hover:text-blue-700"
                >
                  Hacer otra pregunta
                </a>
              </div>

              {/* Área de Pregunta y Respuesta */}
              {item.question && (
                <>
                  <div className="h-[1px] bg-[#e6e6e6] w-full"></div>

                  <div className="px-6 py-5 flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-3 w-full">
                      {/* Pregunta expandida (Estándar) */}
                      <p className="text-[14px] text-[#333333]">
                        {item.question}{' '}
                        <span className="text-[#999999] text-[13px] ml-1">
                          - {item.questionDate}
                        </span>
                      </p>

                      {item.answer && (
                        <div className="flex gap-0 relative mt-1">
                          {/* Icono "L" de respuesta estilo Meli */}
                          <div className="w-5 h-5 border-l-2 border-b-2 border-[#e6e6e6] rounded-bl-sm mt-0.5 ml-1 mr-3 flex-shrink-0"></div>
                          <p className="text-[14px] text-[#666666] leading-relaxed">
                            {item.answer}{' '}
                            {item.answerDate && (
                              <span className="text-[#999999] text-[13px] ml-1">
                                - {item.answerDate}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Flecha de colapso/expansión */}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-[#ccc] hover:text-[#999]" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#ccc] hover:text-[#999]" />
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
