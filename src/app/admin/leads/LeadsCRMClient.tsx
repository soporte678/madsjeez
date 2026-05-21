"use client";

import { useMemo, useState } from "react";

type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  businessType: string | null;
  monthlyCatalog: number | null;
  message: string | null;
  status: string;
  createdAt: string;
  inviteCode: string | null;
};

const statuses = ["NEW", "CONTACTED", "ACTIVATED", "SELLING"];

export default function LeadsCRMClient({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => (filter === "ALL" ? items : items.filter((lead) => lead.status === filter)), [filter, items]);

  const updateStatus = async (id: string, status: string) => {
    setItems((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    await fetch(`/api/admin/seller-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const totals = {
    all: items.length,
    new: items.filter((lead) => lead.status === "NEW").length,
    contacted: items.filter((lead) => lead.status === "CONTACTED").length,
    selling: items.filter((lead) => lead.status === "SELLING").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM de vendedores</h1>
          <p className="text-sm text-gray-500">Seguimiento comercial de comercios captados por landing, auditor e importador.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", ...statuses].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-md border px-3 py-2 text-xs font-bold ${filter === status ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-700"}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Total", totals.all],
          ["Nuevos", totals.new],
          ["Contactados", totals.contacted],
          ["Vendiendo", totals.selling],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="p-3">Comercio</th>
              <th className="p-3">Contacto</th>
              <th className="p-3">Rubro</th>
              <th className="p-3">Catalogo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Nota</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-t border-gray-100 align-top">
                <td className="p-3">
                  <p className="font-bold text-gray-900">{lead.businessName || lead.fullName}</p>
                  <p className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString("es-AR")}</p>
                  {lead.inviteCode ? <p className="mt-1 text-xs font-bold text-blue-600">INV {lead.inviteCode}</p> : null}
                </td>
                <td className="p-3">
                  <p>{lead.fullName}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                  {lead.phone ? <p className="text-xs text-gray-500">{lead.phone}</p> : null}
                </td>
                <td className="p-3">{lead.businessType || "-"}</td>
                <td className="p-3">{lead.monthlyCatalog?.toLocaleString("es-AR") || "-"}</td>
                <td className="p-3">
                  <select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-2 text-xs font-bold">
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="max-w-xs p-3 text-xs leading-5 text-gray-500">{lead.message || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
