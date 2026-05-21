"use client";

import React, { useEffect, useState } from 'react';
import { ChevronRight, Monitor, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileCollaboratorsViewProps {
  onBack: () => void;
}

interface Collaborator {
  id: string;
  collaboratorEmail: string;
  accessLevel: "FULL" | "READ_ONLY";
  isActive: boolean;
  updatedAt: string;
}

export default function ProfileCollaboratorsView({ onBack }: ProfileCollaboratorsViewProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAccess, setInviteAccess] = useState<"FULL" | "READ_ONLY">("READ_ONLY");

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/collaborators", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar");
      setCollaborators(data.collaborators || []);
    } catch {
      toast.error("No se pudo cargar colaboradores de marketing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadCollaborators();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, accessLevel: inviteAccess }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo invitar");
      toast.success("Acceso de colaborador guardado");
      setInviteEmail('');
      setInviteAccess("READ_ONLY");
      setShowInviteModal(false);
      await loadCollaborators();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error invitando colaborador");
    } finally {
      setSaving(false);
    }
  };

  const updateAccess = async (id: string, accessLevel: "FULL" | "READ_ONLY") => {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/collaborators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accessLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      setCollaborators((prev) =>
        prev.map((c) => (c.id === id ? { ...c, accessLevel } : c))
      );
      toast.success("Permiso actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error actualizando permiso");
    } finally {
      setSaving(false);
    }
  };

  const removeAccess = async (id: string) => {
    if (!confirm("¿Quitar acceso a este colaborador?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/collaborators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo quitar acceso");
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
      toast.success("Acceso removido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error removiendo acceso");
    } finally {
      setSaving(false);
    }
  };

  const accessLabel = (level: "FULL" | "READ_ONLY") => {
    if (level === "FULL") return "Control total";
    return "Solo lectura";
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ChevronRight size={14} className="rotate-180" />
            Volver
          </button>
          <h1 className="text-[22px] font-bold text-gray-800">
            Colaboradores de Marketing MELI
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Definí quién puede operar Mercado Libre Ads con control total o solo lectura.
          </p>
        </div>
        <button className="text-blue-600 text-sm font-medium hover:underline">
          Necesito ayuda
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={16} />
          Invitar colaborador
        </button>
      </div>

      {/* Empty state */}
      {!loading && collaborators.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-32 h-32 mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <Monitor size={36} className="text-gray-400" />
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                <UserPlus size={14} className="text-gray-500" />
              </div>
            </div>
          </div>
          <h3 className="text-[16px] font-bold text-gray-800 mb-2">
            Aún no tenés colaboradores registrados
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Desde acá podrás administrar las invitaciones, accesos y tareas de las personas que trabajan en tu negocio.
          </p>
        </div>
      )}

      {/* Collaborators list */}
      {collaborators.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {collaborators.map((collab, index) => (
            <div
              key={collab.id}
              className={`flex items-center justify-between p-4 ${
                index < collaborators.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-sm">
                    {collab.collaboratorEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] text-gray-800 font-medium truncate">{collab.collaboratorEmail}</p>
                  <p className="text-xs text-gray-500">Última actualización: {new Date(collab.updatedAt).toLocaleString("es-AR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={collab.accessLevel}
                  onChange={(e) => updateAccess(collab.id, e.target.value as "FULL" | "READ_ONLY")}
                  disabled={saving}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                >
                  <option value="FULL">Control total</option>
                  <option value="READ_ONLY">Solo lectura</option>
                </select>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${collab.accessLevel === "FULL" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
                  {accessLabel(collab.accessLevel)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAccess(collab.id)}
                  disabled={saving}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  title="Quitar acceso"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Invitar colaborador</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail del colaborador
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de acceso Marketing MELI
                </label>
                <select
                  value={inviteAccess}
                  onChange={(e) => setInviteAccess(e.target.value as "FULL" | "READ_ONLY")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="FULL">Control total (puede modificar campañas)</option>
                  <option value="READ_ONLY">Solo lectura (solo ver, sin cambios)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {saving ? "Guardando..." : "Guardar acceso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
