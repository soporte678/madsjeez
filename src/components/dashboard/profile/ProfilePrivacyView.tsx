"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, SlidersHorizontal, FileBarChart, Cookie, UserX, AlertTriangle } from 'lucide-react';

interface ProfilePrivacyViewProps {
  onBack: () => void;
}

interface PrivacyOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  danger?: boolean;
}

export default function ProfilePrivacyView({ onBack }: ProfilePrivacyViewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const options: PrivacyOption[] = [
    {
      id: 'permissions',
      title: 'Administrar permisos',
      description: 'Controlá los permisos de privacidad para ofrecerte contenido personalizado.',
      icon: <SlidersHorizontal size={20} className="text-blue-600" />,
    },
    {
      id: 'data-report',
      title: 'Conocer reporte de datos',
      description: 'Solicitá los datos de tu cuenta y consultá los reportes listos.',
      icon: <FileBarChart size={20} className="text-blue-600" />,
    },
    {
      id: 'cookies',
      title: 'Configurar cookies',
      description: 'Consultá los tipos de cookies que usamos y configurá tus preferencias.',
      icon: <Cookie size={20} className="text-blue-600" />,
    },
    {
      id: 'delete',
      title: 'Cancelar cuenta',
      description: 'Iniciá una solicitud para cancelar tu cuenta y eliminar tus datos personales.',
      icon: <UserX size={20} className="text-red-500" />,
      danger: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 font-medium hover:underline">
          Mi perfil
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">Privacidad</span>
      </div>

      {/* Title */}
      <h1 className="text-[22px] font-bold text-gray-800">
        Gestioná la privacidad de tu cuenta
      </h1>

      {/* Options list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {options.map((option, index) => (
          <div
            key={option.id}
            className={`flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
              index < options.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onClick={() => option.id === 'delete' ? setShowDeleteModal(true) : undefined}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                option.danger ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-gray-800 font-medium">{option.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400 shrink-0 ml-2" />
          </div>
        ))}
      </div>

      {/* Footer link */}
      <button className="text-blue-600 text-sm font-medium hover:underline text-left">
        Conocé más sobre cómo cuidamos tu privacidad.
      </button>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Cancelar cuenta</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción eliminará permanentemente tu cuenta y todos tus datos personales. 
              Esta acción no se puede deshacer.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Si tenés ventas activas o pagos pendientes, 
                deberás resolverlos antes de cancelar tu cuenta.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  // TODO: API call to delete account
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
