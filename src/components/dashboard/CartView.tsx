"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plane, Info, Trash2, Loader2, ShoppingCart } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: { url: string }[];
    seller: { id: string; name: string } | null;
  };
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

interface CartResponse {
  cart: {
    items: CartItem[];
  } | null;
  summary: CartSummary | null;
}

function formatCurrency(value: number): string {
  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);
  return `$ ${intPart.toLocaleString('es-AR')}${decPart > 0 ? `,${decPart.toString().padStart(2, '0')}` : ''}`;
}

function formatCurrencyDetailed(value: number): { int: string; dec: string } {
  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);
  return {
    int: `$ ${intPart.toLocaleString('es-AR')}`,
    dec: decPart.toString().padStart(2, '0'),
  };
}

export default function CartView() {
  const [data, setData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  async function fetchCart() {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error('Error al cargar carrito');
      const d = await res.json();
      setData(d);
    } catch (err) {
      setError('No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCart();
  }, []);

  async function updateQuantity(itemId: string, newQty: number) {
    setUpdatingItem(itemId);
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (res.ok) fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    } finally {
      setUpdatingItem(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdatingItem(itemId);
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      if (res.ok) fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setUpdatingItem(null);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto pb-12 pt-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3483fa]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1200px] mx-auto pb-12 pt-6">
        <div className="bg-white rounded-md shadow-sm border border-[#e6e6e6] p-12 text-center">
          <p className="text-[16px] text-[#333]">{error}</p>
          <button onClick={fetchCart} className="mt-4 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold py-2 px-6 rounded-[6px]">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const items = data?.cart?.items || [];
  const summary = data?.summary;

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[1200px] mx-auto pb-12 pt-6">
        <div className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-16 text-center">
          <ShoppingCart className="w-16 h-16 text-[#ccc] mx-auto mb-4" />
          <h2 className="text-[20px] font-semibold text-[#333] mb-2">Tu carrito está vacío</h2>
          <p className="text-[14px] text-[#666] mb-6">¿No sabés qué comprar? ¡Miles de productos te esperan!</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold text-[16px] py-3 px-8 rounded-[6px] transition-colors"
          >
            Descubrir ofertas
          </button>
        </div>
      </div>
    );
  }

  // Agrupar items por vendedor
  const itemsBySeller: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    const sellerId = item.product.seller?.id || 'unknown';
    if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
    itemsBySeller[sellerId].push(item);
  });

  const subtotalFormatted = summary ? formatCurrencyDetailed(summary.subtotal) : { int: '$ 0', dec: '00' };
  const shippingFormatted = summary ? formatCurrencyDetailed(summary.shippingCost) : { int: '$ 0', dec: '00' };
  const taxFormatted = summary ? formatCurrencyDetailed(summary.tax) : { int: '$ 0', dec: '00' };
  const totalFormatted = summary ? formatCurrencyDetailed(summary.total) : { int: '$ 0', dec: '00' };

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-12 pt-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* COLUMNA IZQUIERDA: PRODUCTOS */}
        <div className="flex-1 space-y-4">
          {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
            const sellerName = sellerItems[0].product.seller?.name || 'Vendedor';
            return (
              <div key={sellerId} className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden">
                {/* Header del Vendedor */}
                <div className="px-6 py-4 border-b border-[#e6e6e6] flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3483fa] cursor-pointer" />
                    <span className="font-semibold text-[14px] text-[#333] flex items-center gap-1 cursor-pointer">
                      Productos de <Plane className="w-4 h-4 text-[#f23d4f] fill-current transform rotate-45 ml-1" />
                      <i className="text-[#f23d4f] not-italic">{sellerName}</i>
                      <ChevronRight className="w-4 h-4 text-[#999]" />
                    </span>
                  </div>
                  <p className="text-[12px] text-[#666] ml-7 mt-0.5">Envío estándar</p>
                </div>

                {/* Items del vendedor */}
                {sellerItems.map((item) => {
                  const isUpdating = updatingItem === item.id;
                  const itemSubtotal = item.price * item.quantity;
                  const itemFmt = formatCurrencyDetailed(item.price);
                  const itemTotalFmt = formatCurrencyDetailed(itemSubtotal);
                  return (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-stretch border-b border-[#e6e6e6] last:border-b-0">
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#3483fa] mt-4 cursor-pointer" />

                      <div className="w-[72px] h-[72px] border border-[#e6e6e6] rounded p-1 flex-shrink-0 flex items-center justify-center cursor-pointer bg-white">
                        <img
                          src={item.product.images[0]?.url || 'https://via.placeholder.com/80?text=Producto'}
                          alt={item.product.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex flex-col">
                          <a href={`/product/${item.product.id}`} className="text-[14px] text-[#333] font-semibold leading-snug hover:text-[#3483fa] line-clamp-2 max-w-[350px]">
                            {item.product.title}
                          </a>
                          <div className="mt-auto pt-4 flex items-center">
                            <div className="flex items-center border border-[#e6e6e6] rounded bg-white shadow-sm overflow-hidden h-8">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="w-8 h-full flex items-center justify-center text-[#ccc] text-lg hover:text-[#3483fa] transition-colors disabled:opacity-50"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : '-'}
                              </button>
                              <span className="w-8 h-full flex items-center justify-center text-[14px] text-[#333]">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="w-8 h-full flex items-center justify-center text-[#3483fa] text-lg hover:text-blue-700 transition-colors disabled:opacity-50"
                              >
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : '+'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={isUpdating}
                              className="text-[#3483fa] hover:text-blue-700 transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                          </div>
                          <div className="mt-4 flex items-center gap-1 text-[#333]">
                            <Info className="w-[14px] h-[14px] text-[#3483fa] cursor-pointer" />
                            <div className="flex items-start text-[20px] font-light">
                              {itemTotalFmt.int}<span className="text-[12px] font-semibold mt-[3px] ml-[2px]">{itemTotalFmt.dec}</span>
                            </div>
                          </div>
                          {item.quantity > 1 && (
                            <span className="text-[12px] text-[#999] mt-1">
                              {itemFmt.int} c/u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE COMPRA */}
        <div className="w-full lg:w-[384px] flex-shrink-0">
          <div className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] p-6 sticky top-20">
            <h3 className="text-[18px] font-semibold text-[#333] mb-6">Resumen de compra</h3>

            <div className="space-y-4 border-b border-[#e6e6e6] pb-6 mb-5">
              <div className="flex justify-between text-[14px] text-[#333]">
                <span>Productos ({summary?.itemCount || 0})</span>
                <span className="flex items-start">{subtotalFormatted.int}<sup className="text-[10px] mt-0.5 ml-0.5">{subtotalFormatted.dec}</sup></span>
              </div>
              <div className="flex justify-between text-[14px] text-[#333]">
                <span>Envío</span>
                <div className="flex items-center gap-1.5">
                  {summary && summary.shippingCost === 0 ? (
                    <span className="text-[#00a650] font-semibold">Gratis</span>
                  ) : (
                    <span className="flex items-start">{shippingFormatted.int}<sup className="text-[10px] mt-0.5 ml-0.5">{shippingFormatted.dec}</sup></span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[14px] text-[#333]">
                <span>Impuestos estimados (IVA)</span>
                <span className="flex items-start">{taxFormatted.int}<sup className="text-[10px] mt-0.5 ml-0.5">{taxFormatted.dec}</sup></span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-[18px] font-semibold text-[#333]">Total</span>
              <span className="text-[24px] font-light text-[#333] flex items-start">
                {totalFormatted.int}<sup className="text-[14px] font-semibold mt-1 ml-0.5">{totalFormatted.dec}</sup>
              </span>
            </div>

            <button className="w-full bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold text-[16px] py-3.5 rounded-[6px] transition-colors shadow-sm">
              Continuar ({summary?.itemCount || 0})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
