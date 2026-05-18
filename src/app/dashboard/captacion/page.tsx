"use client";

import { useEffect, useState } from "react";

type Stats = {
  totals: { invites: number; leads: number; activated: number; selling: number };
  invites: Array<{ id: string; code: string; signups: number; createdAt: string }>;
};

export default function CaptacionPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/seller/leads/stats");
    setLoading(false);
    if (res.ok) setData(await res.json());
  };

  const createInvite = async () => {
    await fetch("/api/seller/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Captación de Comerciantes</h1>
        <p className="text-sm text-gray-600 mt-1">Invitá vendedores y medí conversiones.</p>
        <button onClick={createInvite} className="mt-4 bg-[#3483FA] text-white px-4 py-2 rounded">Crear enlace de invitación</button>
        {loading ? <p className="mt-6">Cargando...</p> : null}
        {data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="border rounded p-3"><p className="text-xs">Invitaciones</p><p className="text-xl font-bold">{data.totals.invites}</p></div>
              <div className="border rounded p-3"><p className="text-xs">Leads</p><p className="text-xl font-bold">{data.totals.leads}</p></div>
              <div className="border rounded p-3"><p className="text-xs">Activados</p><p className="text-xl font-bold">{data.totals.activated}</p></div>
              <div className="border rounded p-3"><p className="text-xs">Vendiendo</p><p className="text-xl font-bold">{data.totals.selling}</p></div>
            </div>
            <div className="mt-6 border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="text-left p-2">Código</th><th className="text-left p-2">Link</th><th className="text-left p-2">Registros</th></tr></thead>
                <tbody>
                  {data.invites.map((x) => (
                    <tr key={x.id} className="border-t">
                      <td className="p-2 font-mono">{x.code}</td>
                      <td className="p-2 font-mono">/vender?inv={x.code}</td>
                      <td className="p-2">{x.signups}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
