"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Megaphone, Package, Plus, RefreshCw, Trash2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  WaBarChart,
  WaEmpty,
  waCatch,
  WaMetricCard,
  WaPageHeader,
  waFetch,
  waSuccess,
} from "./WaShared";
import {
  WaAvatar,
  WaButton,
  WaCard,
  WaCardHeader,
  WaChipList,
  WaErrorBanner,
  WaModal,
  WaPill,
  WaTableBody,
  WaTableHead,
  WaTableRow,
  WaTableWrap,
  WaTd,
  WaTh,
} from "./ui";
import { displayName, formatSyncedAt, LEAD_LABEL, LEAD_STATUSES } from "./types";
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
      <div className="wa-page w-full max-w-none">
        <WaPageHeader title="Resumen" subtitle="Dashboard ejecutivo" />
        <WaErrorBanner message={error} />
      </div>
    );
  }
  if (!data) return <WaEmpty title="Sin datos de resumen" desc="Volvé a cargar en unos segundos." />;

  const m = data.metrics;
  return (
    <div className="wa-page w-full max-w-none">
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
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    const name = displayName(l).toLowerCase();
    return (
      l.phone.includes(q) ||
      name.includes(q) ||
      (l.intent?.toLowerCase().includes(q) ?? false) ||
      (l.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
      (l.whatsappLabels ?? []).some((t) => t.toLowerCase().includes(q))
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

  async function confirmDeleteLead() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await waFetch(`/api/seller/whatsapp-bot/leads/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      load();
      waSuccess("Contacto eliminado del CRM");
    } catch (e) {
      waCatch(e);
    } finally {
      setDeleting(false);
    }
  }

  async function runSync(action: "contacts" | "recent" | "full") {
    setSyncing(action);
    try {
      const d = await waFetch<{
        totalCreated?: number;
        totalUpdated?: number;
        errors?: string[];
        noHistoryWarning?: boolean;
      }>("/api/seller/whatsapp-bot/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, enrichProfile: true }),
      });
      toast.success(
        `Sync OK · nuevos: ${d.totalCreated ?? 0} · actualizados: ${d.totalUpdated ?? 0}`
      );
      if (d.noHistoryWarning || d.errors?.length) {
        toast.info(
          d.errors?.[0] ??
            "Historial limitado: Evolution puede no devolver chats anteriores al QR."
        );
      }
      load();
    } catch (e) {
      waCatch(e);
    } finally {
      setSyncing(null);
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
    <div className="wa-page w-full max-w-none">
      <WaPageHeader
        title="Contactos"
        subtitle="Base unificada con conversaciones de WhatsApp"
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <WaButton
              variant="ghost"
              className="text-sm"
              loading={syncing === "contacts"}
              disabled={syncing !== null && syncing !== "contacts"}
              onClick={() => runSync("contacts")}
            >
              <RefreshCw className="h-4 w-4" /> Sync contactos
            </WaButton>
            <WaButton
              variant="ghost"
              className="text-sm"
              loading={syncing === "recent"}
              disabled={syncing !== null && syncing !== "recent"}
              onClick={() => runSync("recent")}
            >
              Chats recientes
            </WaButton>
            <WaButton
              variant="ghost"
              className="text-sm"
              loading={syncing === "full"}
              disabled={syncing !== null && syncing !== "full"}
              onClick={() => runSync("full")}
            >
              Sync completa
            </WaButton>
            <WaButton className="text-sm" onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" /> Nuevo contacto
            </WaButton>
          </div>
        }
      />
      <p className="text-xs text-slate-500 mb-4 -mt-2">
        Sincronizá desde WhatsApp conectado (Evolution). Las etiquetas de WhatsApp no se mezclan con
        tags CRM.
      </p>
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
          <WaButton loading={saving} onClick={createContact}>
            Guardar
          </WaButton>
        </div>
      ) : null}
      <input
        className="wa-field mb-4 max-w-md"
        placeholder="Buscar nombre o teléfono…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <WaEmpty
          icon={Users}
          title="Sin contactos"
          desc="Aparecen cuando te escriben por WhatsApp o cuando los creás manualmente."
          action={
            <WaButton onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Crear contacto
            </WaButton>
          }
        />
      ) : (
        <WaTableWrap>
          <WaTableHead>
            <tr>
              <WaTh>Contacto</WaTh>
              <WaTh>Teléfono</WaTh>
              <WaTh>Etiquetas WA</WaTh>
              <WaTh>Tags CRM</WaTh>
              <WaTh>Últ. sync</WaTh>
              <WaTh>Etapa</WaTh>
              <WaTh>Origen</WaTh>
              <WaTh align="right">Acciones</WaTh>
            </tr>
          </WaTableHead>
          <WaTableBody>
            {filtered.map((l) => {
              const label = displayName(l);
              return (
                <WaTableRow key={l.id}>
                  <WaTd>
                    <div className="wa-cell-contact">
                      <WaAvatar label={label} imageUrl={l.profilePicUrl} size="sm" />
                      <div className="wa-cell-contact-text min-w-[160px]">
                        <p className="wa-cell-name">{label}</p>
                        {l.isBusiness ? (
                          <span className="text-[10px] text-emerald-400">Cuenta empresa</span>
                        ) : null}
                        <input
                          className="wa-field py-0.5 text-xs mt-1 max-w-[200px]"
                          defaultValue={l.name ?? ""}
                          placeholder="Alias CRM (opcional)"
                          onBlur={(e) => {
                            const name = e.target.value.trim();
                            if (name !== (l.name ?? "")) patchLead(l.id, { name: name || null });
                          }}
                        />
                      </div>
                    </div>
                  </WaTd>
                  <WaTd className="wa-td-muted font-mono text-xs whitespace-nowrap">{l.phone}</WaTd>
                  <WaTd>
                    <WaChipList
                      items={(l.whatsappLabels ?? []).slice(0, 6)}
                      kind="whatsapp"
                      empty="Sin etiquetas"
                    />
                  </WaTd>
                  <WaTd>
                    <WaChipList items={(l.tags ?? []).slice(0, 6)} kind="crm" empty="Sin tags" />
                  </WaTd>
                  <WaTd className="wa-td-muted text-xs whitespace-nowrap">
                    {formatSyncedAt(l.lastSyncedAt)}
                  </WaTd>
                  <WaTd>
                    <select
                      className="wa-field py-1 text-xs min-w-[110px]"
                      value={l.status}
                      onChange={(e) => patchLead(l.id, { status: e.target.value })}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </WaTd>
                  <WaTd className="wa-td-muted">
                    {SOURCE_LABEL[l.source ?? "whatsapp"] ?? l.source ?? "—"}
                  </WaTd>
                  <WaTd align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <WaButton
                        variant="ghost"
                        className="text-xs py-1"
                        onClick={() => onOpenConversation?.(l.phone)}
                      >
                        Abrir chat
                      </WaButton>
                      <WaButton
                        variant="danger"
                        className="text-xs py-1"
                        onClick={() => setDeleteId(l.id)}
                      >
                        Eliminar
                      </WaButton>
                    </div>
                  </WaTd>
                </WaTableRow>
              );
            })}
          </WaTableBody>
        </WaTableWrap>
      )}

      <WaModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="¿Eliminar contacto?"
        footer={
          <>
            <WaButton variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </WaButton>
            <WaButton variant="danger" loading={deleting} onClick={confirmDeleteLead}>
              Sí, eliminar
            </WaButton>
          </>
        }
      >
        <p>
          Sacamos el contacto del CRM. No borramos el historial de mensajes en conversaciones ya
          guardadas.
        </p>
      </WaModal>
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
  const [creating, setCreating] = useState(false);
  const [deleteAutoId, setDeleteAutoId] = useState<string | null>(null);
  const [deletingAuto, setDeletingAuto] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  async function confirmDeleteAutomation() {
    if (!deleteAutoId) return;
    setDeletingAuto(true);
    try {
      await waFetch(`/api/seller/whatsapp-bot/automations/${deleteAutoId}`, { method: "DELETE" });
      setDeleteAutoId(null);
      load();
      waSuccess("Automatización eliminada");
    } catch (e) {
      waCatch(e);
    } finally {
      setDeletingAuto(false);
    }
  }

  async function createCustom() {
    if (!customName.trim() || !customMsg.trim()) {
      toast.error("Nombre y mensaje son obligatorios");
      return;
    }
    setCreating(true);
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
    } finally {
      setCreating(false);
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
    <div className="wa-page w-full max-w-none">
      <WaPageHeader title="Automatizaciones" subtitle="Reglas que se ejecutan al recibir mensajes" />
      <WaCard className="mb-6 space-y-3">
        <WaCardHeader title="Cómo usar las automatizaciones" subtitle="Disparador → condición → acción" icon={<Zap className="h-4 w-4 text-blue-300" />} />
        <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1.5">
          <li>Elegí un disparador: mensaje nuevo, palabra clave, cambio de etapa o contacto nuevo.</li>
          <li>Definí una condición: si contiene “envío” o si el lead está en Nuevo.</li>
          <li>Elegí una acción: responder, etiquetar, cambiar etapa o derivar a humano.</li>
          <li>Probá la regla antes de activarla con un mensaje de prueba real.</li>
          <li>Revisá cuántas veces se ejecutó en el listado.</li>
          <li>Derivá a humano cuando el bot no tenga certeza.</li>
          <li>Empezá simple: bienvenida, pedir localidad/CP, consultar producto, cierre.</li>
        </ul>
        <div className="wa-soft p-3 text-xs text-slate-400 space-y-1">
          <p>Ejemplo: mensaje contiene “envío” → pedir localidad y código postal.</p>
          <p>Ejemplo: inactividad 24 h → recordatorio corto (próxima versión).</p>
          <p>Ejemplo: reclamo detectado → pasar a humano y etiquetar reclamo.</p>
        </div>
      </WaCard>
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
        <WaButton className="sm:col-span-2 lg:col-span-4" loading={creating} onClick={createCustom}>
          Crear automatización
        </WaButton>
      </div>
      {items.length === 0 ? (
        <WaEmpty
          icon={Zap}
          title="Sin automatizaciones"
          desc="Creá una plantilla o una regla personalizada para empezar."
        />
      ) : (
        <WaTableWrap>
          <WaTableHead>
            <tr>
              <WaTh>Nombre</WaTh>
              <WaTh>Disparador</WaTh>
              <WaTh>Acción</WaTh>
              <WaTh align="center">Ejecuciones</WaTh>
              <WaTh align="center">Estado</WaTh>
              <WaTh align="right">Acciones</WaTh>
            </tr>
          </WaTableHead>
          <WaTableBody>
            {items.map((a) => (
              <WaTableRow key={a.id}>
                <WaTd>
                  <p className="font-bold text-white">{a.name}</p>
                </WaTd>
                <WaTd className="wa-td-muted text-xs">{a.triggerType}</WaTd>
                <WaTd className="wa-td-muted text-xs">{a.actionType}</WaTd>
                <WaTd align="center" className="font-bold">
                  {a.runCount}
                </WaTd>
                <WaTd align="center">
                  <WaPill tone={a.enabled ? "green" : "slate"}>
                    {a.enabled ? "Activa" : "Pausada"}
                  </WaPill>
                </WaTd>
                <WaTd align="right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <WaButton
                      variant="ghost"
                      className="text-xs py-1"
                      loading={togglingId === a.id}
                      onClick={async () => {
                        setTogglingId(a.id);
                        try {
                          await waFetch(`/api/seller/whatsapp-bot/automations/${a.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ enabled: !a.enabled }),
                          });
                          load();
                          waSuccess(a.enabled ? "Regla pausada" : "Regla activada");
                        } catch (e) {
                          waCatch(e);
                        } finally {
                          setTogglingId(null);
                        }
                      }}
                    >
                      {a.enabled ? "Desactivar" : "Activar"}
                    </WaButton>
                    <WaButton
                      variant="danger"
                      className="text-xs py-1"
                      onClick={() => setDeleteAutoId(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </WaButton>
                  </div>
                </WaTd>
              </WaTableRow>
            ))}
          </WaTableBody>
        </WaTableWrap>
      )}

      <WaModal
        open={!!deleteAutoId}
        onClose={() => setDeleteAutoId(null)}
        title="¿Eliminar automatización?"
        footer={
          <>
            <WaButton variant="ghost" onClick={() => setDeleteAutoId(null)}>
              Cancelar
            </WaButton>
            <WaButton variant="danger" loading={deletingAuto} onClick={confirmDeleteAutomation}>
              Sí, eliminar
            </WaButton>
          </>
        }
      >
        <p>La regla deja de ejecutarse. No podés deshacer esta acción.</p>
      </WaModal>
    </div>
  );
}

