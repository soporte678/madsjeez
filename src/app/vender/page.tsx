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

  const differentiators = [
    { icon: Rocket, t: "Ejecucion rapida", d: "Lanzamos mejoras en ciclos cortos con impacto comercial directo." },
    { icon: ShieldCheck, t: "Confiabilidad operativa", d: "Flujos criticos reforzados para proteger cada compra y cada venta." },
    { icon: TrendingUp, t: "Crecimiento medible", d: "Metricas accionables para optimizar adquisicion y conversion." },
    { icon: Users, t: "Foco en Argentina", d: "Producto pensado para la realidad local de comercios y consumidores." },
    { icon: CheckCircle2, t: "Experiencia premium", d: "Interfaz mas clara, menos friccion y mejor tasa de cierre." },
    { icon: ArrowRight, t: "Escalabilidad", d: "Base preparada para mas catalogo, mas trafico y mas transacciones." },
  ];

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
              En MadsJeez combinamos tecnologia de alto rendimiento, operacion comercial y experiencia de compra.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#registro" className="inline-flex items-center gap-2 bg-white text-[#0b1220] px-6 py-3 rounded-md font-semibold">
                Empezar ahora <ArrowRight size={16} />
              </a>
              <a href="#diferencia" className="inline-flex items-center gap-2 border border-white/30 px-6 py-3 rounded-md font-semibold text-white/90">
                Ver por que somos distintos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="diferencia" className="bg-[#0d1628] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center">Ventajas competitivas MadsJeez</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {differentiators.map(({ icon: Icon, t, d }) => (
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
          <h2 className="text-2xl md:text-3xl font-bold">Suma tu comercio y empeza a vender en serio</h2>
          {inviteCode ? <p className="text-xs mt-3 text-cyan-300">Codigo de invitacion: {inviteCode}</p> : null}
          {ok ? (
            <div className="mt-6 rounded-md border border-green-300/40 bg-green-500/15 p-4 text-green-100">
              Recibimos tu solicitud. Te contactamos para activar tu tienda.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Nombre completo*" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Email*" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Rubro" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <input className="bg-white/90 text-slate-900 rounded-md px-3 py-2" placeholder="Cantidad aprox. de productos" type="number" value={form.monthlyCatalog} onChange={(e) => setForm({ ...form, monthlyCatalog: e.target.value })} />
              <textarea className="bg-white/90 text-slate-900 rounded-md px-3 py-2 md:col-span-2" rows={4} placeholder="Que queres vender / objetivo comercial" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
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
