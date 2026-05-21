"use client";

import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Search, Sparkles } from "lucide-react";

export default function SellerAuditPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    businessName: "",
    businessType: "",
    products: "50",
    channels: "WhatsApp / Instagram",
  });
  const [sent, setSent] = useState(false);

  const score = useMemo(() => {
    const products = Number(form.products) || 0;
    let value = 46;
    if (products > 30) value += 12;
    if (products > 100) value += 10;
    if (form.channels.toLowerCase().includes("mercado")) value += 8;
    if (form.businessType.length > 3) value += 7;
    return Math.min(value, 92);
  }, [form]);

  const recommendations = [
    "Crear landing SEO por rubro y categoria para captar compradores desde Google.",
    "Importar catalogo inicial y priorizar los productos con mas busqueda o margen.",
    "Mejorar fichas con titulo tecnico, fotos claras, stock y preguntas frecuentes.",
    "Medir origen de visitas para separar organico, pago, referido y social.",
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/seller/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyCatalog: Number(form.products) || undefined,
        message: `Auditoria gratuita. Score estimado: ${score}. Canales actuales: ${form.channels}. Rubro: ${form.businessType}.`,
      }),
    });
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[0.95fr_1.05fr] md:py-24">
        <div>
          <div className="inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
            <Sparkles size={14} />
            Auditor gratis para vendedores
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
            Descubri cuanto potencial tiene tu comercio para vender en MadsJeez
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Esta herramienta genera una primera lectura comercial: catalogo, canal actual, rubro, oportunidades SEO y acciones recomendadas.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Search, label: "SEO" },
              { icon: BarChart3, label: "Conversion" },
              { icon: CheckCircle2, label: "Catalogo" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border border-white/12 bg-white/[0.04] p-4">
                <Icon className="text-cyan-300" size={20} />
                <p className="mt-3 font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/15 bg-white/[0.06] p-6">
          <form onSubmit={submit} className="grid gap-3">
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Nombre completo" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Rubro" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Cantidad de productos" type="number" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} />
            <input className="bg-white px-3 py-3 text-slate-950" placeholder="Canales actuales" value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })} />
            <button className="bg-cyan-300 px-5 py-3 font-black text-slate-950">Generar auditoria</button>
          </form>

          <div className="mt-6 border border-cyan-300/20 bg-cyan-400/10 p-5">
            <p className="text-sm font-bold text-cyan-100">Score comercial estimado</p>
            <p className="mt-2 text-5xl font-black">{score}/100</p>
            <ul className="mt-4 space-y-2">
              {recommendations.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={15} />
                  {item}
                </li>
              ))}
            </ul>
            {sent ? <p className="mt-4 text-sm font-bold text-emerald-200">Auditoria enviada. Te contactamos para avanzar.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
