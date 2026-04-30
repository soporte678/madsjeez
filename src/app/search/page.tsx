"use client";

import { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  condition: string;
  shipping_free: boolean;
  sales: number;
  primary_image: string | null;
  seller_name: string | null;
  category_name: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* ── Toggle switch para filtros ── */
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
    <div
      onClick={onToggle}
      className="bg-white rounded-md shadow-[0_1px_2px_0_rgba(0,0,0,0.1)] p-4 mb-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col pr-4">
        <span className="text-[14px] text-[#333] leading-tight">{title}</span>
        {subtitle && <span className="text-[12px] text-[#999] leading-tight mt-1">{subtitle}</span>}
      </div>
      <div className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${isActive ? "bg-[#3483fa]" : "bg-[#e6e6e6]"}`}>
        <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isActive ? "left-[18px]" : "left-[2px]"}`} />
      </div>
    </div>
  );
}

/* ── Lista de filtros clickeables ── */
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
    <div>
      <h4 className="text-[14px] font-semibold text-[#333] mb-2">{title}</h4>
      <ul className="text-[14px] text-[#666] space-y-1.5">
        {items.map((item) => (
          <li key={item.value}>
            <button
              onClick={() => onItemClick?.(item.value)}
              className={`hover:text-[#3483fa] text-left ${activeItem === item.value ? "text-[#3483fa] font-semibold" : ""}`}
            >
              {item.label}
            </button>
          </li>
        ))}
        {showMore && (
          <li>
            <button className="text-[#3483fa] font-semibold text-[13px] mt-1 hover:text-blue-700">
              Mostrar más
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SEARCH CONTENT
   ══════════════════════════════════════════════ */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [freeShipping, setFreeShipping] = useState(searchParams.get("free_shipping") === "true");
  const [arrivesTomorrow, setArrivesTomorrow] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);

    let dbQuery = supabase
      .from("products")
      .select(`
        *,
        product_images(url, is_primary),
        profiles:seller_id(full_name),
        categories:category_id(name)
      `)
      .eq("is_active", true);

    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    const cond = searchParams.get("condition");
    const sort = searchParams.get("sort") || "relevance";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const freeShip = searchParams.get("free_shipping");

    if (q) dbQuery = dbQuery.ilike("title", `%${q}%`);
    if (cat) dbQuery = dbQuery.eq("category_id", cat);
    if (cond) dbQuery = dbQuery.eq("condition", cond);
    if (minPrice) dbQuery = dbQuery.gte("price", parseInt(minPrice));
    if (maxPrice) dbQuery = dbQuery.lte("price", parseInt(maxPrice));
    if (freeShip === "true") dbQuery = dbQuery.eq("shipping_free", true);

    switch (sort) {
      case "price_asc":
        dbQuery = dbQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        dbQuery = dbQuery.order("price", { ascending: false });
        break;
      case "newest":
        dbQuery = dbQuery.order("created_at", { ascending: false });
        break;
      default:
        dbQuery = dbQuery.order("is_promoted", { ascending: false });
    }

    const { data } = await dbQuery.limit(48);

    if (data) {
      setProducts(
        data.map((p: any) => ({
          ...p,
          primary_image:
            p.product_images?.find((img: any) => img.is_primary)?.url ||
            p.product_images?.[0]?.url ||
            null,
          seller_name: p.profiles?.full_name || null,
          category_name: p.categories?.name || null,
        }))
      );
    }
    setLoading(false);
  };

  /* ── URL helpers ── */
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

  const searchTerm = searchParams.get("q") || "Productos";
  const activeConditionLabel = condition === "new" ? "Nuevo" : condition === "used" ? "Usado" : condition === "refurbished" ? "Reacondicionado" : null;

  const discount = (p: Product) =>
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const cuotas6 = (price: number) => Math.ceil(price / 6).toLocaleString("es-AR");

  return (
    <div className="min-h-screen flex flex-col bg-[#ebebeb] font-sans selection:bg-[#3483fa] selection:text-white">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col md:flex-row gap-8 w-full">

        {/* ═══ COLUMNA IZQUIERDA: FILTROS ═══ */}
        <aside className="w-full md:w-[260px] flex-shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center flex-wrap gap-1 text-[13px] text-[#333] mb-4">
            <Link href="/" className="hover:text-blue-600">Inicio</Link>
            <ChevronRight className="w-3 h-3 text-[#999]" />
            <span className="text-[#666] font-semibold">{searchTerm}</span>
          </div>

          <h1 className="text-[26px] font-semibold text-[#333] leading-tight capitalize mb-1">
            {searchTerm}
          </h1>
          <p className="text-[14px] text-[#666] font-light mb-6">{products.length} resultados</p>

          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {activeConditionLabel && (
              <div className="bg-white border border-[#e6e6e6] rounded-md px-3 py-1.5 flex items-center gap-2 text-[13px] text-[#666] hover:bg-gray-50 cursor-pointer shadow-sm">
                {activeConditionLabel}
                <X className="w-3 h-3 text-[#999]" onClick={() => { setCondition(""); updateSearchParams({ condition: null }); }} />
              </div>
            )}
            {freeShipping && (
              <div className="bg-white border border-[#e6e6e6] rounded-md px-3 py-1.5 flex items-center gap-2 text-[13px] text-[#666] hover:bg-gray-50 cursor-pointer shadow-sm">
                Envío gratis
                <X className="w-3 h-3 text-[#999]" onClick={() => { setFreeShipping(false); updateSearchParams({ free_shipping: null }); }} />
              </div>
            )}
          </div>

          {/* Switch filters */}
          <div className="mb-6">
            <FilterSwitch
              title="Llega mañana"
              isActive={arrivesTomorrow}
              onToggle={() => setArrivesTomorrow(!arrivesTomorrow)}
            />
            <FilterSwitch
              title={
                <span className="font-bold text-[#3483fa] italic flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> FLASH VENTA
                </span>
              }
              subtitle="Envíos acelerados gratis"
              isActive={false}
              onToggle={() => {}}
            />
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
              subtitle="Al mismo precio o con bajo interés"
              isActive={false}
              onToggle={() => {}}
            />
          </div>

          {/* List filters */}
          <div className="space-y-6">
            <FilterList
              title="Categoría"
              items={categories.map((c) => ({ label: c.name, value: c.id }))}
              showMore={categories.length > 5}
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
            <FilterList
              title="Costo de envío"
              items={[{ label: "Gratis", value: "free" }]}
              activeItem={freeShipping ? "free" : ""}
              onItemClick={() => {
                const next = !freeShipping;
                setFreeShipping(next);
                updateSearchParams({ free_shipping: next ? "true" : null });
              }}
            />
          </div>
        </aside>

        {/* ═══ COLUMNA DERECHA: RESULTADOS ═══ */}
        <div className="flex-1">

          {/* Sort bar */}
          <div className="flex justify-between items-center mb-6">
            <div />
            <div className="flex items-center gap-2 text-[14px]">
              <span className="text-[#333]">Ordenar por</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateSearchParams({ sort: e.target.value });
                }}
                className="font-semibold text-[#333] bg-transparent border-none cursor-pointer focus:outline-none"
              >
                <option value="relevance">Más relevantes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                <option value="newest">Más recientes</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#3483fa]" />
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg animate-pulse flex flex-col overflow-hidden">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const d = discount(product);
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group border border-gray-100 flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 p-4 relative overflow-hidden">
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-lg">
                        ♥
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Best seller badge */}
                      {(product.sales || 0) > 50 && (
                        <div className="mb-2">
                          <span className="bg-[#f26522] text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                            MÁS VENDIDO
                          </span>
                        </div>
                      )}

                      {/* Seller */}
                      {product.seller_name && (
                        <p className="text-[11px] text-[#999] mb-1 leading-tight uppercase tracking-wide">
                          por {product.seller_name}
                          <svg className="inline w-3 h-3 text-[#3483fa] ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </p>
                      )}

                      {/* Title */}
                      <h2 className="text-[13px] text-gray-700 font-light leading-snug line-clamp-2 min-h-[40px] mb-2 group-hover:text-[#3483fa] transition-colors">
                        {product.title}
                      </h2>

                      <div className="mt-auto">
                        {/* Original price */}
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-[12px] text-[#999] line-through block">
                            $ {product.original_price.toLocaleString("es-AR")}
                          </span>
                        )}

                        {/* Price + discount */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-medium text-[#333] leading-none">
                            $ {product.price.toLocaleString("es-AR")}
                          </span>
                          {d && (
                            <span className="text-[12px] font-medium text-[#00a650]">{d}% OFF</span>
                          )}
                        </div>

                        {/* Installments */}
                        <p className="text-[12px] text-[#00a650] font-medium mb-1">
                          6 cuotas de $ {cuotas6(product.price)}
                        </p>

                        {/* Shipping */}
                        {product.shipping_free ? (
                          <p className="text-[11px] text-[#00a650] font-bold mt-1 flex flex-col gap-1">
                            Llega gratis mañana
                            <span className="italic flex items-center font-black text-[#3483fa]">
                              <Zap className="w-3 h-3 fill-current mr-0.5" /> FLASH
                            </span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#00a650] font-bold mt-1">
                            Llega mañana
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-[#333]">No encontramos resultados</h2>
              <p className="text-gray-500 mb-6">Intenta con otros términos de búsqueda o filtros diferentes.</p>
              <button
                onClick={clearFilters}
                className="bg-[#3483fa] text-white font-semibold px-6 py-3 rounded-md hover:bg-[#2968c8] transition-colors"
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
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
