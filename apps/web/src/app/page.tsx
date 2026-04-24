import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Truck, 
  Shield, 
  RotateCcw, 
  Headphones,
  CreditCard,
  BadgeCheck,
  Zap,
  TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Categorías principales
const mainCategories = [
  { name: "Tecnología", slug: "tecnologia", icon: "💻", color: "bg-blue-100" },
  { name: "Electrodomésticos", slug: "electrodomesticos", icon: "🏠", color: "bg-green-100" },
  { name: "Hogar y Muebles", slug: "hogar-muebles", icon: "🛋️", color: "bg-orange-100" },
  { name: "Deportes", slug: "deportes-fitness", icon: "⚽", color: "bg-red-100" },
  { name: "Moda", slug: "moda-accesorios", icon: "👕", color: "bg-purple-100" },
  { name: "Juguetes", slug: "juguetes-bebes", icon: "🧸", color: "bg-pink-100" },
  { name: "Belleza", slug: "belleza-cuidado", icon: "💄", color: "bg-rose-100" },
  { name: "Vehículos", slug: "vehiculos", icon: "🚗", color: "bg-cyan-100" },
];

// Beneficios
const benefits = [
  {
    icon: Shield,
    title: "Compra Protegida",
    description: "Recibe el producto que esperabas o te devolvemos tu dinero",
  },
  {
    icon: Truck,
    title: "Envíos Gratis",
    description: "En miles de productos seleccionados",
  },
  {
    icon: RotateCcw,
    title: "Devolución Gratis",
    description: "Tienes 10 días desde que lo recibes",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    description: "Estamos para ayudarte cuando lo necesites",
  },
];

async function getFeaturedProducts() {
  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary),
      profiles:seller_id(full_name),
      reputation_scores:seller_id(color)
    `)
    .eq("is_active", true)
    .order("is_promoted", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url || 
                   product.product_images?.[0]?.url,
    seller_name: product.profiles?.full_name,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

async function getPromotedProducts() {
  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary),
      profiles:seller_id(full_name),
      reputation_scores:seller_id(color)
    `)
    .eq("is_active", true)
    .eq("is_promoted", true)
    .gt("promoted_until", new Date().toISOString())
    .limit(6);

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url || 
                   product.product_images?.[0]?.url,
    seller_name: product.profiles?.full_name,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

export default async function HomePage() {
  const [featuredProducts, promotedProducts] = await Promise.all([
    getFeaturedProducts(),
    getPromotedProducts(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-[#3483FA] to-[#2968C8] text-white">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold">
                  Compra y vende en el marketplace más grande de Argentina
                </h1>
                <p className="text-lg md:text-xl text-blue-100">
                  Millones de productos nuevos y usados. Envíos a todo el país.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <Link href="/search">
                    <Button size="lg" className="bg-[#FEE500] text-[#333333] hover:bg-[#FFD700]">
                      Explorar productos
                    </Button>
                  </Link>
                  <Link href="/sell">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white text-white hover:bg-white/10"
                    >
                      Vender ahora
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                  <div className="absolute inset-4 bg-white/20 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl">🛒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Categorías populares</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {mainCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${category.color} flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform`}
                >
                  {category.icon}
                </div>
                <span className="text-xs md:text-sm text-center text-gray-700 group-hover:text-[#3483FA]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Promoted Products */}
        {promotedProducts.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Destacados de hoy</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {promotedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3483FA]" />
              <h2 className="text-xl font-semibold">Productos destacados</h2>
            </div>
            <Link href="/search" className="text-[#3483FA] hover:underline text-sm">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <div className="w-12 h-12 bg-[#EBEBEB] rounded-full flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-[#3483FA]" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription CTA */}
        <section className="container mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">
                  ¿Vendes productos?
                </h2>
                <p className="text-gray-300">
                  Únete a miles de vendedores y accede a herramientas profesionales, 
                  menores comisiones y mayor visibilidad para tus productos.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-400" />
                    Publicaciones gratuitas ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-400" />
                    Comisiones desde solo 1%
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-400" />
                    Herramientas de análisis avanzadas
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-400" />
                    Soporte prioritario 24/7
                  </li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-4">
                  <Link href="/sell">
                    <Button className="bg-[#FEE500] text-[#333333] hover:bg-[#FFD700]">
                      Comenzar a vender
                    </Button>
                  </Link>
                  <Link href="/subscriptions">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      Ver planes
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/10 border-0 text-white p-4">
                    <p className="text-3xl font-bold">Plata</p>
                    <p className="text-sm text-gray-300">$9.999/mes</p>
                    <p className="text-xs text-green-400 mt-1">5% comisión</p>
                  </Card>
                  <Card className="bg-white/10 border-0 text-white p-4">
                    <p className="text-3xl font-bold">Gold</p>
                    <p className="text-sm text-gray-300">$19.999/mes</p>
                    <p className="text-xs text-green-400 mt-1">3% comisión</p>
                  </Card>
                  <Card className="bg-[#FEE500] border-0 text-[#333333] p-4 col-span-2">
                    <p className="text-3xl font-bold">Platinum</p>
                    <p className="text-sm">$49.999/mes</p>
                    <p className="text-xs text-green-700 mt-1">1% comisión + máxima visibilidad</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#333333] rounded-lg flex items-center justify-center">
                  <span className="text-[#FEE500] font-bold">M</span>
                </div>
                <span className="font-bold text-lg">MADSJEEZ</span>
              </div>
              <p className="text-sm text-gray-500">
                El marketplace más grande de Argentina. Compra y vende con confianza.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Comprar</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/search" className="hover:text-[#3483FA]">Buscar productos</Link></li>
                <li><Link href="/categories" className="hover:text-[#3483FA]">Categorías</Link></li>
                <li><Link href="/deals" className="hover:text-[#3483FA]">Ofertas</Link></li>
                <li><Link href="/help" className="hover:text-[#3483FA]">Centro de ayuda</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Vender</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/sell" className="hover:text-[#3483FA]">Comenzar a vender</Link></li>
                <li><Link href="/subscriptions" className="hover:text-[#3483FA]">Planes de suscripción</Link></li>
                <li><Link href="/seller-guide" className="hover:text-[#3483FA]">Guía del vendedor</Link></li>
                <li><Link href="/fees" className="hover:text-[#3483FA]">Tarifas y comisiones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/legal/terminos" className="hover:text-[#3483FA]">Términos y condiciones</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-[#3483FA]">Política de privacidad</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-[#3483FA]">Política de cookies</Link></li>
                <li><Link href="/legal/reembolsos" className="hover:text-[#3483FA]">Política de reembolsos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 MADSJEEZ. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
