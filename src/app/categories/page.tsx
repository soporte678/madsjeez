import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Building2,
  Camera,
  Car,
  Dumbbell,
  Factory,
  Film,
  Gem,
  HardHat,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  Palette,
  PartyPopper,
  PawPrint,
  Search,
  Shirt,
  Smartphone,
  Sparkles,
  Sprout,
  Store,
  Ticket,
  ToyBrick,
  TrendingUp,
  Truck,
  Tv,
  Watch,
  Wind,
  Wrench,
  Apple,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCategoryCatalog } from "@/lib/categoryCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorias para comprar y vender | MADSJEEZ",
  description:
    "Explora todas las categorias del marketplace MADSJEEZ en Argentina. Encuentra productos, vendedores y oportunidades para publicar tu catalogo.",
};

const categoryIcons: Record<string, LucideIcon> = {
  "accesorios-para-vehiculos": Car,
  agro: Sprout,
  "alimentos-y-bebidas": Apple,
  "animales-y-mascotas": PawPrint,
  "antiguedades-y-colecciones": Gem,
  "arte-libreria-y-merceria": Palette,
  "autos-motos-y-otros": Car,
  bebes: Baby,
  "belleza-y-cuidado-personal": Sparkles,
  "camaras-y-accesorios": Camera,
  "celulares-y-telefonia": Smartphone,
  computacion: Laptop,
  "consolas-y-videojuegos": ToyBrick,
  construccion: HardHat,
  "deportes-y-fitness": Dumbbell,
  "electrodomesticos-y-aires": Wind,
  "electronica-audio-y-video": Tv,
  "entradas-para-eventos": Ticket,
  herramientas: Wrench,
  "hogar-muebles-y-jardin": Home,
  "industrias-y-oficinas": Factory,
  inmuebles: Building2,
  "instrumentos-musicales": Music,
  "joyas-y-relojes": Watch,
  "juegos-y-juguetes": ToyBrick,
  "libros-revistas-y-comics": BookOpen,
  "musica-peliculas-y-series": Film,
  "ropa-y-accesorios": Shirt,
  "salud-y-equipamiento-medico": HeartPulse,
  servicios: Truck,
  "souvenirs-cotillon-y-fiestas": PartyPopper,
  otros: MoreHorizontal,
};

function formatCount(value: number) {
  return value.toLocaleString("es-AR");
}

export default async function CategoriesPage() {
  const categories = await getCategoryCatalog().catch((error) => {
    console.error("Error loading categories page:", error);
    return [];
  });
  const totalProducts = categories.reduce((total, category) => total + category.productCount, 0);
  const totalSubcategories = categories.reduce((total, category) => total + category.children.length, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-950">
      <header className="bg-[#fff159] border-b border-[#e7d94b]">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="w-10 h-10 bg-slate-950 rounded-md flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-[#fff159]" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-950">MADSJEEZ</span>
            </Link>

            <form action="/search" className="relative w-full lg:max-w-[560px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="q"
                type="search"
                placeholder="Buscar productos, marcas o categorias"
                className="w-full h-12 rounded-md bg-white pl-12 pr-4 text-sm shadow-sm outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-[#3483fa]"
              />
            </form>

            <Link
              href="/vender"
              className="hidden lg:inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Quiero vender
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <section className="mb-8 rounded-lg bg-white p-5 sm:p-7 shadow-sm border border-black/5">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#3483fa] mb-2">Catalogo navegable</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                Todas las categorias del marketplace
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
                Entra a una categoria principal o baja directo a una subcategoria. Cada enlace abre resultados reales y
                tambien alimenta el SEO para que compradores y vendedores encuentren MADSJEEZ desde Google.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-slate-950 p-3 text-white">
                <p className="text-2xl font-black">{formatCount(categories.length)}</p>
                <p className="text-[11px] text-white/70">rubros</p>
              </div>
              <div className="rounded-md bg-[#3483fa] p-3 text-white">
                <p className="text-2xl font-black">{formatCount(totalSubcategories)}</p>
                <p className="text-[11px] text-white/80">subcategorias</p>
              </div>
              <div className="rounded-md bg-[#00a650] p-3 text-white">
                <p className="text-2xl font-black">{formatCount(totalProducts)}</p>
                <p className="text-[11px] text-white/80">productos</p>
              </div>
            </div>
          </div>
        </section>

        {categories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category.slug] || TrendingUp;

              return (
                <section key={category.id} className="rounded-lg bg-white shadow-sm border border-black/5 overflow-hidden">
                  <Link
                    href={`/category/${category.slug}`}
                    className="group flex items-center gap-3 border-b border-slate-100 p-4 hover:bg-[#fffbe6]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-[#3483fa]/10 text-[#3483fa] group-hover:bg-[#3483fa] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold text-slate-950 group-hover:text-[#3483fa] truncate">
                        {category.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatCount(category.productCount)} productos disponibles
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#3483fa]" />
                  </Link>

                  <div className="p-4">
                    {category.children.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1">
                        {category.children.slice(0, 10).map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#3483fa]"
                          >
                            <span className="truncate">{child.name}</span>
                            <span className="ml-3 text-[11px] text-slate-400">{formatCount(child.productCount)}</span>
                          </Link>
                        ))}
                        {category.children.length > 10 && (
                          <Link
                            href={`/category/${category.slug}`}
                            className="mt-1 inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold text-[#3483fa] hover:underline"
                          >
                            Ver {category.children.length - 10} subcategorias mas
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/search?category=${encodeURIComponent(category.id)}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#3483fa] hover:underline"
                      >
                        Ver publicaciones
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="rounded-lg bg-white p-12 text-center shadow-sm border border-black/5">
            <p className="text-lg font-semibold text-slate-950">Todavia no hay categorias disponibles</p>
            <p className="mt-2 text-sm text-slate-500">Volvi a intentar en unos minutos.</p>
          </section>
        )}
      </main>
    </div>
  );
}
