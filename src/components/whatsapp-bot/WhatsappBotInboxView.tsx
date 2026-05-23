"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hash,
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  Smile,
  User,
  UserRound,
  Video,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { waCatch, waFetch } from "./WaShared";
import { WaAvatar, WaButton, WaChipList } from "./ui";
import { WaEmpty } from "./WaShared";
import {
  displayName,
  formatSyncedAt,
  formatTime,
  LEAD_LABEL,
  LEAD_STATUSES,
  STATUS_LABEL,
  type ConversationRow,
  type FilterTab,
  type LeadRow,
  type MessageRow,
  type SessionState,
} from "./types";

function Pipeline({ leads }: { leads: LeadRow[] }) {
  const stages: { key: (typeof LEAD_STATUSES)[number]; label: string; color: string }[] = [
    { key: "new", label: "Nuevo", color: "wa-pipeline-col--blue" },
    { key: "warm", label: "Tibio", color: "wa-pipeline-col--amber" },
    { key: "hot", label: "Caliente", color: "wa-pipeline-col--orange" },
    { key: "customer", label: "Cliente", color: "wa-pipeline-col--emerald" },
    { key: "closed", label: "Cerrado", color: "wa-pipeline-col--green" },
    { key: "lost", label: "Perdido", color: "wa-pipeline-col--red" },
  ];
  return (
    <section className="wa-pipeline">
      <div className="wa-pipeline-head">
        <p className="wa-pipeline-title">Pipeline de leads</p>
        <p className="wa-pipeline-hint">Vista rápida de oportunidades por etapa</p>
      </div>
      <div className="wa-pipeline-grid wa-pipeline-grid--compact">
        {stages.map(({ key, label, color }) => {
          const inStage = leads.filter((l) => l.status === key);
          const pct = leads.length ? Math.round((inStage.length / leads.length) * 100) : 0;
          return (
            <div key={key} className={`wa-pipeline-col ${color}`}>
              <div className="wa-pipeline-col-head">
                <span>{label}</span>
                <span className="wa-pipeline-count">{inStage.length}</span>
              </div>
              <div className="wa-pipeline-bar">
                <div className="wa-pipeline-bar-fill" style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type Props = {
  session: SessionState | null;
  conversations: ConversationRow[];
  leads: LeadRow[];
  search: string;
  filter: FilterTab;
  selectedId: string | null;
  messages: MessageRow[];
  messagesLoading: boolean;
  replyText: string;
  sending: boolean;
  connStatus: string;
  onSearchChange: (v: string) => void;
  onFilterChange: (f: FilterTab) => void;
  onSelectConversation: (id: string) => void;
  onReplyChange: (v: string) => void;
  onSendReply: () => void;
  onHandoff: (id: string) => void;
  onReactivate: (id: string) => void;
  onUpdateLeadStatus: (leadId: string, status: string) => void;
  onPatchLead: (leadId: string, body: Record<string, unknown>) => void;
  onRefresh: () => void;
  /** Incrementar tras enviar mensaje para bajar el scroll del chat. */
  chatScrollTrigger?: number;
  /** Recargar leads tras sync de contacto. */
  onLeadsRefresh?: () => void;
};

const CHAT_SCROLL_THRESHOLD_PX = 96;

function scrollChatToBottom(el: HTMLDivElement, behavior: ScrollBehavior = "auto") {
  if (behavior === "smooth") {
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  } else {
    el.scrollTop = el.scrollHeight;
  }
}

function isChatNearBottom(el: HTMLDivElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= CHAT_SCROLL_THRESHOLD_PX;
}

export default function WhatsappBotInboxView({
  session,
  conversations,
  leads,
  search,
  filter,
  selectedId,
  messages,
  messagesLoading,
  replyText,
  sending,
  connStatus,
  onSearchChange,
  onFilterChange,
  onSelectConversation,
  onReplyChange,
  onSendReply,
  onHandoff,
  onReactivate,
  onUpdateLeadStatus,
  onPatchLead,
  onRefresh,
  chatScrollTrigger = 0,
  onLeadsRefresh,
}: Props) {
  const [notesDraft, setNotesDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [crmSyncing, setCrmSyncing] = useState<"contacts" | "recent" | null>(null);
  const [contactPanelOpen, setContactPanelOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedLead = selected?.leadId ? leads.find((l) => l.id === selected.leadId) : null;

  const filteredConversations = useMemo(() => {
    let list = conversations;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.phone.includes(q) ||
          displayName(c).toLowerCase().includes(q) ||
          (c.lastMessage?.content.toLowerCase().includes(q) ?? false)
      );
    }
    if (filter === "bot") list = list.filter((c) => c.status === "bot_active");
    if (filter === "human") list = list.filter((c) => c.status === "human_active");
    if (filter === "leads") list = list.filter((c) => ["new", "warm", "hot"].includes(c.leadStatus));
    if (filter === "unread")
      list = list.filter((c) => c.lastMessage?.senderType === "customer");
    return list;
  }, [conversations, search, filter]);

  const syncOk = connStatus === "connected";
  const botCount = conversations.filter((c) => c.status === "bot_active").length;
  const humanCount = conversations.filter((c) => c.status === "human_active").length;
  const unreadCount = conversations.filter((c) => c.lastMessage?.senderType === "customer").length;

  useEffect(() => {
    if (selectedId) setContactPanelOpen(true);
  }, [selectedId]);

  async function runCrmSync(action: "contacts" | "recent") {
    if (!selected) return;
    setCrmSyncing(action);
    try {
      const d = await waFetch<{
        totalCreated?: number;
        totalUpdated?: number;
        errors?: string[];
        noHistoryWarning?: boolean;
      }>("/api/seller/whatsapp-bot/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "recent" ? "recent" : "contacts",
          phone: action === "recent" ? selected.phone : undefined,
          enrichProfile: true,
        }),
      });
      toast.success(
        `Sync OK · nuevos: ${d.totalCreated ?? 0} · actualizados: ${d.totalUpdated ?? 0}`
      );
      if (d.noHistoryWarning || d.errors?.length) {
        toast.info(d.errors?.[0] ?? "Historial limitado en esta instancia Evolution.");
      }
      onRefresh();
      onLeadsRefresh?.();
    } catch (e) {
      waCatch(e);
    } finally {
      setCrmSyncing(null);
    }
  }

  useEffect(() => {
    if (selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      prevLastMessageIdRef.current = null;
      stickToBottomRef.current = true;
      const el = chatScrollRef.current;
      if (el) requestAnimationFrame(() => scrollChatToBottom(el));
    }
  }, [selectedId]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || messages.length === 0) return;

    const last = messages[messages.length - 1];
    const lastId = last?.id ?? null;
    const isNewTail = lastId !== prevLastMessageIdRef.current;
    prevLastMessageIdRef.current = lastId;

    if (!isNewTail) return;

    const shouldScroll =
      stickToBottomRef.current ||
      (messages.length === 1 && messagesLoading === false);

    if (shouldScroll) {
      requestAnimationFrame(() =>
        scrollChatToBottom(el, stickToBottomRef.current ? "smooth" : "auto")
      );
    }
  }, [messages, messagesLoading]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || chatScrollTrigger === 0) return;
    stickToBottomRef.current = true;
    requestAnimationFrame(() => scrollChatToBottom(el, "smooth"));
  }, [chatScrollTrigger]);

  return (
    <div className="wa-page wa-inbox w-full max-w-none">
      <header className="wa-inbox-header">
        <div>
          <h1 className="wa-page-title">Inbox de WhatsApp</h1>
          <p className="wa-page-sub">
            Conversaciones, leads, historial sincronizado y bot vendedor en un solo panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="wa-btn-ghost text-sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" /> Sync historial
          </button>
          <button type="button" className="wa-btn-primary text-sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </header>

      <div className={`wa-sync-banner ${syncOk ? "wa-sync-banner--ok" : "wa-sync-banner--warn"}`}>
        {syncOk ? (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Sincronizado</strong> — WhatsApp conectado. Recibís mensajes nuevos y podés
              importar historial si Evolution lo permite.
            </span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 shrink-0" />
            <span>
              <strong>{STATUS_LABEL[connStatus] ?? connStatus}</strong> — Conectá en Configuración
              para recibir y enviar.
            </span>
          </>
        )}
      </div>

      <div className="wa-inbox-stats">
        <div className="wa-stat-tile wa-stat-tile--blue">
          <MessageSquare className="h-5 w-5" />
          <div>
            <p className="wa-stat-value">{conversations.length}</p>
            <p className="wa-stat-label">Chats activos</p>
            <p className="wa-stat-sub">Conversaciones abiertas</p>
          </div>
        </div>
        <div className="wa-stat-tile wa-stat-tile--emerald">
          <Bot className="h-5 w-5" />
          <div>
            <p className="wa-stat-value">{botCount}</p>
            <p className="wa-stat-label">Bot IA</p>
            <p className="wa-stat-sub">Respondiendo automático</p>
          </div>
        </div>
        <div className="wa-stat-tile wa-stat-tile--orange">
          <User className="h-5 w-5" />
          <div>
            <p className="wa-stat-value">{humanCount}</p>
            <p className="wa-stat-label">Humanos</p>
            <p className="wa-stat-sub">Atendidos por vendedor</p>
          </div>
        </div>
        <div className="wa-stat-tile wa-stat-tile--purple">
          <Clock className="h-5 w-5" />
          <div>
            <p className="wa-stat-value">{unreadCount}</p>
            <p className="wa-stat-label">Sin responder</p>
            <p className="wa-stat-sub">Requieren revisión</p>
          </div>
        </div>
      </div>

      <div
        className={`wa-inbox-workspace ${contactPanelOpen ? "" : "wa-inbox-workspace--expanded"}`}
      >
        <div className="wa-inbox-grid">
          <div className="wa-col-list">
            <div className="wa-col-list-toolbar">
              <div className="wa-search wa-search--inset">
                <Search className="h-4 w-4 text-slate-500 shrink-0" />
                <input
                  className="wa-search-input"
                  placeholder="Buscar por nombre, teléfono…"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <button type="button" className="wa-icon-btn" title="Filtros">
                <Hash className="h-4 w-4" />
              </button>
            </div>
            <div className="wa-col-list-filters">
              {(
                [
                  ["all", `Todos (${conversations.length})`],
                  ["bot", `IA (${botCount})`],
                  ["human", `Humanos (${humanCount})`],
                  ["unread", `Sin responder (${unreadCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`wa-pill-filter ${filter === key ? "wa-pill-filter--on" : ""}`}
                  onClick={() => onFilterChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="wa-col-list-head">
              <span>Conversaciones</span>
              <button type="button" className="wa-icon-btn text-slate-500">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="wa-scroll wa-col-list-scroll">
              {filteredConversations.length === 0 ? (
                <div className="p-4">
                  <WaEmpty
                    title="Sin conversaciones"
                    desc="Conectá WhatsApp en Configuración y esperá un mensaje nuevo."
                  />
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isHuman = c.status === "human_active";
                  const needsReply = c.lastMessage?.senderType === "customer";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectConversation(c.id)}
                      className={`wa-conv-item ${selectedId === c.id ? "wa-conv-item--active" : ""}`}
                    >
                      <WaAvatar label={displayName(c)} imageUrl={c.leadProfilePicUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate font-medium text-slate-200 text-sm">
                              {displayName(c)}
                            </p>
                            <span
                              className={`wa-conv-badge ${isHuman ? "wa-conv-badge--human" : "wa-conv-badge--bot"}`}
                            >
                              {isHuman ? "Humano" : "Bot IA"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {formatTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-slate-400">
                            {c.lastMessage?.content ?? "—"}
                          </p>
                          {needsReply && selectedId !== c.id ? (
                            <span className="wa-unread-dot" aria-hidden />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="wa-col-chat">
            {!selected ? (
              <p className="m-auto p-8 text-sm text-slate-500">Seleccioná una conversación</p>
            ) : (
              <>
                <div className="wa-chat-head">
                  <div className="flex items-center gap-3 min-w-0">
                    <WaAvatar
                      label={displayName(selected)}
                      imageUrl={selected.leadProfilePicUrl}
                      className="wa-chat-head-avatar"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-white flex items-center gap-1.5 truncate">
                        {displayName(selected)}
                        {syncOk ? <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : null}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span
                          className={`wa-conv-badge ${selected.status === "human_active" ? "wa-conv-badge--human" : "wa-conv-badge--bot"}`}
                        >
                          {selected.status === "human_active" ? "Humano" : "Bot IA"}
                        </span>
                        {selectedLead?.intent ? (
                          <span className="wa-intent-badge">{selectedLead.intent}</span>
                        ) : (
                          <span className="wa-intent-badge">Consulta general</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!contactPanelOpen ? (
                      <button
                        type="button"
                        className="wa-btn-ghost text-xs py-1"
                        onClick={() => setContactPanelOpen(true)}
                      >
                        Ver contacto
                      </button>
                    ) : null}
                    <button type="button" className="wa-icon-btn" title="Llamar">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button type="button" className="wa-icon-btn" title="Video">
                      <Video className="h-4 w-4" />
                    </button>
                    <button type="button" className="wa-icon-btn" title="Abrir">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    {selected.status !== "human_active" ? (
                      <WaButton variant="ghost" className="text-xs" onClick={() => onHandoff(selected.id)}>
                        <UserRound className="h-4 w-4" /> Tomar control
                      </WaButton>
                    ) : (
                      <WaButton variant="ghost" className="text-xs" onClick={() => onReactivate(selected.id)}>
                        <Bot className="h-4 w-4" /> Reactivar bot
                      </WaButton>
                    )}
                  </div>
                </div>
                <div
                  ref={chatScrollRef}
                  className="wa-chat-bg wa-scroll flex-1 overflow-y-auto overflow-x-hidden px-5 py-4"
                  onScroll={() => {
                    const el = chatScrollRef.current;
                    if (el) stickToBottomRef.current = isChatNearBottom(el);
                  }}
                >
                  <div className="wa-chat-date-pill"><span>Hoy</span></div>
                  {messagesLoading && messages.length === 0 ? (
                    <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-slate-500" />
                  ) : (
                    messages.map((m) => {
                      const isOut = m.direction === "outbound";
                      const isBot = m.senderType === "bot";
                      const who =
                        m.senderType === "customer"
                          ? "Cliente"
                          : m.senderType === "seller"
                            ? "Vendedor"
                            : "Bot IA";
                      return (
                        <div
                          key={m.id}
                          className={`wa-msg-row ${isOut ? "wa-msg-row--out" : "wa-msg-row--in"}`}
                        >
                          <span className="wa-msg-who">{who}</span>
                          <div className="wa-msg-line">
                            <div
                              className={`wa-bubble-${isOut ? "out" : "in"} ${isOut && isBot ? "wa-bubble-bot" : ""}`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                            </div>
                            <span className="wa-msg-time">{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="wa-chat-compose">
                  <div className="wa-chat-compose-inner">
                    <button type="button" className="wa-icon-btn">
                      <Smile className="h-5 w-5" />
                    </button>
                    <button type="button" className="wa-icon-btn">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                      className="wa-compose-input"
                      value={replyText}
                      onChange={(e) => onReplyChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendReply()}
                      placeholder="Escribí un mensaje…"
                      disabled={connStatus !== "connected" || sending}
                    />
                    <WaButton
                      className="wa-compose-send"
                      onClick={onSendReply}
                      disabled={!replyText.trim() || connStatus !== "connected"}
                      loading={sending}
                    >
                      <Send className="h-4 w-4" />
                    </WaButton>
                  </div>
                  {connStatus !== "connected" ? (
                    <p className="mt-2 text-xs text-amber-400 px-1">
                      Conectá WhatsApp en Configuración para enviar.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {contactPanelOpen && selected ? (
            <div className="wa-col-crm wa-scroll">
              <div className="wa-crm-head">
                <h3>Información del contacto</h3>
                <button
                  type="button"
                  className="wa-icon-btn"
                  aria-label="Cerrar panel"
                  onClick={() => setContactPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="wa-crm-profile">
                <WaAvatar
                  label={displayName(selected)}
                  imageUrl={selected.leadProfilePicUrl}
                  className="h-12 w-12 text-lg"
                />
                <div>
                  <p className="text-lg font-medium text-white">{displayName(selected)}</p>
                  <p className="text-sm text-slate-400">{selected.phone}</p>
                </div>
              </div>

              <div className="wa-crm-badges">
                <span
                  className={`wa-conv-badge ${selected.status === "human_active" ? "wa-conv-badge--human" : "wa-conv-badge--bot"}`}
                >
                  {selected.status === "human_active" ? "Humano" : "Bot IA"}
                </span>
                {selectedLead?.intent ? (
                  <span className="wa-intent-badge">{selectedLead.intent}</span>
                ) : null}
              </div>

              <div className="wa-crm-actions">
                <button type="button" className="wa-crm-action-btn">
                  <Phone className="h-4 w-4" />
                </button>
                <button type="button" className="wa-crm-action-btn">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                </button>
                <button type="button" className="wa-crm-action-btn">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              {selected.leadId ? (
                <div className="wa-crm-section">
                  <label className="wa-crm-label">Etapa del lead</label>
                  <select
                    className="wa-field"
                    value={selected.leadStatus}
                    onChange={(e) => onUpdateLeadStatus(selected.leadId!, e.target.value)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {selectedLead?.intent ? (
                <div className="wa-crm-section">
                  <label className="wa-crm-label">Intención detectada</label>
                  <div className="wa-crm-intent-box">
                    <span aria-hidden>⭐</span> {selectedLead.intent}
                  </div>
                </div>
              ) : null}

              <div className="wa-crm-section">
                <p className="wa-crm-section-title">Datos de WhatsApp</p>
                <div className="wa-crm-info-row">
                  <span>País / número</span>
                  <span>Argentina / {selected.phone}</span>
                </div>
                <div className="wa-crm-info-row">
                  <span>Nombre completo</span>
                  <span>{displayName(selected)}</span>
                </div>
                {selectedLead?.pushName && selectedLead.pushName !== displayName(selected) ? (
                  <div className="wa-crm-info-row">
                    <span>Push name</span>
                    <span>{selectedLead.pushName}</span>
                  </div>
                ) : null}
                <div className="wa-crm-info-row">
                  <span>Últ. sync</span>
                  <span>
                    {formatSyncedAt(selected.leadLastSyncedAt ?? selectedLead?.lastSyncedAt)}{" "}
                    <button
                      type="button"
                      className="text-blue-400 hover:underline ml-1"
                      disabled={crmSyncing !== null || connStatus !== "connected"}
                      onClick={() => runCrmSync("contacts")}
                    >
                      {crmSyncing === "contacts" ? "…" : "Sync contacto"}
                    </button>
                  </span>
                </div>
                <WaButton
                  variant="ghost"
                  className="text-xs w-full mt-2"
                  loading={crmSyncing === "recent"}
                  disabled={crmSyncing !== null || connStatus !== "connected"}
                  onClick={() => runCrmSync("recent")}
                >
                  Sync mensajes
                </WaButton>
              </div>

              {(selected.leadWhatsappLabels?.length ?? 0) > 0 ||
              (selectedLead?.whatsappLabels?.length ?? 0) > 0 ? (
                <div className="wa-crm-section">
                  <label className="wa-crm-label">Etiquetas WhatsApp</label>
                  <WaChipList
                    items={
                      selected.leadWhatsappLabels?.length
                        ? selected.leadWhatsappLabels
                        : (selectedLead?.whatsappLabels ?? [])
                    }
                    kind="whatsapp"
                    empty="Sin etiquetas"
                  />
                </div>
              ) : null}

              {selected.leadId && selectedLead ? (
                <>
                  <div className="wa-crm-section">
                    <div className="flex justify-between items-center mb-2">
                      <label className="wa-crm-label mb-0">Tags CRM</label>
                    </div>
                    {(selectedLead.tags ?? []).length > 0 ? (
                      <WaChipList items={selectedLead.tags ?? []} kind="crm" />
                    ) : (
                      <p className="text-xs text-slate-500 mb-2">Sin tags CRM</p>
                    )}
                    <input
                      className="wa-field text-sm"
                      defaultValue={(selectedLead.tags ?? []).join(", ")}
                      onChange={(e) => setTagsDraft(e.target.value)}
                      onBlur={() => {
                        const tags = tagsDraft
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .slice(0, 12);
                        onPatchLead(selected.leadId!, { tags });
                      }}
                      placeholder="mayorista, envío"
                    />
                  </div>
                  <div className="wa-crm-section">
                    <label className="wa-crm-label">Notas internas</label>
                    <textarea
                      className="wa-field text-sm min-h-[72px]"
                      defaultValue={selectedLead.internalNotes ?? ""}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      onBlur={() =>
                        onPatchLead(selected.leadId!, {
                          internalNotes: notesDraft || null,
                        })
                      }
                      placeholder="Solo visible para tu equipo…"
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Pipeline leads={leads} />
    </div>
  );
}
