'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Heart,
  ListPlus,
  Package2,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
} from 'lucide-react';

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

interface FavoriteList {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
}

const FAVORITE_LISTS_KEY = 'madsjeez_favorite_lists';

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

export default function FavoritosView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mis_favoritos' | 'listas'>('mis_favoritos');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const loadFavoritos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/favoritos', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'No se pudieron cargar los favoritos');
      setData(payload);
      setError(null);
    } catch {
      setError('No se pudieron cargar los favoritos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFavoritos();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(FAVORITE_LISTS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as FavoriteList[];
      if (Array.isArray(parsed)) setLists(parsed);
    } catch {
      localStorage.removeItem(FAVORITE_LISTS_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FAVORITE_LISTS_KEY, JSON.stringify(lists));
  }, [lists]);

  const removeFavorite = async (id: string) => {
    try {
      setBusyId(id);
      const response = await fetch(`/api/dashboard/favoritos?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
      setData((prev) =>
        prev
          ? {
              ...prev,
              favoritos: prev.favoritos.filter((item) => item.id !== id),
              total: Math.max(0, prev.total - 1),
            }
          : prev
      );
    } catch {
      setError('No se pudo eliminar el favorito');
    } finally {
      setBusyId(null);
    }
  };

  const addToCart = async (productId: string, favoriteId: string) => {
    try {
      setBusyId(favoriteId);
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setError('No se pudo agregar el producto al carrito');
    } finally {
      setBusyId(null);
    }
  };

  const createList = () => {
    const name = newListName.trim();
    if (!name) {
      setError('Escribí un nombre para la lista');
      return;
    }

    const exists = lists.some((list) => list.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setError('Ya existe una lista con ese nombre');
      return;
    }

    setLists((prev) => [
      {
        id: `list-${Date.now()}`,
        name,
        itemIds: [],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewListName('');
    setShowCreateList(false);
    setActiveTab('listas');
    setError(null);
  };

  const addToList = (favoriteId: string) => {
    if (lists.length === 0) {
      setShowCreateList(true);
      setError('Primero creá una lista para guardar este favorito');
      return;
    }

    setLists((prev) => {
      const firstList = prev[0];
      if (firstList.itemIds.includes(favoriteId)) {
        setError(`Este producto ya está en la lista "${firstList.name}"`);
        return prev;
      }

      setError(null);
      return prev.map((list, index) =>
        index === 0
          ? {
              ...list,
              itemIds: [...list.itemIds, favoriteId],
            }
          : list
      );
    });
  };

  const removeFromList = (listId: string, favoriteId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              itemIds: list.itemIds.filter((id) => id !== favoriteId),
            }
          : list
      )
    );
  };

  const deleteList = (listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
  };

  const favoritos = data?.favoritos ?? [];

  const filteredFavoritos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return favoritos;
    return favoritos.filter(
      (item) =>
        item.productTitle.toLowerCase().includes(normalized) ||
        item.sellerName?.toLowerCase().includes(normalized)
    );
  }, [favoritos, query]);

  const totalValue = useMemo(
    () => filteredFavoritos.reduce((acc, item) => acc + item.price, 0),
    [filteredFavoritos]
  );

  const listSummaries = useMemo(
    () =>
      lists.map((list) => {
        const items = favoritos.filter((favorite) => list.itemIds.includes(favorite.id));
        const total = items.reduce((acc, item) => acc + item.price, 0);
        return { ...list, items, total };
      }),
    [lists, favoritos]
  );

  if (loading) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#3483fa]"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-12 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <p className="text-[16px] text-slate-800 dark:text-slate-100">{error}</p>
          <button
            onClick={() => void loadFavoritos()}
            className="mt-4 rounded-[10px] bg-[#3483fa] px-6 py-2 text-white transition-colors hover:bg-[#2968c8]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.favoritos.length === 0) {
    return (
      <div className="max-w-[1040px] w-full pb-12">
        <div className="mb-6 flex items-center gap-2 text-[14px]">
          <span className="font-semibold text-[#3483fa]">Compras</span>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-500 dark:text-slate-400">Favoritos</span>
        </div>
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-20 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90">
          <h3 className="mb-2 text-[18px] font-semibold text-slate-900 dark:text-slate-100">No ten&eacute;s favoritos</h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400">Cuando guardes productos, los vas a ver ordenados ac&aacute;.</p>
        </div>
      </div>
    );
  }

  const { isRealData } = data;

  return (
    <div className="max-w-[1040px] w-full pb-12">
      <div className="mb-6 flex items-center gap-2 text-[14px]">
        <span className="font-semibold text-[#3483fa]">Compras</span>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <span className="text-slate-500 dark:text-slate-400">Favoritos</span>
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
              Seguimiento de favoritos
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Guard&aacute; lo mejor del marketplace y retom&aacute; la compra r&aacute;pido.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Revis&aacute; precio, env&iacute;o y vendedor desde un solo lugar. Lo que te interesa queda listo para volver al carrito o comparar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{favoritos.length}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">productos</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{filteredFavoritos.filter((item) => item.shipping).length}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">con env&iacute;o</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-2xl font-black text-white">{formatPrice(totalValue)}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">valor actual</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-[22px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('mis_favoritos')}
            className={`rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all ${
              activeTab === 'mis_favoritos'
                ? 'bg-[#3483fa] text-white shadow-[0_10px_25px_rgba(52,131,250,0.28)]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Mis favoritos
          </button>
          <button
            onClick={() => setActiveTab('listas')}
            className={`rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all ${
              activeTab === 'listas'
                ? 'bg-[#3483fa] text-white shadow-[0_10px_25px_rgba(52,131,250,0.28)]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Listas
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar en favoritos..."
              className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-[14px] text-slate-800 shadow-sm outline-none transition focus:border-[#3483fa] dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 sm:w-[260px]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreateList((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#2968c8]"
          >
            <Plus className="h-4 w-4" />
            Crear lista
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}

      {showCreateList && (
        <div className="mb-5 rounded-[22px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Nombre de la nueva lista"
              className="flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[14px] text-slate-800 shadow-sm outline-none transition focus:border-[#3483fa] dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={createList}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#2968c8]"
            >
              <ListPlus className="h-4 w-4" />
              Guardar lista
            </button>
          </div>
        </div>
      )}

      {activeTab === 'listas' ? (
        <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92">
          {listSummaries.length === 0 ? (
            <div className="max-w-2xl">
              <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Listas de favoritos</h3>
              <p className="mt-2 text-[14px] leading-7 text-slate-500 dark:text-slate-400">
                Todavía no creaste listas. Podés armar una para separar productos por negocio, reposición o compras futuras.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {listSummaries.map((list) => (
                <div
                  key={list.id}
                  className="rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-5 dark:border-slate-700/80 dark:bg-slate-950/70"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100">{list.name}</h3>
                      <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                        {list.items.length} producto{list.items.length === 1 ? '' : 's'} · {formatPrice(list.total)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteList(list.id)}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar lista
                    </button>
                  </div>

                  {list.items.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {list.items.map((item) => (
                        <div
                          key={`${list.id}-${item.id}`}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{item.productTitle}</p>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">{formatPrice(item.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromList(list.id, item.id)}
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#3483fa] hover:text-blue-700"
                          >
                            Quitar de la lista
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-[14px] text-slate-500 dark:text-slate-400">Todavía no agregaste productos a esta lista.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFavoritos.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/92 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92"
            >
              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
                <div className="flex h-[110px] w-[110px] flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900">
                      <Package2 className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[20px] font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.productTitle}</h3>
                  {item.sellerName && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
                      <span>Por {item.sellerName}</span>
                      {item.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-[#3483fa] dark:bg-blue-500/10">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          verificado
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
                    {item.oldPrice && (
                      <span className="text-[13px] text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>
                    )}
                    <span className="text-[32px] font-light leading-none text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</span>
                    {item.discount && <span className="text-[15px] font-semibold text-[#00a650]">{item.discount}</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-[14px]">
                    {item.installments && <span className="text-slate-500 dark:text-slate-400">{item.installments}</span>}
                    {item.shipping && <span className="font-semibold text-[#00a650]">{item.shipping}</span>}
                    {item.fullShipping && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Full
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-full max-w-[240px] flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700/80 dark:bg-slate-950/70">
                  <button
                    type="button"
                    onClick={() => void addToCart(item.productId, item.id)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#2968c8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {busyId === item.id ? 'Procesando...' : 'Agregar al carrito'}
                  </button>
                  <a
                    href={`/product/${item.productId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Ver producto
                  </a>
                  <button
                    type="button"
                    onClick={() => addToList(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <ListPlus className="h-4 w-4" />
                    Agregar a lista
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeFavorite(item.id)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredFavoritos.length === 0 && (
            <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-14 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/92">
              <Heart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-[18px] font-semibold text-slate-900 dark:text-slate-100">No encontramos coincidencias</h3>
              <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">Prob&aacute; con otro nombre de producto o vendedor.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
