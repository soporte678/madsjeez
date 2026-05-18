"use client";

import { Suspense, useMemo, useState } from "react";
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
    if (!res.ok) {
      setError("No se pudo enviar tu solicitud.");
      return;
    }
    setOk(true);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-10 px-4">
      <div className="mx-auto max-w-3xl bg-white rounded-lg border p-6 md:p-8">
        <h1 className="text-2xl font-bold">Comenzá a vender en MadsJeez</h1>
        <p className="text-sm text-gray-600 mt-2">Completá tus datos y nuestro equipo activa tu cuenta comercial.</p>
        {inviteCode ? <p className="text-xs mt-2 text-blue-700">Código de invitación: {inviteCode}</p> : null}
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
            <button disabled={loading} className="md:col-span-2 bg-[#3483FA] text-white py-3 rounded font-semibold">
              {loading ? "Enviando..." : "Quiero vender"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function VenderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f5f5f5] py-10 px-4" />}>
      <VenderPageContent />
    </Suspense>
  );
}
