"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Grid3X3,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  condition: string;
  shipping_free: boolean;
  sold_count: number;
  primary_image: string | null;
  seller_name: string | null;
  seller_reputation: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [condition, setCondition] = useState<string>(searchParams.get("condition") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [freeShipping, setFreeShipping] = useState(false);

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

    if (data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);

    let dbQuery = supabase
      .from("products")
      .select(`
        *,
        product_images(url, is_primary),
        profiles:seller_id(full_name),
        reputation_scores:seller_id(color)
      `)
      .eq("is_active", true);

    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    const cond = searchParams.get("condition");
    const sort = searchParams.get("sort") || "relevance";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const freeShip = searchParams.get("free_shipping");

    if (q) {
      dbQuery = dbQuery.ilike("title", `%${q}%`);
    }

    if (cat) {
      dbQuery = dbQuery.eq("category_id", cat);
    }

    if (cond) {
      dbQuery = dbQuery.eq("condition", cond);
    }

    if (minPrice) {
      dbQuery = dbQuery.gte("price", parseInt(minPrice));
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte("price", parseInt(maxPrice));
    }

    if (freeShip === "true") {
      dbQuery = dbQuery.eq("shipping_free", true);
    }

    // Sorting
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
        // relevance - default, maybe by promoted first
        dbQuery = dbQuery.order("is_promoted", { ascending: false });
    }

    const { data, error } = await dbQuery.limit(48);

    if (data) {
      const mappedProducts = data.map((product: any) => ({
        ...product,
        primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                       product.product_images?.[0]?.url,
        seller_name: product.profiles?.full_name,
        seller_reputation: product.reputation_scores?.color,
      }));
      setProducts(mappedProducts);
    }

    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ q: query });
  };

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 1000000]);
    setCondition("");
    setFreeShipping(false);
    router.push("/search");
  };

  const hasActiveFilters = selectedCategory || condition || freeShipping ||
    searchParams.get("min_price") || searchParams.get("max_price");

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Search Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar productos, marcas y más..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-[#3483FA] hover:bg-[#2968C8]">
                Buscar
              </Button>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="border-t">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-gray-100" : ""}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">1</Badge>
                  )}
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <span className="text-sm text-gray-500">
                  {products.length} resultados
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    updateSearchParams({ sort: value });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Más relevantes</SelectItem>
                    <SelectItem value="price_asc">Menor precio</SelectItem>
                    <SelectItem value="price_desc">Mayor precio</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none rounded-l-md"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none rounded-r-md"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-64 flex-shrink-0">
                <Card>
                  <CardContent className="p-4 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filtros</h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-[#3483FA]"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>

                    {/* Categories */}
                    <div>
                      <h4 className="font-medium mb-3">Categorías</h4>
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <div key={cat.id} className="flex items-center">
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={selectedCategory === cat.id}
                              onCheckedChange={() => {
                                const newCat = selectedCategory === cat.id ? "" : cat.id;
                                setSelectedCategory(newCat);
                                updateSearchParams({ category: newCat });
                              }}
                            />
                            <label
                              htmlFor={`cat-${cat.id}`}
                              className="ml-2 text-sm cursor-pointer"
                            >
                              {cat.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div>
                      <h4 className="font-medium mb-3">Precio</h4>
                      <div className="space-y-4">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={1000000}
                          step={1000}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Mín"
                            value={priceRange[0]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setPriceRange([val, priceRange[1]]);
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Máx"
                            value={priceRange[1]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1000000;
                              setPriceRange([priceRange[0], val]);
                            }}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            updateSearchParams({
                              min_price: priceRange[0].toString(),
                              max_price: priceRange[1].toString(),
                            });
                          }}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Condition */}
                    <div>
                      <h4 className="font-medium mb-3">Condición</h4>
                      <div className="space-y-2">
                        {[
                          { value: "new", label: "Nuevo" },
                          { value: "used", label: "Usado" },
                          { value: "refurbished", label: "Reacondicionado" },
                        ].map((cond) => (
                          <div key={cond.value} className="flex items-center">
                            <Checkbox
                              id={`cond-${cond.value}`}
                              checked={condition === cond.value}
                              onCheckedChange={() => {
                                const newCond = condition === cond.value ? "" : cond.value;
                                setCondition(newCond);
                                updateSearchParams({ condition: newCond });
                              }}
                            />
                            <label
                              htmlFor={`cond-${cond.value}`}
                              className="ml-2 text-sm cursor-pointer"
                            >
                              {cond.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Free Shipping */}
                    <div className="flex items-center">
                      <Checkbox
                        id="free-shipping"
                        checked={freeShipping}
                        onCheckedChange={(checked) => {
                          setFreeShipping(checked as boolean);
                          updateSearchParams({ free_shipping: checked ? "true" : null });
                        }}
                      />
                      <label htmlFor="free-shipping" className="ml-2 text-sm cursor-pointer">
                        Envío gratis
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results Grid */}
            <div className="flex-1">
              {loading ? (
                <div className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                }`}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No encontramos resultados</h2>
                    <p className="text-gray-500 mb-6">
                      Intenta con otros términos de búsqueda o filtros diferentes.
                    </p>
                    <Button onClick={clearFilters}>Ver todos los productos</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header user={null} />
        <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
