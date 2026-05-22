"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, MessageSquare, Megaphone, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  topic: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  resourceId?: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function getNotificationImage(type: string, topic: string): string {
  const map: Record<string, string> = {
    order: 'https://via.placeholder.com/80?text=Venta',
    question: 'https://via.placeholder.com/80?text=Pregunta',
    claim: 'https://via.placeholder.com/80?text=Reclamo',
    message: 'https://via.placeholder.com/80?text=Mensaje',
    promotion: 'https://via.placeholder.com/80?text=Promo',
    whatsapp: 'https://via.placeholder.com/80?text=WA',
  };
  return map[type] || 'https://via.placeholder.com/80?text=Notif';
}

function getNotificationTitle(type: string, topic: string): string {
  const map: Record<string, string> = {
    order: topic === 'sold' ? '¡Vendiste!' : 'Nueva compra',
    question: 'Te preguntaron',
    claim: 'Nuevo reclamo',
    message: 'Nuevo mensaje',
    promotion: 'Promoción',
    whatsapp: 'WhatsApp',
  };
  return map[type] || 'Notificación';
}

function openNotificationLink(item: NotificationItem) {
  if (item.type === 'whatsapp') {
    window.location.href = '/dashboard#whatsapp-bot';
    return true;
  }
  return false;
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'generales' | 'tiendas'>('generales');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Fetch notifications when opening
      fetchNotifications();
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      // Optimistic update
      setData(prev => prev ? {
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      } : null);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setData(prev => prev ? {
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      } : null);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  if (!isOpen) return null;

  const notifications = data?.notifications || [];
  const filtered = activeTab === 'generales'
    ? notifications.filter(n => n.type !== 'promotion')
    : notifications.filter(n => n.type === 'promotion');

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[120%] right-[-10px] sm:right-[-60px] md:right-[-20px] w-[380px] bg-white rounded-md shadow-[0_4px_15px_rgba(0,0,0,0.15)] border border-[#e6e6e6] z-[100] cursor-default flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Flecha indicadora */}
      <div className="absolute -top-2 right-[26px] sm:right-[76px] md:right-[36px] w-4 h-4 bg-white border-t border-l border-[#e6e6e6] transform rotate-45 z-[101]"></div>

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#e6e6e6]">
        <h3 className="text-[16px] font-semibold text-[#333]">Notificaciones</h3>
        <div className="flex items-center gap-2">
          {data && data.unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[12px] text-[#3483fa] hover:text-blue-700 font-semibold flex items-center gap-1"
              title="Marcar todas como leídas"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar leídas
            </button>
          )}
          <Settings className="w-5 h-5 text-[#999] hover:text-[#666] cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e6e6e6]">
        <button
          onClick={() => setActiveTab('generales')}
          className={`flex-1 py-3.5 text-[14px] font-semibold border-b-[3px] flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'generales'
              ? 'text-[#3483fa] border-[#3483fa]'
              : 'text-[#666] hover:text-[#333] border-transparent'
          }`}
        >
          Generales <MessageSquare className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => setActiveTab('tiendas')}
          className={`flex-1 py-3.5 text-[14px] font-semibold border-b-[3px] flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'tiendas'
              ? 'text-[#3483fa] border-[#3483fa]'
              : 'text-[#666] hover:text-[#333] border-transparent'
          }`}
        >
          Tiendas que sigo <Megaphone className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3483fa]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-10 h-10 text-[#ccc] mb-3" />
            <p className="text-[14px] text-[#666] font-medium">
              {activeTab === 'generales' ? 'No tenés notificaciones' : 'No seguís ninguna tienda'}
            </p>
            <p className="text-[12px] text-[#999] mt-1">
              {activeTab === 'generales' ? 'Las notificaciones aparecerán acá' : 'Seguí tiendas para ver sus novedades'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                openNotificationLink(item);
                if (!item.isRead) markAsRead(item.id);
              }}
              className={`flex gap-4 p-4 border-b border-[#f5f5f5] hover:bg-[#f5f5f5] transition-colors cursor-pointer group ${
                !item.isRead ? 'bg-[#f0f7ff]' : ''
              }`}
            >
              <div className="w-[48px] h-[48px] flex-shrink-0 border border-[#e6e6e6] rounded flex items-center justify-center p-1 bg-white">
                <img
                  src={getNotificationImage(item.type, item.topic)}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`text-[14px] font-semibold text-[#333] ${!item.isRead ? 'text-[#3483fa]' : ''}`}>
                    {getNotificationTitle(item.type, item.topic)}
                  </h4>
                  <span className="text-[12px] text-[#999] mt-0.5 flex-shrink-0 ml-2">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] text-[#666] line-clamp-2 leading-snug mt-1 group-hover:text-[#333] transition-colors">
                  {item.message}
                </p>
                {!item.isRead && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3483fa]"></span>
                    <span className="text-[11px] text-[#3483fa] font-semibold">Nueva</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
