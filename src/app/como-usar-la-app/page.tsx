import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";

export const revalidate = 86400;

const PAGE_URL = `${SITE_URL}/como-usar-la-app`;

// ─── Data ────────────────────────────────────────────────────────────────────

const BUYER_STEPS = [
  {
    title: "Buscá el producto que necesitás",
    desc: "Usá la barra de búsqueda o explorá por categorías.",
  },
  {
    title: "Entrá al producto y revisá los detalles",
    desc: "Mirá las fotos, la descripción, el precio y los datos del vendedor.",
  },
  {
    title: "Agregalo al carrito",
    desc: "Tocá el botón 'Agregar al carrito'. Podés seguir comprando o ir directo al pago.",
  },
  {
    title: "Completá el pago",
    desc: "Ingresá tus datos de envío y elegí el método de pago disponible.",
  },
];

const BUYER_FEATURES = [
  { icon: "🔍", label: "Buscar productos", desc: "Buscá por nombre, categoría o vendedor." },
  { icon: "🛒", label: "Carrito de compras", desc: "Agregá varios productos y pagalos juntos." },
  { icon: "📦", label: "Seguir mis pedidos", desc: "Revisá el estado de tus compras en \"Mis pedidos\"." },
  { icon: "⭐", label: "Favoritos", desc: "Guardá productos para comprarlos después." },
  { icon: "💬", label: "Contactar al vendedor", desc: "Hacé preguntas antes de comprar." },
  { icon: "🏷️", label: "Ofertas y descuentos", desc: "Revisá la sección de ofertas para encontrar precios especiales." },
];

const SELLER_STEPS = [
  {
    title: "Registrate como vendedor",
    desc: "Si todavía no tenés cuenta de vendedor, entrá a /vendedores y completá el formulario.",
  },
  {
    title: "Entrá al panel de vendedor",
    desc: "Desde la app, tocá el ícono de tu cuenta y elegí 'Panel de vendedor'.",
  },
  {
    title: "Creá tu primera publicación",
    desc: "Tocá 'Nueva publicación', cargá las fotos, el título, la descripción y el precio.",
  },
  {
    title: "Revisá y publicá",
    desc: "Revisá que todo esté correcto y tocá 'Publicar'.",
  },
  {
    title: "Gestioná tus ventas",
    desc: "Cuando llegue una venta, te avisamos por email y podés gestionarla desde el panel.",
  },
];

const SELLER_FEATURES = [
  { icon: "📋", label: "Mis publicaciones", desc: "Ves todas tus publicaciones activas, pausadas y en borrador." },
  { icon: "📊", label: "Métricas", desc: "Mirá visitas, ventas y rendimiento de tus productos." },
  { icon: "📦", label: "Mis ventas", desc: "Gestioná los pedidos pendientes y en camino." },
  { icon: "💬", label: "Consultas", desc: "Respondé preguntas de compradores." },
  { icon: "🏪", label: "Mi tienda", desc: "Personalizá el nombre y la descripción de tu tienda." },
  { icon: "⚙️", label: "Configuración", desc: "Actualizá tus datos, métodos de envío y opciones de pago." },
];

const ACCOUNT_ITEMS = [
  "Ver y editar tu perfil",
  "Cambiar tu contraseña",
  "Ver tus pedidos de compra",
  "Ver tus publicaciones (si sos vendedor)",
  "Acceder a favoritos guardados",
  "Ver el historial de conversaciones con vendedores",
  "Gestionar direcciones de envío",
  "Cerrar sesión",
];

