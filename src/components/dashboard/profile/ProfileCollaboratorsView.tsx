"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Monitor, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  COLLABORATOR_SECTIONS,
  type CollaboratorSectionDef,
  type CollaboratorSectionPermission,
} from "@/lib/collaborators/sections";

interface ProfileCollaboratorsViewProps {
  onBack: () => void;
}

type SectionDraft = Record<string, { enabled: boolean; level: CollaboratorSectionPermission }>;

type ApiInvite = {
  id: string;
  email: string;
  permissions: Record<string, CollaboratorSectionPermission>;
  expiresAt: string;
  createdAt: string;
};

type ApiMember = {
  id: string;
  permissions: Record<string, CollaboratorSectionPermission>;
  createdAt: string;
  member: { id: string; name: string | null; email: string | null };
};

function emptyDraft(): SectionDraft {
  const d: SectionDraft = {};
  for (const s of COLLABORATOR_SECTIONS) {
    d[s.id] = { enabled: false, level: "read" };
  }
  return d;
}

function draftToPermissions(draft: SectionDraft): Record<string, CollaboratorSectionPermission> {
  const out: Record<string, CollaboratorSectionPermission> = {};
  for (const [id, v] of Object.entries(draft)) {
    if (v.enabled) out[id] = v.level;
  }
  return out;
}

function permissionsFromApi(perms: unknown): Record<string, CollaboratorSectionPermission> {
  if (!perms || typeof perms !== "object") return {};
  const o = perms as Record<string, unknown>;
  const out: Record<string, CollaboratorSectionPermission> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === "read" || v === "rw") out[k] = v;
  }
  return out;
}

function summarizePermissions(perms: Record<string, CollaboratorSectionPermission>): string {
  const ids = Object.keys(perms);
  if (ids.length === 0) return "Sin permisos";
  const rw = ids.filter((id) => perms[id] === "rw").length;
  const rd = ids.length - rw;
  return `${ids.length} sección(es): ${rw > 0 ? `${rw} con escritura` : ""}${rw > 0 && rd > 0 ? ", " : ""}${rd > 0 ? `${rd} solo lectura` : ""}`;
}

