"use client";

import { useMemo, type RefObject } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Wifi,
} from "lucide-react";
import { WaAvatar, WaCard, WaPill } from "./ui";
import {
  displayName,
  formatTime,
  LEAD_LABEL,
  LEAD_STATUSES,
  LEAD_TONE,
  STATUS_LABEL,
  type ConversationRow,
  type FilterTab,
  type LeadRow,
  type MessageRow,
  type SessionState,
} from "./types";

function Pipeline({
  leads,
  onUpdateStatus,
}: {
  leads: LeadRow[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const stages: { key: (typeof LEAD_STATUSES)[number]; label: string }[] = [
    { key: "new", label: "Nuevo" },
    { key: "warm", label: "Tibio" },
    { key: "hot", label: "Caliente" },
    { key: "customer", label: "Cliente" },
    { key: "closed", label: "Cerrado" },
    { key: "lost", label: "Perdido" },
  ];
  return (
    <section className="wa-pipeline">
      <div className="wa-pipeline-head">
        <p className="wa-pipeline-title">Pipeline de leads</p>
        <p className="wa-pipeline-hint">Arrastrá entre columnas: próxima versión · hoy cambiá etapa desde la tarjeta</p>
      </div>
      <div className="wa-pipeline-grid">
        {stages.map(({ key, label }) => {
          const inStage = leads.filter((l) => l.status === key);
          const top = inStage[0];
          return (
            <div key={key} className="wa-pipeline-col">
              <div className="wa-pipeline-col-head">
                <span>{label}</span>
                <span className="wa-pipeline-count">{inStage.length}</span>
              </div>
              {top ? (
                <div className="wa-pipeline-card">
                  <p className="truncate font-bold text-white text-xs">{top.name || top.phone}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{top.intent ?? "—"}</p>
                  <select
                    className="wa-field mt-2 py-1 text-[10px]"
                    value={top.status}
                    onChange={(e) => onUpdateStatus(top.id, e.target.value)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="wa-pipeline-empty">Vacío</p>
              )}
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
  onRefresh: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

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
  onRefresh,
  messagesEndRef,
}: Props) {
  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedLead = selected?.leadId ? leads.find((l) => l.id === selected.leadId) : null;

  const filteredConversations = useMemo(() => {
    let list = conversations;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.phone.includes(q) ||
          (c.leadName?.toLowerCase().includes(q) ?? false) ||
          (c.lastMessage?.content.toLowerCase().includes(q) ?? false)
      );
    }
    if (filter === "bot") list = list.filter((c) => c.status === "bot_active");
    if (filter === "human") list = list.filter((c) => c.status === "human_active");
    if (filter === "leads") list = list.filter((c) => ["new", "warm", "hot"].includes(c.leadStatus));
    return list;
  }, [conversations, search, filter]);

  const syncOk = connStatus === "connected";
  const botCount = conversations.filter((c) => c.status === "bot_active").length;
  const humanCount = conversations.filter((c) => c.status === "human_active").length;

  return (
    <div className="wa-inbox">
      <header className="wa-inbox-header">
        <div>
          <h1 className="wa-page-title">Inbox de WhatsApp</h1>
          <p className="wa-page-sub">
            Conversaciones en vivo vía Evolution · sin historial previo al QR
          </p>
        </div>
        <button type="button" className="wa-btn-ghost px-3" onClick={onRefresh} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      <div className={`wa-sync-banner ${syncOk ? "wa-sync-banner--ok" : "wa-sync-banner--warn"}`}>
        {syncOk ? (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Sincronizado</strong> — {session?.phoneNumber ?? "WhatsApp conectado"}. Solo
              mensajes nuevos desde la vinculación (no se importa el chat de WhatsApp Web).
            </span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 shrink-0" />
            <span>
              <strong>{STATUS_LABEL[connStatus] ?? connStatus}</strong> — Conectá en Configuración
              para recibir y enviar. Las conversaciones aparecen cuando alguien escribe después del QR.
            </span>
          </>
        )}
      </div>

      <div className="wa-inbox-toolbar">
        <div className="wa-search">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            className="wa-search-input"
            placeholder="Buscar por nombre, teléfono o mensaje…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="wa-filter-pills">
          {(
            [
              ["all", `Todos (${conversations.length})`],
              ["bot", `IA (${botCount})`],
              ["human", `Humanos (${humanCount})`],
              ["leads", "Leads activos"],
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
      </div>

      <div className="wa-inbox-grid">
        <WaCard className="wa-col-list flex flex-col p-0 min-h-0">
          <div className="wa-scroll flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                Sin conversaciones. Conectá WhatsApp y esperá un mensaje nuevo.
              </p>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectConversation(c.id)}
                  className={`wa-conv-item ${selectedId === c.id ? "wa-conv-item--active" : ""}`}
                >
                  <WaAvatar label={displayName(c)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-white text-sm">{displayName(c)}</p>
                      <WaPill tone={LEAD_TONE[c.leadStatus] ?? "slate"}>
                        {LEAD_LABEL[c.leadStatus] ?? c.leadStatus}
                      </WaPill>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {c.lastMessage?.content ?? "—"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {c.status === "human_active" ? (
                        <span className="text-amber-400">Humano</span>
                      ) : (
                        <span className="text-blue-300">Bot IA</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{formatTime(c.lastMessageAt)}</span>
                </button>
              ))
            )}
          </div>
        </WaCard>

        <WaCard className="wa-col-chat flex flex-col p-0 min-h-0">
          {!selected ? (
            <p className="m-auto p-8 text-sm text-slate-500">Seleccioná una conversación</p>
          ) : (
            <>
              <div className="wa-chat-head">
                <div className="flex items-center gap-3">
                  <WaAvatar label={displayName(selected)} />
                  <div>
                    <p className="font-black text-white">{displayName(selected)}</p>
                    <p className="text-xs text-slate-400">{selected.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selected.status !== "human_active" ? (
                    <button type="button" className="wa-btn-ghost text-xs" onClick={() => onHandoff(selected.id)}>
                      <UserRound className="h-4 w-4" /> Tomar control
                    </button>
                  ) : (
                    <button type="button" className="wa-btn-ghost text-xs" onClick={() => onReactivate(selected.id)}>
                      <Bot className="h-4 w-4" /> Reactivar bot
                    </button>
                  )}
                </div>
              </div>
              <div className="wa-chat-bg wa-scroll flex-1 overflow-y-auto px-4 py-4 min-h-[280px]">
                {messagesLoading && messages.length === 0 ? (
                  <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-slate-500" />
                ) : (
                  messages.map((m) => {
                    const isOut = m.direction === "outbound";
                    const isBot = m.senderType === "bot";
                    return (
                      <div key={m.id} className={`mb-3 flex ${isOut ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`wa-bubble-${isOut ? "out" : "in"} ${isOut && isBot ? "wa-bubble-bot" : ""}`}
                        >
                          <p className="text-[10px] opacity-70 mb-1">
                            {m.senderType === "customer"
                              ? "Cliente"
                              : m.senderType === "seller"
                                ? "Vos"
                                : "Bot IA"}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className="text-[10px] opacity-60 mt-1">{formatTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="wa-chat-compose">
                <div className="flex gap-2">
                  <input
                    className="wa-field flex-1"
                    value={replyText}
                    onChange={(e) => onReplyChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendReply()}
                    placeholder="Escribí un mensaje…"
                    disabled={connStatus !== "connected" || sending}
                  />
                  <button
                    type="button"
                    className="wa-btn-primary bg-green-600 hover:bg-green-500"
                    onClick={onSendReply}
                    disabled={sending || !replyText.trim() || connStatus !== "connected"}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                {connStatus !== "connected" ? (
                  <p className="mt-2 text-xs text-amber-400">Conectá WhatsApp en Configuración para enviar.</p>
                ) : null}
              </div>
            </>
          )}
        </WaCard>

        <WaCard className="wa-col-crm min-h-0 space-y-4">
          {selected ? (
            <>
              <div className="flex items-center gap-3">
                <WaAvatar label={displayName(selected)} className="h-14 w-14 text-lg" />
                <div>
                  <p className="text-lg font-black text-white">{displayName(selected)}</p>
                  <WaPill tone={LEAD_TONE[selected.leadStatus] ?? "slate"}>
                    {LEAD_LABEL[selected.leadStatus] ?? selected.leadStatus}
                  </WaPill>
                  <p className="mt-1 text-sm text-slate-400">{selected.phone}</p>
                </div>
              </div>
              {selected.leadId ? (
                <div className="wa-soft p-3">
                  <p className="text-xs text-slate-400 mb-2">Etapa del lead</p>
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
                <div className="wa-soft p-3">
                  <p className="text-xs font-bold text-white mb-1">Intención detectada</p>
                  <p className="text-sm text-slate-300">{selectedLead.intent}</p>
                </div>
              ) : null}
              <div className="wa-soft p-3">
                <p className="text-xs font-bold text-white mb-1">Estado conversación</p>
                <p className="text-sm text-slate-300">
                  {selected.status === "human_active"
                    ? "Atendés vos (humano)"
                    : "Bot IA respondiendo"}
                </p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Notas y etiquetas avanzadas: próxima iteración. No hay historial completo de WhatsApp
                Web por API; solo mensajes desde la conexión Evolution.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Elegí un contacto para ver el perfil CRM.</p>
          )}
        </WaCard>
      </div>

      <Pipeline leads={leads} onUpdateStatus={onUpdateLeadStatus} />
    </div>
  );
}
