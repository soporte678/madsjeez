"use client";

import React from 'react';
import { ChevronRight, Shield, Fingerprint, Laptop, BellRing, MapPin, Users, Link2, AlertCircle } from 'lucide-react';

interface ProfileSecurityViewProps {
  onBack: () => void;
  hasAccessKey?: boolean;
}

interface SecurityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  alertCount?: number;
  onClick?: () => void;
}

export default function ProfileSecurityView({ onBack, hasAccessKey = false }: ProfileSecurityViewProps) {
  const securityItems: SecurityItem[] = [
    {
      id: 'verification',
      title: 'Métodos de verificación',
      description: 'Activá los métodos de verificación necesarios para proteger tu cuenta.',
      icon: <Fingerprint size={22} className="text-blue-600" />,
      alertCount: hasAccessKey ? 0 : 1,
    },
    {
      id: 'devices',
      title: 'Dispositivos vinculados',
      description: 'Gestioná los dispositivos donde iniciaste sesión.',
      icon: <Laptop size={22} className="text-gray-500" />,
    },
    {
      id: 'alerts',
      title: 'Alertas de seguridad',
      description: 'Revisá tus alertas y los canales donde las recibís.',
      icon: <BellRing size={22} className="text-gray-500" />,
    },
    {
      id: 'location',
      title: 'Permiso de ubicación',
      description: 'Mantené activa tu ubicación para prevenir riesgos.',
      icon: <MapPin size={22} className="text-gray-500" />,
    },
    {
      id: 'trusted',
      title: 'Personas de confianza',
      description: 'Agregá personas para que reporten tus problemas de seguridad.',
      icon: <Users size={22} className="text-gray-500" />,
    },
    {
      id: 'apps',
      title: 'Aplicaciones conectadas',
      description: 'Controlá las aplicaciones externas que estén conectadas a tu cuenta.',
      icon: <Link2 size={22} className="text-gray-500" />,
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
        <span className="text-gray-500">Seguridad</span>
      </div>

      {/* Banner superior */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <span className="text-[15px] text-gray-800 font-medium">
            Tengo un problema de seguridad
          </span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Lista de opciones de seguridad */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {securityItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              index < securityItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 relative">
                {item.icon}
                {item.alertCount !== undefined && item.alertCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{item.alertCount}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-gray-800 font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400 shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
