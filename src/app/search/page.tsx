"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
  Star,
  Package,
  Camera,
  Sparkles,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { hasValidProductImageUrl } from "@/lib/productVisibility";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  condition: string;
  shipping_free: boolean;
  sales: number;
  sold_count?: number;
  meli_item_id?: string | null;
  is_promoted?: boolean;
  primary_image: string | null;
  seller_name: string | null;
  seller_id?: string | null;
  category_name: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

function buildCategoryPath(categories: Category[], categoryId: string): Category[] {
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const path: Category[] = [];
  let cur: Category | undefined = byId[categoryId];
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.unshift(cur);
    cur = cur.parent_id ? byId[cur.parent_id] : undefined;
  }
  return path;
}

function FilterSwitch({
  title,
  subtitle,
  isActive,
  onToggle,
}: {
  title: React.ReactNode;
  subtitle?: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.1)] p-3 mb-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col pr-3 min-w-0">
        <span className="text-[13px] text-[#333] leading-tight">{title}</span>
        {subtitle && <span className="text-[11px] text-[#999] leading-tight mt-0.5">{subtitle}</span>}
      </div>
      <div
        className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${isActive ? "bg-[#3483fa]" : "bg-[#e6e6e6]"}`}
      >
        <span
          className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isActive ? "left-[18px]" : "left-[2px]"}`}
        />
      </div>
    </button>
  );
}

