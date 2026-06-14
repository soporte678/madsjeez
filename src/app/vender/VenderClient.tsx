"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  LineChart,
  Megaphone,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

const liveStack = [
  "Checkout con Mercado Pago",
  "Dashboard de compras y ventas",
  "Ordenes para comprador y vendedor",
  "SEO tecnico base: sitemap, robots y metadata",
  "Captacion de vendedores con leads",
  "Seguimiento de visitas y consultas desde tu panel",
];

const roadmap = [
  {
    stage: "Ya integrado",
    tone: "text-emerald-200 border-emerald-300/30 bg-emerald-400/10",
    items: [
      "Pagos online y flujo de compra con seguimiento de orden",
      "Panel de vendedor con ventas, publicaciones y metricas base",
      "Panel de comprador con compras y detalle de pedido",
      "SEO inicial para que Google pueda descubrir el marketplace",
      "Sistema de leads para invitar comercios a vender",
      "Panel con visitas y consultas de tus publicaciones",
    ],
  },
  {
    stage: "Proxima version",
    tone: "text-cyan-200 border-cyan-300/30 bg-cyan-400/10",
    items: [
      "Centro de crecimiento para vendedores con recomendaciones accionables",
      "Score de calidad de publicaciones y checklist SEO por producto",
      "Campanas de captacion por rubro, ciudad y categoria",
      "Panel de conversion: visitas, productos vistos, carrito y venta",
      "Automatizacion de mensajes para recuperar vendedores inactivos",
      "Plantillas de publicacion para cargar catalogo mas rapido",
    ],
  },
  {
    stage: "Apuesta futura",
    tone: "text-amber-100 border-amber-300/30 bg-amber-300/10",
    items: [
      "Motor IA de pricing y rentabilidad por categoria",
      "Buscador semantico con intencion de compra",
      "Recomendaciones personalizadas para compradores recurrentes",
      "Programa de reputacion avanzada para comercios confiables",
      "Integraciones logisticas y calculo inteligente de envio",
      "App movil vendedor para operar desde el mostrador",
    ],
  },
];

const growthLoops = [
  {
    icon: Search,
    title: "Contenido que atrae demanda",
    text: "Landing, categorias y publicaciones preparadas para busquedas como vender online en Argentina, marketplace para comercios y comprar productos locales.",
  },
  {
    icon: Megaphone,
    title: "Resultados a la vista",
    text: "Seguí cuántas visitas y consultas reciben tus productos desde tu panel, para enfocar mejor tus esfuerzos.",
  },
  {
    icon: LineChart,
    title: "Conversion continua",
    text: "Medimos la friccion del embudo para mejorar landing, producto, checkout, postventa y recompra con datos concretos.",
  },
];

const sellerTools = [
  ["Publicar mas rapido", "Flujos guiados para cargar catalogo, fotos, stock y precio sin depender de soporte."],
  ["Vender con confianza", "Pagos integrados, ordenes claras y estado visible para comprador y vendedor."],
  ["Mejorar publicaciones", "Contenido SEO, calidad de ficha, precio, fotos y reputacion como palancas de conversion."],
  ["Escalar por categoria", "Estrategias para ferreteria, repuestos, indumentaria, tecnologia, hogar y comercios locales."],
];

const faqs = [
  ["MadsJeez ya esta listo para vender?", "El marketplace ya cuenta con base de compra, pagos, paneles, productos, SEO tecnico y captacion. El roadmap suma herramientas de crecimiento para competir con mas fuerza."],
  ["Por que un comercio elegiria MadsJeez?", "Porque no solo publica productos. Queremos darle visibilidad, datos, herramientas y acompanamiento para que vender online sea mas simple y rentable."],
  ["Como atraemos compradores?", "Con SEO, contenido por categoria, medicion de canales, experiencia de compra clara y campanas orientadas a demanda real."],
  ["Que diferencia hay contra marketplaces grandes?", "MadsJeez puede moverse mas rapido, escuchar a comercios locales y construir herramientas especificas para la realidad argentina."],
  ["Que se viene en el roadmap?", "IA para mejorar publicaciones, analytics por embudo, recomendaciones, reputacion avanzada, logisticas integradas y automatizaciones comerciales."],
  ["Puedo sumarme aunque ya venda en otros canales?", "Si. La idea es que MadsJeez sea un canal adicional de ventas, adquisicion y posicionamiento para tu comercio."],
];