type CatalogItem = {
  id: string;
  title: string;
  price: number;
  stock: number;
  sku?: string | null;
  category: string;
  active: boolean;
  keywords?: string;
  imageUrl?: string | null;
  productUrl?: string;
  storeUrl?: string | null;
  sellerImageUrl?: string | null;
};

export function WhatsappBotCatalogoView() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [sellerImageUrl, setSellerImageUrl] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    const url = `/api/seller/whatsapp-bot/catalog?active=false&pageSize=200${debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : ""}`;
    waFetch<{ products: CatalogItem[]; total: number; store?: { storeUrl?: string | null; sellerImageUrl?: string | null } }>(url)
      .then((d) => {
        setProducts(d.products ?? []);
        setTotal(d.total ?? d.products?.length ?? 0);
        setStoreUrl(d.store?.storeUrl ?? null);
        setSellerImageUrl(d.store?.sellerImageUrl ?? null);
      })
      .catch(waCatch)
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(p: CatalogItem) {
    setTogglingId(p.id);
    try {
      await waFetch("/api/seller/whatsapp-bot/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, isActive: !p.active }),
      });
      load();
      toast.success(p.active ? "Producto desactivado para el bot" : "Producto activado en el bot");
    } catch (e) {
      waCatch(e);
    } finally {
      setTogglingId(null);
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
    <div className="wa-page w-full max-w-none">
      <WaPageHeader
        title="Catálogo"
        subtitle={`Publicaciones del marketplace — ${total} producto${total === 1 ? "" : "s"} · el bot lee todo el catálogo activo`}
      />
      {(storeUrl || sellerImageUrl) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3">
          {sellerImageUrl ? (
            <img
              src={sellerImageUrl}
              alt="Tienda"
              className="h-10 w-10 rounded-full object-cover border border-slate-600"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-sm text-slate-300">Tu tienda en Madsjeez</p>
            {storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-300 hover:underline truncate block max-w-md"
              >
                {storeUrl}
              </a>
            ) : (
              <p className="text-xs text-slate-500">Configurá tu slug de tienda para link público</p>
            )}
          </div>
        </div>
      )}
      <input
        className="wa-field mb-4 max-w-md"
        placeholder="Buscar producto o SKU…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : products.length === 0 ? (
        <WaEmpty
          icon={Package}
          title="Sin productos"
          desc="Publicá productos en Madsjeez para que el bot los cite en las respuestas."
        />
      ) : (
        <WaTableWrap>
          <WaTableHead>
            <tr>
              <WaTh>Producto</WaTh>
              <WaTh align="right">Precio</WaTh>
              <WaTh align="center">Stock</WaTh>
              <WaTh>Categoría</WaTh>
              <WaTh>Palabras clave IA</WaTh>
              <WaTh align="center">Bot</WaTh>
              <WaTh align="right">Acción</WaTh>
            </tr>
          </WaTableHead>
          <WaTableBody>
            {products.map((p) => (
              <WaTableRow key={p.id}>
                <WaTd>
                  <div className="flex items-start gap-3 min-w-0">
                    {p.imageUrl ? (
                      <a href={p.productUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover border border-slate-600 shrink-0"
                        />
                      </a>
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                        <Package className="h-5 w-5 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      {p.productUrl ? (
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-bold line-clamp-2 hover:text-blue-300 ${p.active ? "text-white" : "text-slate-400"}`}
                        >
                          {p.title}
                        </a>
                      ) : (
                        <p className={`font-bold line-clamp-2 ${p.active ? "text-white" : "text-slate-400"}`}>
                          {p.title}
                        </p>
                      )}
                      {p.sku ? <p className="text-xs text-slate-500 mt-0.5">SKU: {p.sku}</p> : null}
                    </div>
                  </div>
                </WaTd>
                <WaTd align="right" className="text-green-400 font-bold whitespace-nowrap">
                  ${p.price.toLocaleString("es-AR")}
                </WaTd>
                <WaTd align="center">{p.stock}</WaTd>
                <WaTd className="wa-td-muted text-xs">{p.category}</WaTd>
                <WaTd>
                  <input
                    className="wa-field text-xs min-w-[140px]"
                    placeholder="palabras, clave"
                    defaultValue={p.keywords ?? ""}
                    onBlur={(e) => saveKeywords(p, e.target.value)}
                  />
                </WaTd>
                <WaTd align="center">
                  <WaPill tone={p.active ? "green" : "slate"}>
                    {p.active ? "Activo" : "Off"}
                  </WaPill>
                </WaTd>
                <WaTd align="right">
                  <WaButton
                    variant="ghost"
                    className="text-xs"
                    loading={togglingId === p.id}
                    onClick={() => toggleActive(p)}
                  >
                    {p.active ? "Desactivar" : "Activar"}
                  </WaButton>
                </WaTd>
              </WaTableRow>
            ))}
          </WaTableBody>
        </WaTableWrap>
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
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
  const [creatingCamp, setCreatingCamp] = useState(false);

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
    setCreatingCamp(true);
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
    } finally {
      setCreatingCamp(false);
    }
  }

  async function sendCampaign(id: string) {
    setConfirmSendId(null);
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

  const sendTarget = campaigns.find((c) => c.id === confirmSendId);

  return (
    <div className="wa-page w-full max-w-none">
      <WaPageHeader title="Campañas" subtitle="Envíos masivos con confirmación y rate limit" />
      <div className="wa-honest-box mb-4">
        Anti-spam: máximo 50 contactos por envío, 2,5 s entre mensajes. Necesitás confirmación
        explícita antes de mandar.
      </div>
      <WaButton className="mb-4" onClick={() => setShowCreate((v) => !v)}>
        <Plus className="h-4 w-4" /> Nueva campaña
      </WaButton>
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
          <WaButton loading={creatingCamp} onClick={createCampaign}>
            Guardar borrador
          </WaButton>
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <WaEmpty
          icon={Megaphone}
          title="Sin campañas"
          desc="Creá un borrador y enviá cuando tengas WhatsApp conectado."
        />
      ) : (
        <WaTableWrap>
          <WaTableHead>
            <tr>
              <WaTh>Nombre</WaTh>
              <WaTh>Estado</WaTh>
              <WaTh align="center">Enviados</WaTh>
              <WaTh>Segmento</WaTh>
              <WaTh>Mensaje</WaTh>
              <WaTh align="right">Acciones</WaTh>
            </tr>
          </WaTableHead>
          <WaTableBody>
            {campaigns.map((c) => (
              <WaTableRow key={c.id}>
                <WaTd>
                  <p className="font-bold text-white">{c.name}</p>
                </WaTd>
                <WaTd>
                  <WaPill tone={c.status === "running" ? "green" : c.status === "draft" ? "blue" : "slate"}>
                    {c.status}
                  </WaPill>
                </WaTd>
                <WaTd align="center" className="font-bold">
                  {c.sentCount}
                </WaTd>
                <WaTd className="wa-td-muted text-xs max-w-[140px]">
                  {c.segment?.stages?.length
                    ? c.segment.stages.map((s) => LEAD_LABEL[s] ?? s).join(", ")
                    : "—"}
                </WaTd>
                <WaTd className="wa-td-muted text-xs max-w-[220px]">
                  <span className="line-clamp-2">{c.messageTemplate}</span>
                </WaTd>
                <WaTd align="right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {c.status === "draft" || c.status === "paused" ? (
                      <WaButton
                        className="text-sm"
                        loading={sendingId === c.id}
                        onClick={() => setConfirmSendId(c.id)}
                      >
                        Enviar
                      </WaButton>
                    ) : null}
                    {c.status === "running" ? (
                      <WaButton variant="ghost" className="text-sm" onClick={() => pauseCampaign(c.id)}>
                        Pausar
                      </WaButton>
                    ) : null}
                  </div>
                </WaTd>
              </WaTableRow>
            ))}
          </WaTableBody>
        </WaTableWrap>
      )}

      <WaModal
        open={!!confirmSendId}
        onClose={() => setConfirmSendId(null)}
        title="¿Enviar campaña?"
        footer={
          <>
            <WaButton variant="ghost" onClick={() => setConfirmSendId(null)}>
              Cancelar
            </WaButton>
            <WaButton
              loading={!!confirmSendId && sendingId === confirmSendId}
              onClick={() => confirmSendId && sendCampaign(confirmSendId)}
            >
              Sí, enviar ahora
            </WaButton>
          </>
        }
      >
        <p>
          Vas a mandar <strong>{sendTarget?.name ?? "esta campaña"}</strong> a hasta 50 contactos.
          Requiere WhatsApp conectado. Esta acción no se puede deshacer.
        </p>
      </WaModal>
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
      <div className="wa-page w-full max-w-none">
        <WaPageHeader title="Métricas" subtitle="Rendimiento del canal WhatsApp" />
        <WaErrorBanner message={error ?? "No pudimos cargar las métricas."} />
      </div>
    );
  }

  return (
    <div className="wa-page w-full max-w-none">
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
