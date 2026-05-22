"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WaBarChart, WaEmpty, WaMetricCard, WaPageHeader } from "./WaShared";
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
  }[];
};

export function WhatsappBotResumenView() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/whatsapp-bot/summary")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error("No se pudo cargar el resumen"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
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
        <WaMetricCard label="Respuestas IA" value={m.aiReplies} foot="7 días" />
        <WaMetricCard label="Conversión" value={`${m.conversionPct}%`} foot="Clientes / leads" />
      </div>
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

  const load = useCallback(() => {
    fetch("/api/seller/whatsapp-bot/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
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
    const res = await fetch(`/api/seller/whatsapp-bot/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      load();
      toast.success("Contacto actualizado");
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
            onClick={() => {
              const phone = prompt("Teléfono (solo números):");
              const name = prompt("Nombre (opcional):");
              if (!phone) return;
              fetch("/api/seller/whatsapp-bot/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, name }),
              }).then(() => {
                load();
                toast.success("Contacto creado");
              });
            }}
          >
            <Plus className="h-4 w-4" /> Nuevo contacto
          </button>
        }
      />
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
                  <td className="p-3 text-white">{l.name || "—"}</td>
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
                  <td className="p-3 text-slate-400">whatsapp</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="wa-btn-ghost text-xs py-1"
                      onClick={() => onOpenConversation?.(l.phone)}
                    >
                      Abrir chat
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

  const load = () =>
    fetch("/api/seller/whatsapp-bot/automations")
      .then((r) => r.json())
      .then((d) => setItems(d.automations ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function createFromTemplate(t: (typeof TEMPLATES)[0]) {
    await fetch("/api/seller/whatsapp-bot/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    load();
    toast.success("Automatización creada");
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
      <div className="flex flex-wrap gap-2 mb-6">
        {TEMPLATES.map((t) => (
          <button key={t.name} type="button" className="wa-quick-chip" onClick={() => createFromTemplate(t)}>
            {t.name}
          </button>
        ))}
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
                    fetch(`/api/seller/whatsapp-bot/automations/${a.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enabled: !a.enabled }),
                    }).then(load)
                  }
                >
                  {a.enabled ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  className="wa-btn-ghost text-xs text-red-300"
                  onClick={() =>
                    fetch(`/api/seller/whatsapp-bot/automations/${a.id}`, { method: "DELETE" }).then(
                      load
                    )
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

export function WhatsappBotCatalogoView() {
  const [products, setProducts] = useState<
    { id: string; title: string; price: number; stock: number; category: string }[]
  >([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/seller/whatsapp-bot/catalog${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [q]);

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
            <div key={p.id} className="wa-soft p-4">
              <p className="font-bold text-white line-clamp-2">{p.title}</p>
              <p className="text-green-400 font-black mt-1">
                ${p.price.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Stock: {p.stock} · {p.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatsappBotCampanasView() {
  const [campaigns, setCampaigns] = useState<
    { id: string; name: string; status: string; sentCount: number; messageTemplate: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/seller/whatsapp-bot/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="wa-page">
      <WaPageHeader title="Campañas" subtitle="Envíos masivos con confirmación y rate limit" />
      <div className="wa-honest-box mb-4">
        Anti-spam: máximo 50 contactos por envío, 2.5 s entre mensajes. Requiere confirmación explícita.
      </div>
      <button
        type="button"
        className="wa-btn-primary mb-4"
        onClick={() => {
          const name = prompt("Nombre de campaña:");
          const msg = prompt("Mensaje:");
          if (!name || !msg) return;
          fetch("/api/seller/whatsapp-bot/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, messageTemplate: msg }),
          }).then(() => {
            load();
            toast.success("Borrador creado");
          });
        }}
      >
        <Plus className="h-4 w-4" /> Nueva campaña
      </button>
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
              </p>
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{c.messageTemplate}</p>
              {c.status === "draft" ? (
                <button
                  type="button"
                  className="wa-btn-primary mt-3 text-sm"
                  onClick={() => {
                    if (
                      !confirm(
                        "¿Enviar campaña? Máximo 50 contactos. Esta acción no se puede deshacer fácilmente."
                      )
                    )
                      return;
                    fetch(`/api/seller/whatsapp-bot/campaigns/${c.id}/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirm: true }),
                    })
                      .then((r) => r.json())
                      .then((d) => {
                        toast.success(`Enviados: ${d.sent ?? 0}`);
                        load();
                      });
                  }}
                >
                  Enviar con confirmación
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatsappBotMetricasView() {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("7d");
  const [metrics, setMetrics] = useState<SummaryData["metrics"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seller/whatsapp-bot/metrics?period=${period}`)
      .then((r) => r.json())
      .then((d) => setMetrics(d.metrics))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !metrics) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="wa-page">
      <WaPageHeader title="Métricas" subtitle="Rendimiento del canal WhatsApp" />
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