function Content() {
  const params = useSearchParams();
  const inviteCode = useMemo(() => (params.get("inv") || "").toUpperCase(), [params]);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    monthlyCatalog: "",
    message: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        inviteCode,
        monthlyCatalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) return setError("No se pudo enviar tu solicitud.");
    trackEvent("generate_lead", {
      lead_type: "seller_registration",
      source: "vender_page",
      business_type: form.businessType || undefined,
      invite_code: inviteCode || undefined,
      estimated_catalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined,
    });
    setOk(true);
  };

  return (
    <main className="bg-[#07090f] text-white">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=2400&auto=format&fit=crop"
          alt="Comercio argentino gestionando ventas online"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,15,.96),rgba(7,9,15,.72),rgba(7,9,15,.42)),linear-gradient(180deg,rgba(7,9,15,.1),#07090f_92%)]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              <Sparkles size={14} />
              Marketplace argentino en expansion
            </div>
            <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.02] md:text-7xl">
              MadsJeez Marketplace para vender online en Argentina
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
              Estamos construyendo una plataforma donde comercios, marcas y vendedores locales puedan publicar,
              cobrar, medir, crecer y competir con una experiencia mas clara para compradores.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#registro"
                className="inline-flex items-center gap-2 bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-white"
              >
                Quiero vender en MadsJeez <ArrowRight size={18} />
              </a>
              <a
                href="#roadmap"
                className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/15"
              >
                Ver roadmap <ChevronRight size={18} />
              </a>
            </div>
          </div>
          <div className="mt-12 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Pagos", "Mercado Pago"],
              ["Ventas", "Dashboard vendedor"],
              ["SEO", "Base indexable"],
              ["Growth", "Metricas por canal"],
            ].map(([k, v]) => (
              <div key={k} className="border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">{k}</p>
                <p className="mt-2 font-bold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {growthLoops.map(({ icon: Icon, title, text }) => (
            <article key={title} className="border border-white/12 bg-white/[0.04] p-6">
              <Icon className="text-cyan-300" size={24} />
              <h2 className="mt-5 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="border border-cyan-300/20 bg-cyan-400/10 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-100">Herramientas de captacion activadas</p>
          <h2 className="mt-3 text-3xl font-black">No esperamos a que los vendedores lleguen solos: les damos una razon concreta para entrar.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["/vender/auditoria", "Auditor gratis", "Diagnostico de potencial comercial y recomendaciones."],
              ["/vender/importador", "Pre-importador", "Muestra que cargar catalogo puede ser rapido."],
              ["/vender/ferreteria", "Landings por rubro", "SEO especifico para captar comercios por categoria."],
            ].map(([href, title, text]) => (
              <a key={href} href={href} className="border border-white/15 bg-white/10 p-5 transition hover:bg-white/15">
                <p className="font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101827]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Producto actual</p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">Lo que ya estamos poniendo en manos del marketplace</h2>
            <p className="mt-5 text-slate-300">
              La promesa no arranca en cero. Ya hay flujo de compra, pagos, paneles, SEO inicial, captacion y medicion.
              La siguiente etapa es convertir eso en un sistema de crecimiento para vendedores.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveStack.map((item) => (
              <div key={item} className="flex gap-3 border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <p className="text-sm font-semibold text-slate-100">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Roadmap publico</p>
          <h2 className="mt-4 text-3xl font-black md:text-5xl">La apuesta: pasar de marketplace a sistema operativo comercial</h2>
          <p className="mt-5 text-slate-300">
            Mostramos que hay producto, direccion y futuro. Para no confundir, separamos claramente lo que ya existe
            de lo que vamos a implementar.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {roadmap.map((column) => (
            <article key={column.stage} className={`border p-6 ${column.tone}`}>
              <h3 className="text-2xl font-black text-white">{column.stage}</h3>
              <ul className="mt-5 space-y-3">
                {column.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-100">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-current" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#f4f7fb] text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Herramientas para vender mas</p>
              <h2 className="mt-4 text-3xl font-black md:text-5xl">No queremos solo sumar vendedores. Queremos hacerlos vender mejor.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {sellerTools.map(([title, text]) => (
                <article key={title} className="border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            { icon: Store, title: "Comercios locales", text: "Ferreterias, repuestos, tiendas de barrio, hogar e indumentaria." },
            { icon: WalletCards, title: "Pagos y confianza", text: "Cobro online, orden clara y experiencia consistente." },
            { icon: Truck, title: "Logistica futura", text: "Cotizacion, seguimiento y reglas de envio mas inteligentes." },
            { icon: Brain, title: "IA comercial", text: "Mejora de publicaciones, precios, contenido y oportunidades de venta." },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="border border-white/12 bg-white/[0.04] p-5">
              <Icon className="text-cyan-300" size={22} />
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101827]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <h2 className="text-3xl font-black md:text-5xl">Preguntas que convierten dudas en decision</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map(([q, a]) => (
              <article key={q} className="border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-black">{q}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="registro" className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="grid gap-8 border border-white/15 bg-white/[0.06] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Sumate al crecimiento</p>
            <h2 className="mt-4 text-3xl font-black">Queremos comercios que quieran jugar en grande</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Si vendes productos, tenes stock o queres abrir un canal digital mas serio, dejanos tus datos.
              Vamos a usar esta informacion para priorizar comercios por rubro, potencial y velocidad de salida.
            </p>
            {inviteCode ? <p className="mt-4 text-sm font-bold text-cyan-200">Codigo de invitacion: {inviteCode}</p> : null}
          </div>
          {ok ? (
            <div className="border border-emerald-300/40 bg-emerald-400/10 p-5 text-emerald-100">
              Solicitud enviada. Te contactamos en breve para activar tu tienda.
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Nombre completo*" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Email*" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Rubro" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <input className="bg-white px-3 py-3 text-slate-950" placeholder="Cantidad de productos" type="number" value={form.monthlyCatalog} onChange={(e) => setForm({ ...form, monthlyCatalog: e.target.value })} />
              <textarea className="bg-white px-3 py-3 text-slate-950 md:col-span-2" rows={4} placeholder="Objetivo comercial" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error ? <p className="text-sm text-red-200 md:col-span-2">{error}</p> : null}
              <button disabled={loading} className="bg-cyan-300 px-5 py-3 font-black text-slate-950 md:col-span-2">
                {loading ? "Enviando..." : "Quiero vender en MadsJeez"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default function VenderClient() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07090f]" />}>
      <Content />
    </Suspense>
  );
}
