"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Rocket, ShieldCheck, TrendingUp, Users } from "lucide-react";

function VenderPageContent() {
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
        inviteCode: inviteCode || undefined,
        monthlyCatalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) return setError("No se pudo enviar tu solicitud.");
    setOk(true);
  };

  return (
    <main className="bg-[#070b14] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,78,216,.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(14,165,233,.25),transparent_40%),linear-gradient(to_bottom,#070b14,#0b1220)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[.2em] bg-white/10 border border-white/20 px-3 py-1 rounded-full">
              Nuevo Marketplace Argentino
            </p>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-tight">
              La plataforma donde vender en Argentina vuelve a ser negocio.
            </h1>
            <p className="mt-6 text-lg text-blue-100 max-w-3xl">
              En MadsJeez combinamos tecnología de alto rendimiento, operación comercial y experiencia de compra para que más vendedores crezcan y más compradores vuelvan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#registro" className="inline-flex items-center gap-2 bg-white text-[#0b1220] px-6 py-3 rounded-md font-semibold">
                Empezar ahora <ArrowRight size={16} />
              </a>
              <a href="#diferencia" className="inline-flex items-center gap-2 border border-white/30 px-6 py-3 rounded-md font-semibold text-white/90">
                Ver por qué somos distintos
              </a>
            </div>
          </div>
          <div className="mt-14 grid md:grid-cols-4 gap-4">
            {[
              ["Checkout robusto", "Pagos y estados de orden sincronizados, sin fricción."],
              ["Más conversión", "UX orientada a compra y repetición."],
              ["Crecimiento real", "SEO + performance para atraer tráfico de calidad."],
              ["Evolución continua", "Roadmap rápido con foco en resultados."],
            ].map(([t, d]) => (
              <div key={t} className="bg-white/8 border border-white/15 backdrop-blur-sm rounded-xl p-5">
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-blue-100/85 mt-2">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="diferencia" className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">No prometemos “más tráfico”. Construimos más ventas.</h2>
            <div className="mt-8 space-y-5">
              {[
                ["Operación comercial lista para escalar", "Publicaciones, pedidos, postventa y control desde un solo flujo."],
                ["Tecnología enfocada en performance", "Velocidad, estabilidad y mejoras constantes orientadas a conversión."],
                ["Marca y confianza", "Una experiencia más clara para que compradores y vendedores vuelvan."],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 text-cyan-300" size={18} />
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-blue-100/80 text-sm mt-1">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-5">
              <p className="text-sm text-cyan-100">Para vendedores</p>
              <p className="mt-2 font-semibold text-xl">Más control, más margen, más velocidad para crecer.</p>
            </div>
            <div className="rounded-xl border border-indigo-300/30 bg-indigo-400/10 p-5">
              <p className="text-sm text-indigo-100">Para compradores</p>
              <p className="mt-2 font-semibold text-xl">Compra simple, catálogo confiable y mejor experiencia de punta a punta.</p>
            </div>
            <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-100">Para tu marca</p>
              <p className="mt-2 font-semibold text-xl">Posicionamiento SEO y crecimiento orgánico sostenido en Argentina.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1628] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center">Ventajas competitivas MadsJeez</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              [Rocket, "Ejecución rápida", "Lanzamos mejoras en ciclos cortos con impacto comercial directo."],
              [ShieldCheck, "Confiabilidad operativa", "Flujos críticos reforzados para proteger cada compra y cada venta."],
              [TrendingUp, "Crecimiento medible", "Métricas accionables para optimizar adquisición y conversión."],
              [Users, "Foco en Argentina", "Producto pensado para la realidad local de comercios y consumidores."],
              [CheckCircle2, "Experiencia premium", "Interfaz más clara, menos fricción, mejor tasa de cierre."],
              [ArrowRight, "Escalabilidad", "Base tecnológica preparada para más catálogo, más tráfico y más transacciones."],
            ].map(([Icon, t, d]) => (
              <article key={t} className="rounded-xl border border-white/15 bg-white/5 p-6">
                <Icon size={20} className="text-cyan-300" />
                <h3 className="mt-3 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-blue-100/80">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="registro" className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold">Sumá tu comercio y empezá a vender en serio</h2>
          <p className="mt-2 text-blue-100/85">Completá el alta y te ayudamos a salir online rápido, con estrategia comercial.</p>
          {inviteCode ? <p className="text-xs mt-3 text-cyan-300">Código de invitación: {inviteCode}</p> : null}
          {ok ? (
            <div className="mt-6 rounded-md border border-green-300/40 bg-green-500/15 p-4 text-green-100">
              Perfecto, recibimos tu solicitud. En breve te contactamos para activar tu tienda.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Nombre completo*" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Email*" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Rubro" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Cantidad aprox. de productos" type="number" value={form.monthlyCatalog} onChange={(e) => setForm({ ...form, monthlyCatalog: e.target.value })} />
              <textarea className="bg-white/90 text-slate-900 rounded-md px-3 py-2 md:col-span-2" rows={4} placeholder="Qué querés vender / objetivo comercial" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error ? <p className="text-red-300 text-sm md:col-span-2">{error}</p> : null}
              <button disabled={loading} className="md:col-span-2 bg-cyan-300 text-slate-950 py-3 rounded-md font-bold">
                {loading ? "Enviando..." : "Quiero vender en MadsJeez"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default function VenderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#070b14]" />}>
      <VenderPageContent />
    </Suspense>
  );
}
