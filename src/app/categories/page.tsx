import type { Metadata } from "next";
import Link from "next/link";
import {
  Apple,
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
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
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
    <main className="min-h-screen bg-mesh font-outfit text-slate-900 overflow-x-hidden">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f3460] pt-10 pb-16">
        <div className="absolute inset-0 bg-pattern opacity-[0.12]" />
        <div className="absolute -left-[8%] top-[-18%] h-[28rem] w-[28rem] rounded-full bg-[#00b4d8]/10 blur-[120px]" />
        <div className="absolute right-[-8%] bottom-[-20%] h-[30rem] w-[30rem] rounded-full bg-[#ffb703]/10 blur-[150px]" />

        <div className="relative z-10 mx-auto max-w-[1184px] px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/90">
                <Zap className="h-3.5 w-3.5 text-[#ffb703]" />
                Universo MADSJEEZ
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                Todas las categorias
                <span className="block text-white/35">del marketplace</span>
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
                Explora cada rubro con la misma lógica comercial del home: entradas claras, foco en descubrimiento, enlaces
                internos fuertes y una estructura pensada para captar compradores y también vendedores en Argentina.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <form action="/search" className="relative w-full max-w-[560px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    name="q"
                    type="search"
                    placeholder="Buscar productos, marcas o categorias"
                    className="h-13 w-full rounded-2xl border border-white/10 bg-white/8 pl-12 pr-4 text-sm text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm outline-none placeholder:text-white/45 focus:border-[#00b4d8]/50"
                  />
                </form>
                <Link
                  href="/vender"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#ff9100] px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  Quiero vender
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "rubros", value: formatCount(categories.length), tone: "from-[#1a1a2e] to-[#16213e]" },
                { label: "subcategorias", value: formatCount(totalSubcategories), tone: "from-[#3483fa] to-[#2563eb]" },
                { label: "productos", value: formatCount(totalProducts), tone: "from-[#00b4d8] to-[#0096c7]" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-3xl bg-gradient-to-br ${item.tone} p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]`}
                >
                  <p className="text-3xl font-black tracking-tight">{item.value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-8 relative z-20 mx-auto max-w-[1184px] px-4 pb-14">
        <div className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "SEO con estructura real",
                copy: "Cada categoria abre caminos internos hacia subcategorias y productos, no queda como una pagina muerta.",
                tone: "from-[#eff6ff] to-white text-[#3483fa]",
              },
              {
                icon: Store,
                title: "Atraer vendedores",
                copy: "La pagina muestra demanda, rubros y puertas de entrada comerciales para convencer a nuevos comercios.",
                tone: "from-[#fff7ed] to-white text-[#f97316]",
              },
              {
                icon: Sparkles,
                title: "Identidad de marca",
                copy: "Mismo ADN visual del home: contraste fuerte, acentos vibrantes, relieve y una sensación premium.",
                tone: "from-[#f0fdfa] to-white text-[#00b4d8]",
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl bg-gradient-to-br ${item.tone} p-5`}>
                <item.icon className="h-5 w-5" />
                <h2 className="mt-3 text-lg font-black tracking-tight text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = categoryIcons[category.slug] || TrendingUp;
              const accentStyles = [
                "from-[#eff6ff] via-white to-[#f8fafc]",
                "from-[#fff7ed] via-white to-[#fffaf0]",
                "from-[#f0fdfa] via-white to-[#f8fafc]",
              ];
              const accent = accentStyles[index % accentStyles.length];

              return (
                <section
                  key={category.id}
                  className="group overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(15,23,42,0.12)]"
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className={`block border-b border-slate-100 bg-gradient-to-br ${accent} p-5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-[#ffb703] shadow-lg shadow-slate-900/25">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-[#f97316]">
                              {category.name}
                            </h2>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              {formatCount(category.productCount)} productos activos
                            </p>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#f97316]" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Entra a la categoria, descubre subrubros y abre una ruta directa hacia productos y oportunidades de venta.
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5">
                    {category.children.length > 0 ? (
                      <div className="space-y-1">
                        {category.children.slice(0, 8).map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#3483fa]"
                          >
                            <span className="truncate">{child.name}</span>
                            <span className="ml-3 text-[11px] font-semibold text-slate-400">
                              {formatCount(child.productCount)}
                            </span>
                          </Link>
                        ))}
                        {category.children.length > 8 && (
                          <Link
                            href={`/category/${category.slug}`}
                            className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-bold text-[#3483fa] transition-colors hover:bg-slate-100"
                          >
                            Ver {category.children.length - 8} subcategorias mas
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/search?category=${encodeURIComponent(category.id)}`}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-bold text-[#3483fa] transition-colors hover:bg-slate-100"
                      >
                        Ver publicaciones
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-black text-slate-950">Todavia no hay categorias disponibles</p>
            <p className="mt-2 text-sm text-slate-500">Volvi a intentar en unos minutos.</p>
          </section>
        )}
      </section>
    </main>
  );
}
