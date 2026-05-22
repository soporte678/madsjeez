"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WaBarChart, WaEmpty, waCatch, WaMetricCard, WaPageHeader, waFetch } from "./WaShared";
import { LEAD_LABEL, LEAD_STATUSES } from "./types";
import type { LeadRow } from "./types";

type SummaryData = {
  metrics: {
    leadsToday: number;
    openChats: number;
    conversionPct: number;
    aiReplies: number;
    humanReplies: number;
    messagesInbound: number;
    byStage: Record<string, number>;
    leadsByDay: { date: string; count: number }[];
  };
  evolution: { ok: boolean };
  aiProvider: string;
  alerts: string[];
  recentConversations: {
    id: string;
    phone: string;
    name: string | null;
    preview: string;
    status?: string;
  }[];
};

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  manual: "Manual",
  campaign: "Campaña",
  web: "Web",
};

export function WhatsappBotResumenView({
  onOpenConversation,
}: {
  onOpenConversation?: (phone: string) => void;
}) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    waFetch<SummaryData>("/api/seller/whatsapp-bot/summary")
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="wa-page">
        <WaPageHeader title="Resumen" subtitle="Dashboard ejecutivo" />
        <div className="wa-sync-banner wa-sync-banner--warn">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return <WaEmpty title="Sin datos de resumen" />;

  const m = data.metrics;
  return (
    <div className="wa-page">
      <WaPageHeader title="Resumen" subtitle="Dashboard ejecutivo del bot y CRM WhatsApp" />
      {data.alerts.length > 0 ? (
        <div className="wa-sync-banner wa-sync-banner--warn mb-4">
          <div>
            {data.alerts.map((a) => (
              <p key={a} className="text-sm">
                {a}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      <div className="wa-metric-grid">
        <WaMetricCard label="Leads hoy" value={m.leadsToday} foot="Últimas 24 h" />
        <WaMetricCard label="Chats abiertos" value={m.openChats} foot="Bot + humano" />
        <WaMetricCard label="Entrantes (7d)" value={m.messagesInbound} />
        <WaMetricCard label="Respuestas IA" value={m.aiReplies} foot="7 días" />
        <WaMetricCard label="Conversión" value={`${m.conversionPct}%`} foot="Clientes / leads" />
      </div>
      {data.recentConversations.length > 0 ? (
        <>
          <p className="wa-section-title mt-6 mb-2">Conversaciones recientes</p>
          <div className="space-y-2">
            {data.recentConversations.map((c) => (
              <button
                key={c.id}
                type="button"
                className="wa-soft p-3 w-full text-left hover:bg-white/[0.04]"
                onClick={() => onOpenConversation?.(c.phone)}
              >
                <p className="font-bold text-white text-sm">{c.name || c.phone}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{c.preview || "—"}</p>
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="wa-section-title mb-2">Leads por día (7 días)</p>
          <WaBarChart
            data={m.leadsByDay.map((d) => ({ label: d.date, value: d.count }))}
          />
        </div>
        <div>
          <p className="wa-section-title mb-2">Por etapa</p>
          <div className="wa-soft p-4 space-y-2">
            {LEAD_STATUSES.map((s) => (
              <div key={s} className="flex justify-between text-sm">
                <span className="text-slate-400">{LEAD_LABEL[s]}</span>
                <span className="font-bold text-white">{m.byStage[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="wa-section-title mt-6 mb-2">Estado técnico</p>
      <div className="wa-soft p-4 text-sm text-slate-300 grid sm:grid-cols-2 gap-2">
        <p>
          Evolution:{" "}
          <span className={data.evolution.ok ? "text-green-400" : "text-amber-400"}>
            {data.evolution.ok ? "Conectado" : "Revisar configuración"}
          </span>
        </p>
        <p>
          Motor IA: <span className="text-blue-300">{data.aiProvider}</span>
        </p>
      </div>
    </div>
  );
}

export function WhatsappBotContactosView({
  onOpenConversation,
}: {
  onOpenConversation?: (phone: string) => void;
}) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    waFetch<{ leads: LeadRow[] }>("/api/seller/whatsapp-bot/leads")
      .then((d) => setLeads(d.leads ?? []))
      .catch(waCatch)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      l.phone.includes(q) ||
      (l.name?.toLowerCase().includes(q) ?? false) ||
      (l.intent?.toLowerCase().includes(q) ?? false)
    );
  });

  async function patchLead(id: string, body: Record<string, unknown>) {
    try {
      await waFetch(`/api/seller/whatsapp-bot/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      load();
      toast.success("Contacto actualizado");
    } catch (e) {
      waCatch(e);
    }
  }

  async function createContact() {
    if (!newPhone.trim()) {
      toast.error("Ingresá un teléfono");
      return;
    }
    setSaving(true);
    try {
      await waFetch("/api/seller/whatsapp-bot/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, name: newName || undefined }),
      });
      setNewPhone("");
      setNewName("");
      setShowCreate(false);
      load();
      toast.success("Contacto creado");
    } catch (e) {
      waCatch(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("¿Eliminar este contacto? No borra el historial de mensajes en conversaciones.")) return;
    try {
      await waFetch(`/api/seller/whatsapp-bot/leads/${id}`, { method: "DELETE" });
      load();
      toast.success("Contacto eliminado");
    } catch (e) {
      waCatch(e);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="wa-page">
      <WaPageHeader
        title="Contactos"
        subtitle="Base unificada con conversaciones de WhatsApp"
        action={
          <button
            type="button"
            className="wa-btn-primary text-sm"
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-4 w-4" /> Nuevo contacto
          </button>
        }
      />
      {showCreate ? (
        <div className="wa-soft p-4 mb-4 grid sm:grid-cols-3 gap-3 items-end">
          <label className="block">
            <span className="text-xs text-slate-400">Teléfono</span>
            <input
              className="wa-field mt-1"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="54911..."
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Nombre</span>
            <input
              className="wa-field mt-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="wa-btn-primary"
            disabled={saving}
            onClick={createContact}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </button>
        </div>
      ) : null}
      <input
        className="wa-field mb-4 max-w-md"
        placeholder="Buscar nombre o teléfono…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <WaEmpty title="Sin contactos" desc="Aparecen al escribirte por WhatsApp o al crearlos manualmente." />
      ) : (
        <div className="wa-soft overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b border-white/10">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Etapa</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="p-3">
                    <input
                      className="wa-field py-1 text-sm bg-transparent"
                      defaultValue={l.name ?? ""}
                      placeholder="Sin nombre"
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name !== (l.name ?? "")) patchLead(l.id, { name: name || null });
                      }}
                    />
                  </td>
                  <td className="p-3">{l.phone}</td>
                  <td className="p-3">
                    <select
                      className="wa-field py-1 text-xs"
                      value={l.status}
                      onChange={(e) => patchLead(l.id, { status: e.target.value })}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-slate-400">
                    {SOURCE_LABEL[l.source ?? "whatsapp"] ?? l.source ?? "—"}
                  </td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="wa-btn-ghost text-xs py-1"
                      onClick={() => onOpenConversation?.(l.phone)}
                    >
                      Abrir chat
                    </button>
                    <button
                      type="button"
                      className="wa-btn-ghost text-xs py-1 text-red-300"
                      onClick={() => deleteLead(l.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Automation = {
  id: string;
  name: string;
  triggerType: string;
  actionType: string;
  enabled: boolean;
  runCount: number;
};

const TEMPLATES = [
  {
    name: "Bienvenida",
    triggerType: "new_message",
    actionType: "send_message",
    actionConfig: { message: "¡Hola! Gracias por escribir. ¿En qué te puedo ayudar?" },
  },
  {
    name: "Pedir localidad",
    triggerType: "keyword",
    triggerConfig: { keyword: "envío" },
    actionType: "send_message",
    actionConfig: { message: "¿Me pasás tu localidad y código postal para cotizar envío?" },
  },
];

export function WhatsappBotAutomationsView() {
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  const [customName, setCustomName] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [customKw, setCustomKw] = useState("");

  const load = () => {
    setLoading(true);
    waFetch<{ automations: Automation[] }>("/api/seller/whatsapp-bot/automations")
      .then((d) => setItems(d.automations ?? []))
      .catch(waCatch)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function createFromTemplate(t: (typeof TEMPLATES)[0]) {
    try {
      await waFetch("/api/seller/whatsapp-bot/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      load();
      toast.success("Automatización creada");
    } catch (e) {
      waCatch(e);
    }
  }

  async function createCustom() {
    if (!customName.trim() || !customMsg.trim()) {
      toast.error("Nombre y mensaje son obligatorios");
      return;
    }
    try {
      await waFetch("/api/seller/whatsapp-bot/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName,
          triggerType: customKw ? "keyword" : "new_message",
          triggerConfig: customKw ? { keyword: customKw } : {},
          actionType: "send_message",
          actionConfig: { message: customMsg },
        }),
      });
      setCustomName("");
      setCustomMsg("");
      setCustomKw("");
      load();
      toast.success("Automatización creada");
    } catch (e) {
      waCatch(e);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="wa-page">
      <WaPageHeader title="Automatizaciones" subtitle="Reglas que se ejecutan al recibir mensajes" />
      <p className="wa-section-title mb-2">Plantillas rápidas</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {TEMPLATES.map((t) => (
          <button key={t.name} type="button" className="wa-quick-chip" onClick={() => createFromTemplate(t)}>
            {t.name}
          </button>
        ))}
      </div>
      <div className="wa-soft p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          className="wa-field"
          placeholder="Nombre de regla"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />
        <input
          className="wa-field"
          placeholder="Palabra clave (opcional)"
          value={customKw}
          onChange={(e) => setCustomKw(e.target.value)}
        />
        <input
          className="wa-field sm:col-span-2"
          placeholder="Mensaje a enviar"
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
        />
        <button type="button" className="wa-btn-primary sm:col-span-2 lg:col-span-4" onClick={createCustom}>
          Crear automatización
        </button>
      </div>
      {items.length === 0 ? (
        <WaEmpty title="Sin automatizaciones" desc="Creá una plantilla o regla personalizada." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="wa-soft p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">{a.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {a.triggerType} → {a.actionType} · {a.runCount} ejecuciones
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="wa-btn-ghost text-xs"
                  onClick={() =>
                    waFetch(`/api/seller/whatsapp-bot/automations/${a.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enabled: !a.enabled }),
                    })
                      .then(load)
                      .catch(waCatch)
                  }
                >
                  {a.enabled ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  className="wa-btn-ghost text-xs text-red-300"
                  onClick={() =>
                    waFetch(`/api/seller/whatsapp-bot/automations/${a.id}`, { method: "DELETE" })
                      .then(() => {
                        load();
                        toast.success("Eliminada");
                      })
                      .catch(waCatch)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type CatalogItem = {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
  keywords?: string;
};

export function WhatsappBotCatalogoView() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    const url = `/api/seller/whatsapp-bot/catalog?active=false${debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : ""}`;
    waFetch<{ products: CatalogItem[] }>(url)
      .then((d) => setProducts(d.products ?? []))
      .catch(waCatch)
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(p: CatalogItem) {
    try {
      await waFetch("/api/seller/whatsapp-bot/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, isActive: !p.active }),
      });
      load();
      toast.success(p.active ? "Producto desactivado para el bot" : "Producto activado");
    } catch (e) {
      waCatch(e);
    }
  }

  async function saveKeywords(p: CatalogItem, keywords: string) {
    try {
      await waFetch("/api/seller/whatsapp-bot/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, keywords }),
      });
      toast.success("Palabras clave guardadas");
    } catch (e) {
      waCatch(e);
    }
  }

  return (
    <div className="wa-page">
      <WaPageHeader
        title="Catálogo"
        subtitle="Productos activos de tu tienda — el bot los usa para responder"
      />
      <input
        className="wa-field mb-4 max-w-md"
        placeholder="Buscar producto o SKU…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      ) : products.length === 0 ? (
        <WaEmpty title="Sin productos activos" desc="Publicá productos en Madsjeez para que el bot los cite." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {products.map((p) => (
            <div key={p.id} className={`wa-soft p-4 ${!p.active ? "opacity-60" : ""}`}>
              <p className="font-bold text-white line-clamp-2">{p.title}</p>
              <p className="text-green-400 font-black mt-1">
                ${p.price.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Stock: {p.stock} · {p.category} · {p.active ? "Activo" : "Inactivo"}
              </p>
              <input
                className="wa-field text-xs mt-2"
                placeholder="Palabras clave IA (coma)"
                defaultValue={p.keywords ?? ""}
                onBlur={(e) => saveKeywords(p, e.target.value)}
              />
              <button
                type="button"
                className="wa-btn-ghost text-xs mt-2 w-full"
                onClick={() => toggleActive(p)}
              >
                {p.active ? "Desactivar en bot" : "Activar en bot"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatsappBotCampanasView() {
  const [campaigns, setCampaigns] = useState<
    {
      id: string;
      name: string;
      status: string;
      sentCount: number;
      messageTemplate: string;
      segment?: { stages?: string[] };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [campName, setCampName] = useState("");
  const [campMsg, setCampMsg] = useState("");
  const [campStages, setCampStages] = useState<string[]>(["new", "warm"]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    waFetch<{ campaigns: typeof campaigns }>("/api/seller/whatsapp-bot/campaigns")
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(waCatch)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function createCampaign() {
    if (!campName.trim() || !campMsg.trim()) {
      toast.error("Completá nombre y mensaje");
      return;
    }
    try {
      await waFetch("/api/seller/whatsapp-bot/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campName,
          messageTemplate: campMsg,
          segment: { stages: campStages },
        }),
      });
      setCampName("");
      setCampMsg("");
      setShowCreate(false);
      load();
      toast.success("Borrador creado");
    } catch (e) {
      waCatch(e);
    }
  }

  async function sendCampaign(id: string) {
    if (
      !confirm(
        "¿Enviar campaña? Máximo 50 contactos. Requiere WhatsApp conectado. Esta acción es irreversible."
      )
    )
      return;
    setSendingId(id);
    try {
      const d = await waFetch<{ sent: number; failed?: number; message?: string }>(
        `/api/seller/whatsapp-bot/campaigns/${id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        }
      );
      toast.success(`Enviados: ${d.sent ?? 0}${d.failed ? ` · fallos: ${d.failed}` : ""}`);
      load();
    } catch (e) {
      waCatch(e);
    } finally {
      setSendingId(null);
    }
  }

  async function pauseCampaign(id: string) {
    try {
      await waFetch(`/api/seller/whatsapp-bot/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      });
      load();
      toast.success("Campaña pausada");
    } catch (e) {
      waCatch(e);
    }
  }

  return (
    <div className="wa-page">
      <WaPageHeader title="Campañas" subtitle="Envíos masivos con confirmación y rate limit" />
      <div className="wa-honest-box mb-4">
        Anti-spam: máximo 50 contactos por envío, 2.5 s entre mensajes. Requiere confirmación explícita.
      </div>
      <button
        type="button"
        className="wa-btn-primary mb-4"
        onClick={() => setShowCreate((v) => !v)}
      >
        <Plus className="h-4 w-4" /> Nueva campaña
      </button>
      {showCreate ? (
        <div className="wa-soft p-4 mb-4 space-y-3">
          <input
            className="wa-field"
            placeholder="Nombre"
            value={campName}
            onChange={(e) => setCampName(e.target.value)}
          />
          <textarea
            className="wa-field min-h-[80px]"
            placeholder="Mensaje (podés usar {{name}} y {{phone}})"
            value={campMsg}
            onChange={(e) => setCampMsg(e.target.value)}
          />
          <p className="text-xs text-slate-400">Segmento por etapa:</p>
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`wa-pill-filter ${campStages.includes(s) ? "wa-pill-filter--on" : ""}`}
                onClick={() =>
                  setCampStages((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                  )
                }
              >
                {LEAD_LABEL[s]}
              </button>
            ))}
          </div>
          <button type="button" className="wa-btn-primary" onClick={createCampaign}>
            Guardar borrador
          </button>
        </div>
      ) : null}
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      ) : campaigns.length === 0 ? (
        <WaEmpty title="Sin campañas" />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="wa-soft p-4">
              <p className="font-bold text-white">{c.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {c.status} · enviados: {c.sentCount}
                {c.segment?.stages?.length
                  ? ` · etapas: ${c.segment.stages.map((s) => LEAD_LABEL[s] ?? s).join(", ")}`
                  : ""}
              </p>
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{c.messageTemplate}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {c.status === "draft" || c.status === "paused" ? (
                  <button
                    type="button"
                    className="wa-btn-primary text-sm"
                    disabled={sendingId === c.id}
                    onClick={() => sendCampaign(c.id)}
                  >
                    {sendingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enviar con confirmación"
                    )}
                  </button>
                ) : null}
                {c.status === "running" ? (
                  <button
                    type="button"
                    className="wa-btn-ghost text-sm"
                    onClick={() => pauseCampaign(c.id)}
                  >
                    Pausar
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type MetricsPayload = SummaryData["metrics"] & {
  handoffs?: number;
  totalLeads?: number;
  totalConversations?: number;
  campaignsSent?: number;
  automationsEnabled?: number;
};

export function WhatsappBotMetricasView() {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("7d");
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    waFetch<{ metrics: MetricsPayload }>(`/api/seller/whatsapp-bot/metrics?period=${period}`)
      .then((d) => {
        setMetrics(d.metrics);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="wa-page">
        <WaPageHeader title="Métricas" subtitle="Rendimiento del canal WhatsApp" />
        <WaEmpty title="No se pudieron cargar métricas" desc={error ?? undefined} />
      </div>
    );
  }

  return (
    <div className="wa-page">
      <WaPageHeader title="Métricas" subtitle="Datos calculados desde conversaciones y mensajes" />
      <div className="flex gap-2 mb-4">
        {(["today", "7d", "30d"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`wa-pill-filter ${period === p ? "wa-pill-filter--on" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {p === "today" ? "Hoy" : p === "7d" ? "7 días" : "30 días"}
          </button>
        ))}
      </div>
      <div className="wa-metric-grid">
        <WaMetricCard label="Entrantes" value={metrics.messagesInbound} />
        <WaMetricCard label="Resp. IA" value={metrics.aiReplies} />
        <WaMetricCard label="Resp. humano" value={metrics.humanReplies} />
        <WaMetricCard label="Derivaciones" value={metrics.handoffs ?? 0} />
        <WaMetricCard label="Total leads" value={metrics.totalLeads ?? 0} />
        <WaMetricCard label="Campañas enviadas" value={metrics.campaignsSent ?? 0} />
        <WaMetricCard
          label="Automatizaciones activas"
          value={metrics.automationsEnabled ?? 0}
        />
      </div>
      <p className="wa-section-title mt-6 mb-2">Conversión por etapa</p>
      <WaBarChart
        data={LEAD_STATUSES.map((s) => ({
          label: LEAD_LABEL[s],
          value: metrics.byStage[s] ?? 0,
        }))}
      />
    </div>
  );
}
