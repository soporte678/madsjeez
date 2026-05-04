"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Smartphone, Mail, MessageSquare, Bell, ShoppingBag, Tag, Truck, Shield, Megaphone, Check } from 'lucide-react';

interface ProfileCommunicationsViewProps {
  onBack: () => void;
}

type ChannelType = 'notifications' | 'email' | 'sms';

interface ChannelConfig {
  id: ChannelType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CommunicationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function ProfileCommunicationsView({ onBack }: ProfileCommunicationsViewProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelType | null>(null);

  const channels: ChannelConfig[] = [
    {
      id: 'notifications',
      title: 'Notificaciones',
      description: 'Configurá cómo querés recibir novedades en tus dispositivos móviles.',
      icon: <Smartphone size={22} className="text-blue-600" />,
    },
    {
      id: 'email',
      title: 'E-mail',
      description: 'Configurá las comunicaciones que querés recibir por e-mail.',
      icon: <Mail size={22} className="text-blue-600" />,
    },
    {
      id: 'sms',
      title: 'SMS y WhatsApp',
      description: 'Configurá las comunicaciones que querés recibir por SMS y WhatsApp.',
      icon: <MessageSquare size={22} className="text-blue-600" />,
    },
  ];

  const preferences: CommunicationPreference[] = [
    {
      id: 'purchases',
      label: 'Compras',
      description: 'Actualizaciones sobre tus pedidos y envíos',
      icon: <ShoppingBag size={18} className="text-gray-500" />,
      enabled: true,
    },
    {
      id: 'promotions',
      label: 'Promociones',
      description: 'Ofertas, descuentos y novedades',
      icon: <Tag size={18} className="text-gray-500" />,
      enabled: true,
    },
    {
      id: 'shipping',
      label: 'Envíos',
      description: 'Estados de envío y tracking',
      icon: <Truck size={18} className="text-gray-500" />,
      enabled: true,
    },
    {
      id: 'security',
      label: 'Seguridad',
      description: 'Alertas de inicio de sesión y cambios en tu cuenta',
      icon: <Shield size={18} className="text-gray-500" />,
      enabled: true,
    },
    {
      id: 'news',
      label: 'Novedades',
      description: 'Nuevas funciones y actualizaciones de la plataforma',
      icon: <Megaphone size={18} className="text-gray-500" />,
      enabled: false,
    },
  ];

  // Lista de canales principal
  if (!activeChannel) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onBack} className="text-blue-600 font-medium hover:underline">
            Mi perfil
          </button>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-500">Comunicaciones</span>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold text-gray-800">
          Elegí el canal a configurar
        </h1>

        {/* Channels list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              className={`flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
                index < channels.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onClick={() => setActiveChannel(channel.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  {channel.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-gray-800 font-medium">{channel.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{channel.description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sub-vista de preferencias por canal
  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveChannel(null)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">
            {currentChannel?.title}
          </h1>
          <p className="text-sm text-gray-500">
            Elegí qué tipo de comunicaciones querés recibir por este canal.
          </p>
        </div>
      </div>

      {/* Preferences list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {preferences.map((pref, index) => (
          <div
            key={pref.id}
            className={`flex items-center justify-between p-5 ${
              index < preferences.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                {pref.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-gray-800 font-medium">{pref.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{pref.description}</p>
              </div>
            </div>
            <button
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                pref.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => {
                // Toggle would go here
              }}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  pref.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