export default function ProfileCollaboratorsView({ onBack }: ProfileCollaboratorsViewProps) {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<ApiInvite[]>([]);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(() => emptyDraft());
  const [inviteSending, setInviteSending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const groupedSections = useMemo(() => {
    const g = new Map<string, CollaboratorSectionDef[]>();
    for (const s of COLLABORATOR_SECTIONS) {
      const arr = g.get(s.group) ?? [];
      arr.push(s);
      g.set(s.group, arr);
    }
    return Array.from(g.entries());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/collaborators", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo cargar colaboradores");
        return;
      }
      setInvites(
        (data.invites as ApiInvite[]).map((i) => ({
          ...i,
          permissions: permissionsFromApi(i.permissions),
        }))
      );
      setMembers(
        (data.members as ApiMember[]).map((m) => ({
          ...m,
          permissions: permissionsFromApi(m.permissions),
        }))
      );
    } catch {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openInviteModal = () => {
    setInviteEmail("");
    setSectionDraft(emptyDraft());
    setShowInviteModal(true);
  };

  const toggleSection = (id: string, enabled: boolean) => {
    setSectionDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled },
    }));
  };

  const setSectionLevel = (id: string, level: CollaboratorSectionPermission) => {
    setSectionDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], level },
    }));
  };

  const enableAll = (level: CollaboratorSectionPermission) => {
    setSectionDraft(() => {
      const d = emptyDraft();
      for (const s of COLLABORATOR_SECTIONS) {
        d[s.id] = { enabled: true, level };
      }
      return d;
    });
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Ingresá el email del colaborador");
      return;
    }
    const permissions = draftToPermissions(sectionDraft);
    if (Object.keys(permissions).length === 0) {
      toast.error("Seleccioná al menos una sección");
      return;
    }
    setInviteSending(true);
    try {
      const res = await fetch("/api/seller/collaborators/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permissions }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo crear la invitación");
        return;
      }
      toast.success(data.message || "Invitación enviada");
      setShowInviteModal(false);
      await load();
    } catch {
      toast.error("Error de red");
    } finally {
      setInviteSending(false);
    }
  };

  const revokeInvite = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/seller/collaborators/invite/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo revocar");
        return;
      }
      toast.success("Invitación cancelada");
      await load();
    } catch {
      toast.error("Error de red");
    } finally {
      setRevokingId(null);
    }
  };

  const rows = [...members.map((m) => ({ kind: "member" as const, ...m })), ...invites.map((i) => ({ kind: "invite" as const, ...i }))];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground mb-2 font-medium"
          >
            ← Volver al perfil
          </button>
          <h1 className="text-[22px] font-bold text-foreground">Gestioná a tus colaboradores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invitá por email y definí por sección si puede ver solo o también modificar (Mercado Libre, Ads, marketing,
            ventas, etc.).
          </p>
        </div>
        <button
          type="button"
          className="text-primary text-sm font-medium hover:underline shrink-0"
        >
          Necesito ayuda
        </button>
      </div>

      <div className="flex items-center gap-3 justify-end flex-wrap">
        <button
          type="button"
          disabled
          title="Próximamente: roles reutilizables"
          className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
        >
          Crear rol
        </button>
        <button
          type="button"
          onClick={openInviteModal}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <UserPlus size={16} />
          Invitar colaborador
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-32 h-32 mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-20 border-2 border-border rounded-lg flex items-center justify-center bg-muted/50">
                <Monitor size={36} className="text-muted-foreground" />
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-card">
                <UserPlus size={14} className="text-muted-foreground" />
              </div>
            </div>
          </div>
          <h3 className="text-[16px] font-bold text-foreground mb-2">Aún no tenés colaboradores registrados</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Desde acá podrás administrar las invitaciones, accesos y permisos por sección de las personas que trabajan
            en tu negocio.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {rows.map((row, index) => (
            <div
              key={row.kind === "member" ? `m-${row.id}` : `i-${row.id}`}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${
                index < rows.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                  <span className="text-foreground font-bold text-sm">
                    {(row.kind === "member" ? row.member.name || row.member.email : row.email)?.charAt(0).toUpperCase() ??
                      "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] text-foreground font-medium truncate">
                    {row.kind === "member" ? row.member.name || row.member.email : row.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.kind === "member" ? row.member.email : row.email} ·{" "}
                    {summarizePermissions(row.permissions)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    row.kind === "member"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {row.kind === "member" ? "Activo" : "Invitación pendiente"}
                </span>
                {row.kind === "invite" && (
                  <button
                    type="button"
                    disabled={revokingId === row.id}
                    onClick={() => revokeInvite(row.id)}
                    className="text-xs font-medium text-destructive hover:underline px-2 disabled:opacity-50"
                  >
                    {revokingId === row.id ? "…" : "Cancelar"}
                  </button>
                )}
                <ChevronRight size={18} className="text-muted-foreground hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        La invitación queda registrada con los permisos elegidos. El control de acceso al iniciar sesión como colaborador
        se aplicará en una siguiente etapa (aceptación de invitación en cuenta).
      </p>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col border border-border">
            <div className="p-5 border-b border-border shrink-0">
              <h3 className="text-lg font-bold text-foreground">Invitar colaborador</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Marcá las secciones a las que tendrá acceso y elegí solo lectura o lectura y escritura en cada una.
              </p>
            </div>

            <div className="px-5 pt-3 pb-2 flex flex-wrap gap-2 shrink-0 border-b border-border">
              <button
                type="button"
                onClick={() => enableAll("read")}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted font-medium text-foreground"
              >
                Habilitar todas · solo lectura
              </button>
              <button
                type="button"
                onClick={() => enableAll("rw")}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted font-medium text-foreground"
              >
                Habilitar todas · lectura y escritura
              </button>
              <button
                type="button"
                onClick={() => setSectionDraft(emptyDraft())}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted font-medium text-foreground"
              >
                Limpiar selección
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">E-mail del colaborador</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@email.com"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                />
              </div>

              {groupedSections.map(([group, secs]) => (
                <div key={group}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group}</h4>
                  <div className="space-y-2 rounded-lg border border-border divide-y divide-border overflow-hidden">
                    {secs.map((s) => {
                      const st = sectionDraft[s.id] ?? { enabled: false, level: "read" as const };
                      return (
                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 bg-muted/20">
                          <label className="flex items-center gap-2 min-w-[180px] flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.enabled}
                              onChange={(e) => toggleSection(s.id, e.target.checked)}
                              className="rounded border-border"
                            />
                            <span className="text-sm text-foreground font-medium">{s.label}</span>
                          </label>
                          <div className="flex items-center gap-4 sm:ml-auto opacity-100">
                            <label className={`flex items-center gap-1.5 text-xs ${!st.enabled ? "opacity-40" : ""}`}>
                              <input
                                type="radio"
                                name={`perm-${s.id}`}
                                checked={st.enabled && st.level === "read"}
                                disabled={!st.enabled}
                                onChange={() => setSectionLevel(s.id, "read")}
                              />
                              Solo lectura
                            </label>
                            <label className={`flex items-center gap-1.5 text-xs ${!st.enabled ? "opacity-40" : ""}`}>
                              <input
                                type="radio"
                                name={`perm-${s.id}`}
                                checked={st.enabled && st.level === "rw"}
                                disabled={!st.enabled}
                                onChange={() => setSectionLevel(s.id, "rw")}
                              />
                              Lectura y escritura
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-border flex gap-3 shrink-0 bg-muted/30">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2 px-4 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={inviteSending}
                onClick={() => void handleInvite()}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {inviteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
