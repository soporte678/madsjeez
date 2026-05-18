"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
    <main className="min-h-screen bg-white text-[#111827]">
      <section className="bg-[#f8fbff] border-b border-[#dbeafe]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <p className="text-sm font-semibold text-[#2563eb] mb-3">Nuevo marketplace argentino</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl">
            Vendé más, con menos fricción: MadsJeez conecta comercios argentinos con compradores listos para comprar.
          </h1>
          <p className="mt-5 text-base md:text-lg text-[#374151] max-w-3xl">
            Publicación simple, pagos integrados, gestión de ventas y herramientas de crecimiento para que tu negocio escale de forma predecible.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#registro" className="bg-[#2563eb] text-white px-6 py-3 rounded-md font-semibold">Quiero vender en MadsJeez</a>
            <Link href="/" className="border border-[#cbd5e1] px-6 py-3 rounded-md font-semibold">Ver marketplace</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 grid gap-4 md:grid-cols-4">
        {[
          ["Comisiones claras", "Sin letra chica y con estructura pensada para crecer."],
          ["Checkout robusto", "Flujo estable con pagos y estado de orden sincronizado."],
          ["Soporte real", "Equipo y mejoras continuas orientadas a conversión."],
          ["Tecnología viva", "Plataforma en evolución constante, orientada a performance."],
        ].map(([t, d]) => (
          <article key={t} className="border border-[#e5e7eb] rounded-lg p-5">
            <h3 className="font-semibold text-lg">{t}</h3>
            <p className="text-sm text-[#4b5563] mt-2">{d}</p>
          </article>
        ))}
      </section>

      <section className="bg-[#f9fafb] border-y border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Por qué vendedores y compradores nos eligen</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <article className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-xl">Fortalezas para vendedores</h3>
              <ul className="mt-4 space-y-2 text-[#374151]">
                <li>Publicaciones rápidas y gestión centralizada de catálogo.</li>
                <li>Más control del negocio con panel de métricas y ventas.</li>
                <li>Integración de pagos para cobrar con confianza.</li>
                <li>Base SEO y posicionamiento para atraer tráfico orgánico.</li>
              </ul>
            </article>
            <article className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-xl">Ventajas para compradores</h3>
              <ul className="mt-4 space-y-2 text-[#374151]">
                <li>Proceso de compra claro y seguimiento de órdenes.</li>
                <li>Mejor experiencia en postventa y comunicación.</li>
                <li>Mayor variedad de comercios y productos locales.</li>
                <li>Una plataforma construida para confianza y continuidad.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">Qué nos diferencia de la competencia</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            ["Ejecución rápida", "Tomamos feedback de comercios y lo convertimos en mejoras concretas en semanas, no meses."],
            ["Enfoque local", "Decisiones de producto y operación pensadas para la realidad de Argentina y sus comercios."],
            ["Escalabilidad tecnológica", "Arquitectura preparada para crecer en catálogo, tráfico y transacciones."],
          ].map(([t, d]) => (
            <article key={t} className="border rounded-lg p-6">
              <h3 className="font-semibold text-lg">{t}</h3>
              <p className="mt-2 text-[#4b5563] text-sm">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="registro" className="bg-[#f8fbff] border-t border-[#dbeafe]">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Sumá tu comercio hoy</h2>
          <p className="mt-2 text-[#374151]">Dejanos tus datos y te ayudamos a lanzar tu tienda en MadsJeez.</p>
          {inviteCode ? <p className="text-xs mt-2 text-[#1d4ed8]">Código de invitación: {inviteCode}</p> : null}
          {ok ? (
            <div className="mt-6 rounded-md border border-green-300 bg-green-50 p-4 text-green-800">
              Recibimos tu solicitud. Te contactamos en breve para activar tu tienda.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="border rounded px-3 py-2" placeholder="Nombre completo*" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Email*" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Rubro (ferretería, indumentaria, etc.)" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Cantidad aprox. de productos" type="number" value={form.monthlyCatalog} onChange={(e) => setForm({ ...form, monthlyCatalog: e.target.value })} />
              <textarea className="border rounded px-3 py-2 md:col-span-2" rows={4} placeholder="Qué querés vender / objetivo" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error ? <p className="text-red-600 text-sm md:col-span-2">{error}</p> : null}
              <button disabled={loading} className="md:col-span-2 bg-[#2563eb] text-white py-3 rounded font-semibold">
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
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <VenderPageContent />
    </Suspense>
  );
}
