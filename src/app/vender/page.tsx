"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function Content() {
  const params = useSearchParams();
  const inviteCode = useMemo(() => (params.get("inv") || "").toUpperCase(), [params]);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", businessName: "", businessType: "", monthlyCatalog: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/seller/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, inviteCode, monthlyCatalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined }) });
    setLoading(false);
    if (!res.ok) return setError("No se pudo enviar tu solicitud.");
    setOk(true);
  };

  return (
    <main className="bg-[#05070d] text-white">
      <section className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=2400&auto=format&fit=crop" alt="Comercio vendiendo online" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/70 via-[#0a1020]/85 to-[#05070d]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-extrabold max-w-5xl">La landing que convierte comercios en vendedores activos de MadsJeez.</h1>
          <p className="mt-5 text-lg text-slate-200 max-w-3xl">Marketplace argentino con foco en conversion, SEO, pagos y experiencia de compra premium para escalar ventas reales.</p>
          <a href="#registro" className="inline-block mt-8 bg-cyan-300 text-slate-900 font-bold px-7 py-3 rounded-md">Quiero vender ahora</a>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-5">
        {["Checkout robusto", "SEO comercial", "Roadmap veloz"].map((x) => <div key={x} className="border border-white/15 bg-white/5 rounded-xl p-6 font-semibold">{x}</div>)}
      </section>

      <section className="bg-[#0d1424] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">Como funciona para vendedores</h2>
          <div className="mt-8 grid md:grid-cols-4 gap-4 text-sm">
            {["Alta comercial", "Carga de catalogo", "Activacion de pagos", "Escalado con SEO y metricas"].map((s, i) => (
              <div key={s} className="rounded-xl bg-white/5 border border-white/10 p-5"><p className="text-cyan-300 font-bold">0{i + 1}</p><p className="mt-2">{s}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold">Que nos diferencia en Argentina</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/15 p-6 bg-white/5">
            <h3 className="text-xl font-semibold">Para vendedores</h3>
            <ul className="mt-3 space-y-2 text-slate-300"><li>Mas control comercial y mejor conversion.</li><li>Infraestructura lista para escalar.</li><li>Menos friccion en publicacion y cobro.</li></ul>
          </div>
          <div className="rounded-xl border border-white/15 p-6 bg-white/5">
            <h3 className="text-xl font-semibold">Para compradores</h3>
            <ul className="mt-3 space-y-2 text-slate-300"><li>Compra simple y confiable.</li><li>Mejor experiencia postventa.</li><li>Catalogo mas relevante y local.</li></ul>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1424] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">FAQ para conversion y SEO</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
            {[
              ["Como vender online en Argentina con MadsJeez?", "Te registras, activamos tu cuenta comercial y publicas tu catalogo."],
              ["Que costo tiene publicar?", "Modelo transparente y escalable segun crecimiento del negocio."],
              ["Puedo vender si ya vendo en otros canales?", "Si, MadsJeez funciona como canal adicional de adquisicion y conversion."],
              ["Como atraen trafico?", "SEO tecnico, contenido orientado a compra y mejoras de performance continuas."],
            ].map(([q, a]) => <div key={q} className="border border-white/10 rounded-lg p-4 bg-white/5"><p className="font-semibold">{q}</p><p className="mt-2 text-slate-300">{a}</p></div>)}
          </div>
        </div>
      </section>

      <section id="registro" className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 md:p-8">
          <h2 className="text-2xl font-bold">Sumate a MadsJeez</h2>
          {inviteCode ? <p className="text-xs mt-2 text-cyan-300">Codigo: {inviteCode}</p> : null}
          {ok ? <div className="mt-4 p-4 rounded-md bg-emerald-500/20 border border-emerald-300/40">Solicitud enviada. Te contactamos en breve.</div> : (
            <form onSubmit={submit} className="mt-5 grid md:grid-cols-2 gap-3">
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Nombre completo*" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Email*" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Rubro" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <input className="bg-white text-slate-900 rounded px-3 py-2" placeholder="Cantidad de productos" type="number" value={form.monthlyCatalog} onChange={(e) => setForm({ ...form, monthlyCatalog: e.target.value })} />
              <textarea className="bg-white text-slate-900 rounded px-3 py-2 md:col-span-2" rows={4} placeholder="Objetivo comercial" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error ? <p className="md:col-span-2 text-red-300">{error}</p> : null}
              <button disabled={loading} className="md:col-span-2 bg-cyan-300 text-slate-900 font-bold py-3 rounded">{loading ? "Enviando..." : "Quiero vender en MadsJeez"}</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default function VenderPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#05070d]" />}><Content /></Suspense>;
}