const FAQS = [
  {
    q: "¿La app es la misma que la web?",
    a: "Sí. La app de Madsjeez muestra exactamente el mismo contenido que la web. Tu cuenta, carrito, pedidos y publicaciones son los mismos.",
  },
  {
    q: "¿Necesito crear una cuenta nueva para la app?",
    a: "No. Si ya tenés cuenta en Madsjeez web, usás la misma en la app.",
  },
  {
    q: "¿Cómo descargo la app?",
    a: "Entrá a /descargar-app desde tu celular y seguí los pasos para tu tipo de teléfono (Android o iPhone).",
  },
  {
    q: "¿La app funciona sin internet?",
    a: "No. La app necesita conexión a internet para mostrar productos, procesar pagos y sincronizar datos.",
  },
  {
    q: "¿Cómo sé si una publicación es segura?",
    a: "Revisá el perfil del vendedor, la cantidad de ventas y las calificaciones. Ante dudas, contactá al vendedor antes de comprar.",
  },
  {
    q: "¿Cómo hago un reclamo?",
    a: "Desde 'Mis pedidos', buscá el pedido y tocá 'Problema con este pedido'. Nuestro equipo te asiste.",
  },
  {
    q: "¿Cómo me registro como vendedor?",
    a: "Entrá a /vendedores desde la app o la web, completá el formulario y el equipo de Madsjeez se comunica con vos.",
  },
  {
    q: "¿La app consume muchos datos móviles?",
    a: "Depende de la cantidad de fotos que veas. Para ahorrar datos, usá WiFi cuando puedas.",
  },
  {
    q: "¿Cómo actualizo la app?",
    a: "En Android: si la instalaste como APK, cuando haya una nueva versión te lo avisamos. Si la instalaste como PWA (desde el navegador), se actualiza sola.",
  },
  {
    q: "¿Qué hago si la app no abre?",
    a: "Cerrá la app y volvé a abrirla. Si el problema sigue, desinstalá y volvé a instalar desde /descargar-app.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepCircle({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-orange-400/30">
      {n}
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <StepCircle n={n} />
      <div className="pt-0.5">
        <p className="font-semibold text-gray-900 text-base leading-snug">{title}</p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <span className="text-2xl leading-none">{icon}</span>
      <p className="mt-3 font-semibold text-gray-900 text-sm">{label}</p>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComoUsarLaAppPage() {
  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Cómo usar la app", url: PAGE_URL },
  ];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Cómo usar Madsjeez desde la app",
    description:
      "Guía paso a paso para usar la app de Madsjeez: comprá, vendé y administrá tus productos desde tu celular.",
    url: PAGE_URL,
    inLanguage: "es-AR",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <main className="bg-white text-gray-900">
      <BreadcrumbJsonLd items={breadcrumb} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mx-auto max-w-4xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="font-medium text-gray-700">Cómo usar la app</li>
        </ol>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 tracking-wide">
            📱 Guía de la app
          </span>
          <h1 className="mt-5 text-3xl font-black leading-[1.1] tracking-tight md:text-5xl">
            Cómo usar Madsjeez desde la app
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/60 leading-7 md:text-lg">
            Todo lo que podés hacer con la app de Madsjeez, explicado paso a paso.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/descargar-app"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Descargar la app
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 hover:text-white transition-colors"
            >
              Entrar a la web
            </Link>
          </div>
        </div>
      </section>

      {/* ── ÍNDICE RÁPIDO ── */}
      <section className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap gap-2">
          {[
            { href: "#compradores", label: "Para compradores" },
            { href: "#vendedores", label: "Para vendedores" },
            { href: "#cuenta", label: "Mi cuenta y perfil" },
            { href: "#ayuda", label: "Ayuda frecuente" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN 1: COMPRADORES ── */}
      <section id="compradores" className="py-14 md:py-16 bg-white scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            Comprando en Madsjeez
          </h2>

          {/* Pasos */}
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-5">
              Cómo hacer tu primera compra
            </h3>
            <div className="space-y-6">
              {BUYER_STEPS.map((step, i) => (
                <Step key={i} n={i + 1} title={step.title} desc={step.desc} />
              ))}
            </div>
          </div>

          {/* Funciones */}
          <div className="mt-12">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Funciones para compradores</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {BUYER_FEATURES.map((f) => (
                <FeatureCard key={f.label} {...f} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: VENDEDORES ── */}
      <section id="vendedores" className="py-14 md:py-16 bg-gray-50 scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            Vendiendo en Madsjeez
          </h2>

          {/* Pasos */}
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-5">
              Cómo publicar tu primer producto
            </h3>
            <div className="space-y-6">
              {SELLER_STEPS.map((step, i) => (
                <Step key={i} n={i + 1} title={step.title} desc={step.desc} />
              ))}
            </div>
          </div>

          {/* Cards panel vendedor */}
          <div className="mt-12">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Funciones del panel de vendedor</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {SELLER_FEATURES.map((f) => (
                <FeatureCard key={f.label} {...f} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: CUENTA ── */}
      <section id="cuenta" className="py-14 md:py-16 bg-white scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            Tu cuenta en Madsjeez
          </h2>

          <div className="mt-6 max-w-prose">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Cómo acceder
            </p>
            <p className="text-gray-700 text-base leading-7">
              Tocá el ícono de persona en la barra de navegación o en el menú de la app.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Qué podés hacer desde tu cuenta
            </h3>
            <ul className="space-y-2.5">
              {ACCOUNT_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4">
            <p className="text-sm text-orange-900 leading-relaxed">
              <strong>Tu cuenta es la misma en la app y en la web.</strong> Si entrás en el celular, ves
              lo mismo que en la computadora.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: FAQ ── */}
      <section id="ayuda" className="py-14 md:py-16 bg-gray-50 scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
            Preguntas frecuentes sobre la app
          </h2>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-100">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors">
                  <span>{faq.q}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-orange-500 py-14 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight md:text-3xl">
            ¿Todavía no instalaste la app?
          </h2>
          <p className="mt-3 text-orange-100 text-base max-w-md mx-auto">
            Descargala gratis y empezá a comprar y vender desde tu celular.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/descargar-app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-sm"
            >
              Descargar para Android
            </Link>
            <Link
              href="/descargar-app#iphone"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Instrucciones para iPhone
            </Link>
          </div>
        </div>
      </section>

      {/* ── LINK VENDEDORES ── */}
      <section className="py-12 md:py-14 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            ¿Querés vender en Madsjeez?
          </p>
          <p className="text-gray-600 text-sm max-w-sm mx-auto leading-relaxed">
            Si sos vendedor o comercio, sumate a la plataforma. Los primeros 1000 vendedores reciben hasta 200 publicaciones gratis.
          </p>
          <div className="mt-5">
            <Link
              href="/vendedores"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
            >
              Quiero vender en Madsjeez
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
