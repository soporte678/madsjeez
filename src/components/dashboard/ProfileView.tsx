"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Users, CreditCard, 
  MapPin, Lock, MessageSquare, Star, 
  AlertCircle, ChevronRight, X, Key,
  Wallet, Link2, Unlink, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileViewProps {
  userData?: {
    name?: string;
    email?: string;
    avatar?: string | null;
    image?: string | null;
  } | null;
}

export default function ProfileView({ userData }: ProfileViewProps) {
  const user = userData || {
    name: "MadsJeez II Repuestos Para Maquinas",
    email: "amanecer.dannu556@gmail.com",
    avatar: null
  };

  // Use image if avatar is not provided (from Google auth session)
  const profileImage = user.avatar || user.image || null;

  // Estado para MercadoPago
  const [mpStatus, setMpStatus] = useState<{
    connected: boolean;
    active: boolean;
    email: string | null;
    nickname: string | null;
    loading: boolean;
  }>({
    connected: false,
    active: false,
    email: null,
    nickname: null,
    loading: true,
  });

  // Cargar estado de MercadoPago
  useEffect(() => {
    const loadMpStatus = async () => {
      try {
        const response = await fetch('/api/seller/payment-gateway/mercadopago/status');
        if (response.ok) {
          const data = await response.json();
          setMpStatus({
            connected: data.connected,
            active: data.active,
            email: data.email,
            nickname: data.nickname,
            loading: false,
          });
        } else {
          setMpStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error cargando estado de MercadoPago:', error);
        setMpStatus(prev => ({ ...prev, loading: false }));
      }
    };

    loadMpStatus();
  }, []);

  // Manejar callback de OAuth (mp_success o mp_error en URL)
  useEffect(() => {
    const url = new URL(window.location.href);
    const mpSuccess = url.searchParams.get('mp_success');
    const mpError = url.searchParams.get('mp_error');

    if (mpSuccess === 'connected') {
      toast.success('Cuenta de MercadoPago conectada correctamente');
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
      // Recargar estado
      loadMpStatus();
    } else if (mpError) {
      let errorMsg = 'Error al conectar con MercadoPago';
      switch (mpError) {
        case 'access_denied':
          errorMsg = 'Acceso denegado. No autorizaste la conexión.';
          break;
        case 'token_error':
          errorMsg = 'Error al obtener credenciales. Intentá de nuevo.';
          break;
        case 'db_error':
          errorMsg = 'Error guardando la configuración.';
          break;
        case 'config_error':
          errorMsg = 'Error de configuración del servidor.';
          break;
      }
      toast.error(errorMsg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Función para recargar estado (usada después del callback)
  const loadMpStatus = async () => {
    try {
      const response = await fetch('/api/seller/payment-gateway/mercadopago/status');
      if (response.ok) {
        const data = await response.json();
        setMpStatus({
          connected: data.connected,
          active: data.active,
          email: data.email,
          nickname: data.nickname,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error recargando estado:', error);
    }
  };

  // Iniciar OAuth de MercadoPago
  const handleConnectMercadoPago = async () => {
    try {
      setMpStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/seller/payment-gateway/mercadopago/auth');
      
      if (response.ok) {
        const data = await response.json();
        // Redirigir a MercadoPago
        window.location.href = data.authUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error iniciando conexión con MercadoPago');
        setMpStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error conectando MercadoPago:', error);
      toast.error('Error al iniciar la conexión');
      setMpStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Desconectar MercadoPago
  const handleDisconnectMercadoPago = async () => {
    try {
      setMpStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/seller/payment-gateway/mercadopago/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Cuenta de MercadoPago desconectada');
        setMpStatus({
          connected: false,
          active: false,
          email: null,
          nickname: null,
          loading: false,
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al desconectar');
        setMpStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      toast.error('Error al desconectar la cuenta');
      setMpStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const profileCards = [
    {
      id: 'info',
      title: "Información de tu perfil",
      description: "Datos personales, de la cuenta y fiscales.",
      icon: <User className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'security',
      title: "Seguridad",
      description: "Tenés configuraciones pendientes.",
      icon: <ShieldCheck className="text-gray-400" size={24} />,
      status: 'warning'
    },
    {
      id: 'colaboradores',
      title: "Colaboradores",
      description: "Personas que operan con tu cuenta.",
      icon: <Users className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'mads-plus',
      title: "Mads+",
      description: "Suscripción con beneficios en envíos, compras y entretenimiento.",
      icon: <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-black italic">M</div>,
      status: null
    },
    {
      id: 'tarjetas',
      title: "Tarjetas",
      description: "Tarjetas guardadas en tu cuenta.",
      icon: <CreditCard className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'direcciones',
      title: "Direcciones",
      description: "Direcciones guardadas en tu cuenta.",
      icon: <MapPin className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'privacidad',
      title: "Privacidad",
      description: "Preferencias y control sobre el uso de tus datos.",
      icon: <Lock className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'comunicaciones',
      title: "Comunicaciones",
      description: "Elegí qué tipo de información querés recibir.",
      icon: <MessageSquare className="text-gray-400" size={24} />,
      status: null
    },
    {
      id: 'cobros',
      title: "Cobros",
      description: mpStatus.loading 
        ? "Cargando..." 
        : mpStatus.connected 
          ? `Conectado: ${mpStatus.email || mpStatus.nickname || 'Cuenta de MercadoPago'}`
          : "Conectá tu cuenta de MercadoPago para recibir pagos.",
      icon: mpStatus.connected 
        ? <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">MP</div>
        : <Wallet className="text-gray-400" size={24} />,
      status: mpStatus.connected ? null : 'warning',
      isMercadoPago: true
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20">
      
      {/* --- SECCIÓN CABECERA --- */}
      <div className="flex flex-col items-center py-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-blue-600 group-hover:scale-110 transition-transform">
             <ChevronRight size={14} className="-rotate-90" />
          </div>
        </div>
        
        <h1 className="mt-4 text-[22px] font-bold text-gray-800 tracking-tight">
          {user.name}
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {user.email}
        </p>
        <span className="mt-2 bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          Negocio
        </span>
      </div>

      {/* --- BANNER DE ALERTA: LLAVE DE ACCESO --- */}
      <div className="bg-white border-l-4 border-l-orange-400 rounded-lg shadow-sm p-4 flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
            <Key size={20} />
          </div>
          <span className="text-[15px] text-gray-700 font-medium">
            Creá tu llave de acceso para mantener tu cuenta segura
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors">
            Crear
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* --- GRID DE OPCIONES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {profileCards.map((card: any) => (
          <div 
            key={card.id}
            className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative ${
              card.isMercadoPago ? '' : 'cursor-pointer group'
            }`}
            onClick={card.isMercadoPago ? undefined : undefined}
          >
            {card.status === 'warning' && (
              <div className="absolute top-4 right-4">
                <AlertCircle className="text-orange-500" size={18} />
              </div>
            )}

            {card.status === 'connected' && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="text-green-500" size={18} />
              </div>
            )}

            <div className="mb-4">
              {card.icon}
            </div>
            
            <h3 className={`text-[16px] font-bold text-gray-800 mb-2 transition-colors ${
              card.isMercadoPago ? '' : 'group-hover:text-blue-600'
            }`}>
              {card.title}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed font-medium mb-3">
              {card.description}
            </p>

            {/* Botón especial para MercadoPago */}
            {card.isMercadoPago && (
              <div className="mt-auto pt-2">
                {mpStatus.loading ? (
                  <button 
                    disabled
                    className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Cargando...
                  </button>
                ) : mpStatus.connected ? (
                  <button
                    onClick={handleDisconnectMercadoPago}
                    className="w-full py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlink size={16} />
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={handleConnectMercadoPago}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Link2 size={16} />
                    Conectar MercadoPago
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-8 text-center">
        <button className="text-[13px] text-blue-500 font-medium hover:underline">
          Podés <span className="font-bold">cancelar tu cuenta</span> siempre que lo desees.
        </button>
      </div>

    </div>
  );
}
