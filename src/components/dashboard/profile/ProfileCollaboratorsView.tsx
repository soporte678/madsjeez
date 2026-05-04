"use client";

import React, { useState } from 'react';
import { ChevronRight, Monitor, UserPlus, Plus } from 'lucide-react';

interface ProfileCollaboratorsViewProps {
  onBack: () => void;
}

interface CollaboratorRole {
  id: string;
  name: string;
  permissions: string[];
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
}

export default function ProfileCollaboratorsView({ onBack }: ProfileCollaboratorsViewProps) {
  const [roles, setRoles] = useState<CollaboratorRole[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    setRoles(prev => [...prev, { id: Date.now().toString(), name: newRoleName, permissions: [] }]);
    setNewRoleName('');
    setShowCreateRoleModal(false);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setCollaborators(prev => [...prev, {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole || 'Sin rol',
      status: 'pending'
    }]);
    setInviteEmail('');
    setInviteRole('');
    setShowInviteModal(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">
            Gestioná a tus colaboradores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Invitá a las personas que trabajan con vos y definí qué tareas pueden realizar con tu cuenta.
          </p>
        </div>
        <button className="text-blue-600 text-sm font-medium hover:underline">
          Necesito ayuda
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={() => setShowCreateRoleModal(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Crear rol
        </button>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={16} />
          Invitar colaborador
        </button>
      </div>

      {/* Empty state */}
      {collaborators.length === 0 && (
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
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-sm">
                    {collab.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[15px] text-gray-800 font-medium">{collab.name}</p>
                  <p className="text-xs text-gray-500">{collab.email} · {collab.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  collab.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {collab.status === 'active' ? 'Activo' : 'Pendiente'}
                </span>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Crear rol</h3>
            <p className="text-sm text-gray-500 mb-4">
              Los roles te permiten definir qué acciones puede realizar cada colaborador.
            </p>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ej: Administrador, Vendedor, Contable"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRole}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Crear
              </button>
            </div>
          </div>
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
                  Rol (opcional)
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin rol específico</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
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
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