function FilterList({
  title,
  items,
  showMore,
  onItemClick,
  activeItem,
}: {
  title: string;
  items: { label: string; value: string }[];
  showMore?: boolean;
  onItemClick?: (value: string) => void;
  activeItem?: string;
}) {
  return (
    <div className="border-t border-[#e8e8e8] pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-[13px] font-semibold text-[#333] mb-2">{title}</h4>
      <ul className="text-[13px] text-[#666] space-y-1.5">
        {items.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              onClick={() => onItemClick?.(item.value)}
              className={`hover:text-[#3483fa] text-left w-full ${activeItem === item.value ? "text-[#3483fa] font-semibold" : ""}`}
            >
              {item.label}
            </button>
          </li>
        ))}
        {showMore && (
          <li>
            <button type="button" className="text-[#3483fa] font-semibold text-[12px] mt-1 hover:text-blue-700">
              Mostrar más
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function StarRating({ soldCount }: { soldCount: number }) {
  const rating = 4.2 + (soldCount % 8) / 10;
  const full = Math.floor(rating);
  const partial = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="flex items-center text-[#3483fa]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < full ? "fill-[#3483fa] text-[#3483fa]" : i === full && partial ? "fill-[#3483fa]/50 text-[#3483fa]" : "text-gray-300"}`}
          />
        ))}
      </span>
      <span className="text-[12px] text-[#666]">{rating.toFixed(1)}</span>
      <span className="text-[12px] text-[#999]">
        {soldCount >= 1000 ? `+${Math.floor(soldCount / 1000) * 1000} vendidos` : `${soldCount} vendidos`}
      </span>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [freeShipping, setFreeShipping] = useState(searchParams.get("free_shipping") === "true");
  const [arrivesTomorrow, setArrivesTomorrow] = useState(searchParams.get("arrives_tomorrow") === "true");
  const [wholesale, setWholesale] = useState(false);
  const [invoiceA, setInvoiceA] = useState(false);
  const [intlShipping, setIntlShipping] = useState(false);
  const [localShipping, setLocalShipping] = useState(false);
  const [bestInstallments, setBestInstallments] = useState(false);

  const [smartMode, setSmartMode] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState("");
  const [smartKeywords, setSmartKeywords] = useState<string[]>([]);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<Record<string, unknown> | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setCondition(searchParams.get("condition") || "");
    setSortBy(searchParams.get("sort") || "relevance");
    setFreeShipping(searchParams.get("free_shipping") === "true");
    setArrivesTomorrow(searchParams.get("arrives_tomorrow") === "true");
  }, [searchParams]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .order("name");
    if (data) setCategories(data as Category[]);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      searchParams.forEach((value, key) => {
        p.set(key, value);
      });
      const res = await fetch(`/api/search/listings?${p.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al cargar resultados");
        setProducts([]);
        return;
      }
      const list = (data.products || []) as Product[];
      setProducts(list.filter((p) => hasValidProductImageUrl(p.primary_image)));
    } catch {
      toast.error("Error al cargar resultados");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ q: query || null });
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setCondition("");
    setFreeShipping(false);
    setArrivesTomorrow(false);
    const q = searchParams.get("q");
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    setSmartLoading(true);
    setSmartMode(true);
    setSmartSuggestion("");
    setSmartKeywords([]);

    try {
      const res = await fetch("/api/search/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();

      if (data.products) {
        setProducts(data.products);
        setSmartSuggestion(data.suggestion || "");
        setSmartKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error("Smart search error:", error);
    } finally {
      setSmartLoading(false);
      setLoading(false);
    }
  };

  const handleImageSearch = async (file: File) => {
    setImageLoading(true);
    setImageResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/search/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.identified) {
        setImageResult(data.identified as Record<string, unknown>);
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setSmartMode(true);
          setSmartSuggestion(`Encontramos productos similares a: ${(data.identified as { product_name?: string }).product_name}`);
          setSmartKeywords((data.identified as { keywords?: string[] }).keywords || []);
        }
      }
    } catch (error) {
      console.error("Image search error:", error);
    } finally {
      setImageLoading(false);
      setImageSearchOpen(false);
    }
  };

  const searchTerm = searchParams.get("q") || "Productos";
  const activeConditionLabel =
    condition === "new"
      ? "Nuevo"
      : condition === "used"
        ? "Usado"
        : condition === "refurbished"
          ? "Reacondicionado"
          : null;

  const discount = (p: Product) =>
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const cuotas6 = (price: number) => Math.ceil(price / 6).toLocaleString("es-AR");

  const categoryPath = useMemo(() => {
    if (!selectedCategory || !categories.length) return [];
    return buildCategoryPath(categories, selectedCategory);
  }, [selectedCategory, categories]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (arrivesTomorrow) list = list.filter((p) => p.shipping_free);
    if (bestInstallments) list = list.filter((p) => (p.price ?? 0) > 0);
    return list;
  }, [products, arrivesTomorrow, bestInstallments]);

  const featuredSellerBlock = useMemo(() => {
    if (filteredProducts.length < 2) return null;
    const map = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      const sid = p.seller_id || "unknown";
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(p);
    }
    let best: { id: string; items: Product[] } | null = null;
    for (const [id, items] of map) {
      if (items.length >= 2 && (!best || items.length > best.items.length)) {
        best = { id, items };
      }
    }
    if (!best || best.id === "unknown") return null;
    const name = best.items[0]?.seller_name || "este vendedor";
    return { sellerId: best.id, sellerName: name, items: best.items };
  }, [filteredProducts]);

  const firstRowCount = 4;

  return (
    <div className="min-h-screen flex flex-col bg-[#ebebeb] font-sans selection:bg-[#3483fa] selection:text-white">
      <Navbar />

      <div className="max-w-[1184px] mx-auto px-3 sm:px-4 py-4 w-full">
        {/* Migas estilo ML — fila completa */}
        <nav className="flex items-center flex-wrap gap-x-1 gap-y-1 text-[12px] text-[#666] mb-3">
          <Link href="/" className="hover:text-[#3483fa]">
            Inicio
          </Link>
          {categoryPath.map((c) => (
            <span key={c.id} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-[#c4c4c4] flex-shrink-0" />
              <button
                type="button"
                onClick={() => updateSearchParams({ category: c.id })}
                className="hover:text-[#3483fa] capitalize"
              >
                {c.name}
              </button>
            </span>
          ))}
          {searchParams.get("q") && (
            <span className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-[#c4c4c4]" />
              <span className="text-[#333] font-medium capitalize">{searchTerm}</span>
            </span>
          )}
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* SIDEBAR FILTROS */}
          <aside className="w-full lg:w-[232px] flex-shrink-0 lg:sticky lg:top-4 lg:self-start space-y-4">
            <div className="bg-white rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)] p-3">
              <p className="text-[14px] font-semibold text-[#333] mb-3">Filtrar</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {activeConditionLabel && (
                  <span className="bg-[#f5f5f5] border border-[#ddd] rounded px-2 py-1 text-[12px] flex items-center gap-1">
                    {activeConditionLabel}
                    <button type="button" aria-label="Quitar" onClick={() => updateSearchParams({ condition: null })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {freeShipping && (
                  <span className="bg-[#f5f5f5] border border-[#ddd] rounded px-2 py-1 text-[12px] flex items-center gap-1">
                    Envío gratis
                    <button type="button" aria-label="Quitar" onClick={() => updateSearchParams({ free_shipping: null })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <FilterSwitch
                title="Precios mayoristas"
                subtitle="Descuentos por volumen"
                isActive={wholesale}
                onToggle={() => setWholesale(!wholesale)}
              />
              <FilterSwitch title="Hace Factura A" isActive={invoiceA} onToggle={() => setInvoiceA(!invoiceA)} />
              <FilterSwitch
                title="Llega mañana"
                isActive={arrivesTomorrow}
                onToggle={() => {
                  const next = !arrivesTomorrow;
                  setArrivesTomorrow(next);
                  updateSearchParams({ arrives_tomorrow: next ? "true" : null });
                }}
              />
              <FilterSwitch
                title={
                  <span className="font-bold text-[#3483fa] italic flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> FULL — envío rápido
                  </span>
                }
                subtitle="Beneficios de envío"
                isActive={false}
                onToggle={() => {}}
              />
              <FilterSwitch title="Internacional" isActive={intlShipping} onToggle={() => setIntlShipping(!intlShipping)} />
              <FilterSwitch title="Envío local" isActive={localShipping} onToggle={() => setLocalShipping(!localShipping)} />
              <FilterSwitch
                title="Envío gratis"
                isActive={freeShipping}
                onToggle={() => {
                  const next = !freeShipping;
                  setFreeShipping(next);
                  updateSearchParams({ free_shipping: next ? "true" : null });
                }}
              />
              <FilterSwitch
                title="Mejor precio en cuotas"
                subtitle="Al mismo precio o bajo interés"
                isActive={bestInstallments}
                onToggle={() => setBestInstallments(!bestInstallments)}
              />

              <div className="mt-4 space-y-4">
                <FilterList
                  title="Categoría"
                  items={categories.slice(0, 12).map((c) => ({ label: c.name, value: c.id }))}
                  showMore={categories.length > 12}
                  activeItem={selectedCategory}
                  onItemClick={(id) => {
                    const next = selectedCategory === id ? "" : id;
                    setSelectedCategory(next);
                    updateSearchParams({ category: next || null });
                  }}
                />
                <FilterList
                  title="Condición"
                  items={[
                    { label: "Nuevo", value: "new" },
                    { label: "Usado", value: "used" },
                    { label: "Reacondicionado", value: "refurbished" },
                  ]}
                  activeItem={condition}
                  onItemClick={(val) => {
                    const next = condition === val ? "" : val;
                    setCondition(next);
                    updateSearchParams({ condition: next || null });
                  }}
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 w-full text-[13px] text-[#3483fa] font-semibold hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Barra título + resultados + ordenar — estilo ML */}
            <div className="bg-white rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)] px-4 py-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-[#eaeaea]">
              <div>
                <h1 className="text-[20px] sm:text-[22px] font-normal text-[#333] leading-tight capitalize">
                  {searchTerm}
                </h1>
                <p className="text-[13px] text-[#666] mt-1">
                  <span className="font-semibold text-[#333]">{filteredProducts.length}</span> resultados
                </p>
              </div>
              <div className="flex items-center gap-2 text-[13px] flex-shrink-0">
                <span className="text-[#666] hidden sm:inline">Ordenar por</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      updateSearchParams({ sort: e.target.value });
                    }}
                    className="appearance-none font-semibold text-[#333] bg-[#f5f5f5] sm:bg-transparent border border-[#ddd] sm:border-none rounded-md py-2 pl-3 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3483fa]/30 text-[13px]"
                  >
                    <option value="relevance">Más relevantes</option>
                    <option value="price_asc">Menor precio</option>
                    <option value="price_desc">Mayor precio</option>
                    <option value="newest">Más recientes</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#3483fa] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Búsqueda IA — colapsable */}
            <div className="bg-white rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-[13px] text-[#3483fa] font-semibold hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Búsqueda con IA y por imagen
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedSearch ? "rotate-180" : ""}`} />
              </button>
              {showAdvancedSearch && (
                <div className="px-4 pb-4 border-t border-[#eee] pt-4">
                  <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Refiná tu búsqueda..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSmartSearch}
                      disabled={smartLoading || !query.trim()}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {smartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      IA
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSearchOpen(!imageSearchOpen)}
                      className="flex items-center gap-1.5 bg-gray-100 px-4 py-2.5 rounded-lg text-sm"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button type="submit" className="bg-[#3483fa] text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                      <Search className="w-4 h-4" />
                    </button>
                  </form>

                  {imageSearchOpen && (
                    <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                      {imagePreview ? (
                        <div className="flex items-center justify-center gap-4">
                          <img src={imagePreview} alt="" className="w-24 h-24 object-cover rounded-lg" />
                          {imageLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          ) : (
                            <button type="button" onClick={() => setImagePreview(null)} className="text-sm text-blue-600">
                              Cambiar imagen
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Subí una foto del producto</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSearch(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {smartMode && smartSuggestion && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-3 text-[13px]">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-purple-900 font-medium">{smartSuggestion}</p>
                        {smartKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {smartKeywords.map((kw) => (
                              <span key={kw} className="bg-white text-purple-700 text-xs px-2 py-0.5 rounded-full border">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => { setSmartMode(false); fetchProducts(); }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {imageResult && Number(imageResult.confidence) > 0 && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-[13px]">
                      Identificado: {String(imageResult.product_name)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grilla */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-md animate-pulse overflow-hidden border border-[#eee]">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.slice(0, firstRowCount).map((product) => (
                    <ProductCard key={product.id} product={product} discount={discount} cuotas6={cuotas6} />
                  ))}
                </div>

                {featuredSellerBlock && (
                  <div className="bg-white rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.08)] border border-[#eee] p-4">
                    <p className="text-[14px] text-[#333] mb-3">
                      Ahorrá en el envío de productos vendidos por{" "}
                      <strong className="text-[#3483fa]">{featuredSellerBlock.sellerName}</strong>. Agregá más productos al
                      carrito.
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {featuredSellerBlock.items.slice(0, 8).map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="flex-shrink-0 w-[140px] border border-[#eee] rounded-md hover:shadow-md overflow-hidden bg-white"
                        >
                          <div className="aspect-square bg-gray-50 p-2 flex items-center justify-center">
                            {product.primary_image ? (
                              <img src={product.primary_image} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Package className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] text-[#333] line-clamp-2 leading-tight mb-1">{product.title}</p>
                            <p className="text-[15px] font-semibold text-[#333]">
                              $ {product.price.toLocaleString("es-AR")}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts.length > firstRowCount && (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredProducts.slice(firstRowCount).map((product) => (
                      <ProductCard key={product.id} product={product} discount={discount} cuotas6={cuotas6} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-[#eee]">
                <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-[#333]">No encontramos resultados</h2>
                <p className="text-gray-500 mb-6">Probá otros términos o revisá los filtros.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bg-[#3483fa] text-white font-semibold px-6 py-3 rounded-md hover:bg-[#2968c8]"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  discount,
  cuotas6,
}: {
  product: Product;
  discount: (p: Product) => number | null;
  cuotas6: (n: number) => string;
}) {
  const d = discount(product);
  const sold = product.sold_count ?? product.sales ?? 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="bg-white rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden cursor-pointer group border border-[#eee] flex flex-col"
    >
      <div className="aspect-square bg-white p-3 relative overflow-hidden border-b border-[#f5f5f5]">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-14 w-14 text-gray-200" />
          </div>
        )}
        {product.is_promoted && (
          <span className="absolute top-2 left-2 bg-[#3483fa] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            FULL
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        {sold > 40 && (
          <span className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm w-fit mb-1.5">
            MÁS VENDIDO
          </span>
        )}

        {product.seller_name && (
          <p className="text-[11px] text-[#666] mb-1 uppercase tracking-wide truncate">
            por {product.seller_name}
          </p>
        )}

        <StarRating soldCount={sold} />

        <h2 className="text-[13px] text-[#333] font-normal leading-snug line-clamp-2 min-h-[36px] mt-1.5 mb-2 group-hover:text-[#3483fa]">
          {product.title}
        </h2>

        <div className="mt-auto space-y-1">
          {product.original_price && product.original_price > product.price && (
            <span className="text-[11px] text-[#999] line-through block">
              $ {product.original_price.toLocaleString("es-AR")}
            </span>
          )}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[22px] font-normal text-[#333] leading-none">
              $ {product.price.toLocaleString("es-AR")}
            </span>
            {d != null && <span className="text-[11px] font-semibold text-[#00a650]">{d}% OFF</span>}
          </div>
          <p className="text-[12px] text-[#00a650] font-medium">6 cuotas de $ {cuotas6(product.price)}</p>
          {product.shipping_free ? (
            <p className="text-[11px] text-[#00a650] font-semibold leading-tight">
              Llega gratis mañana
              <span className="block text-[#3483fa] font-bold italic mt-0.5 flex items-center gap-0.5">
                <Zap className="w-3 h-3 fill-current" /> FULL
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-[#00a650] font-semibold">Llega mañana</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#ebebeb]">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-[#666]">Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
