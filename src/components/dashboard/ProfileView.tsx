"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { 
  User, ShieldCheck, Users, CreditCard, 
  MapPin, Lock, MessageSquare, Star, 
  AlertCircle, ChevronRight, X, Key,
  Wallet, Link2, Unlink, CheckCircle,
  Shield, Trash2, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import ProfileInfoView from './profile/ProfileInfoView';
import ProfileSecurityView from './profile/ProfileSecurityView';
import ProfileCollaboratorsView from './profile/ProfileCollaboratorsView';
import ProfileCardsView from './profile/ProfileCardsView';
import ProfileAddressesView from './profile/ProfileAddressesView';
import ProfilePrivacyView from './profile/ProfilePrivacyView';
import ProfileCommunicationsView from './profile/ProfileCommunicationsView';
import MeliIntegrationView from '@/components/dashboard/MeliIntegrationView';

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

  // Estado para Clave de Acceso
  const [accessKeyState, setAccessKeyState] = useState<{
    hasKey: boolean;
    loading: boolean;
    showBanner: boolean;
    modalOpen: boolean;
    modalMode: 'create' | 'delete';
  }>({
    hasKey: false,
    loading: true,
    showBanner: true,
    modalOpen: false,
    modalMode: 'create',
  });

  const [accessKeyForm, setAccessKeyForm] = useState({
    key: '',
    confirm: '',
    deleteConfirm: '',
    showKey: false,
    showConfirm: false,
  });

  const [savingKey, setSavingKey] = useState(false);

  // Mercado Libre (catálogo / campañas)
  const [meliStatus, setMeliStatus] = useState<{
    connected: boolean;
    meliUserId: string | null;
    loading: boolean;
  }>({ connected: false, meliUserId: null, loading: true });

  // Estado para navegación de sub-secciones del perfil
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

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

  const loadMeliStatus = async () => {
    try {
      const r = await fetch('/api/meli/status');
      const d = await r.json();
      if (r.ok) {
        setMeliStatus({
          connected: Boolean(d.connected),
          meliUserId: d.meliUserId ?? null,
          loading: false,
        });
      } else {
        setMeliStatus({ connected: false, meliUserId: null, loading: false });
      }
    } catch {
      setMeliStatus({ connected: false, meliUserId: null, loading: false });
    }
  };

  useEffect(() => {
    loadMeliStatus();
  }, []);

  // Cargar estado de Clave de Acceso
  useEffect(() => {
    const loadAccessKeyStatus = async () => {
      try {
        const response = await fetch('/api/user/access-key');
        if (response.ok) {
          const data = await response.json();
          setAccessKeyState(prev => ({
            ...prev,
            hasKey: data.hasAccessKey,
            showBanner: !data.hasAccessKey,
            loading: false,
          }));
        } else {
          setAccessKeyState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error cargando estado de clave de acceso:', error);
        setAccessKeyState(prev => ({ ...prev, loading: false }));
      }
    };

    loadAccessKeyStatus();
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

  // --- Clave de Acceso handlers ---
  const openAccessKeyModal = (mode: 'create' | 'delete') => {
    setAccessKeyForm({ key: '', confirm: '', deleteConfirm: '', showKey: false, showConfirm: false });
    setAccessKeyState(prev => ({ ...prev, modalOpen: true, modalMode: mode }));
  };

  const closeAccessKeyModal = () => {
    setAccessKeyState(prev => ({ ...prev, modalOpen: false }));
  };

  const handleSaveAccessKey = async () => {
    if (accessKeyForm.key !== accessKeyForm.confirm) {
      toast.error('Las claves no coinciden');
      return;
    }
    if (accessKeyForm.key.length < 4 || accessKeyForm.key.length > 6) {
      toast.error('La clave debe tener entre 4 y 6 caracteres');
      return;
    }

    setSavingKey(true);
    try {
      const response = await fetch('/api/user/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: accessKeyForm.key,
          confirmAccessKey: accessKeyForm.confirm,
        }),
      });

      if (response.ok) {
        toast.success('Clave de acceso guardada correctamente');
        setAccessKeyState(prev => ({
          ...prev,
          hasKey: true,
          showBanner: false,
          modalOpen: false,
        }));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar la clave');
      }
    } catch (error) {
      toast.error('Error al guardar la clave de acceso');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteAccessKey = async () => {
    if (!accessKeyForm.deleteConfirm) {
      toast.error('Ingresá tu clave de acceso actual');
      return;
    }

    setSavingKey(true);
    try {
      const response = await fetch('/api/user/access-key', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: accessKeyForm.deleteConfirm }),
      });

      if (response.ok) {
        toast.success('Clave de acceso eliminada');
        setAccessKeyState(prev => ({
          ...prev,
          hasKey: false,
          showBanner: true,
          modalOpen: false,
        }));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar la clave');
      }
    } catch (error) {
      toast.error('Error al eliminar la clave de acceso');
    } finally {
      setSavingKey(false);
    }
  };

  const profileCards = [
    {
      id: 'info',
      title: "Información de tu perfil",
      description: "Datos personales, de la cuenta y fiscales.",
      icon: <User className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('info'),
    },
    {
      id: 'security',
      title: "Seguridad",
      description: "Tenés configuraciones pendientes.",
      icon: <ShieldCheck className="text-gray-400" size={24} />,
      status: 'warning',
      onClick: () => setActiveSubSection('security'),
    },
    {
      id: 'colaboradores',
      title: "Colaboradores",
      description: "Personas que operan con tu cuenta.",
      icon: <Users className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('colaboradores'),
    },
    {
      id: 'mads-plus',
      title: "Mads+",
      description: "Suscripción con beneficios en envíos, compras y entretenimiento.",
      icon: <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black italic">M</div>,
      status: null
    },
    {
      id: 'tarjetas',
      title: "Tarjetas",
      description: "Tarjetas guardadas en tu cuenta.",
      icon: <CreditCard className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('tarjetas'),
    },
    {
      id: 'direcciones',
      title: "Direcciones",
      description: "Direcciones guardadas en tu cuenta.",
      icon: <MapPin className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('direcciones'),
    },
    {
      id: 'privacidad',
      title: "Privacidad",
      description: "Preferencias y control sobre el uso de tus datos.",
      icon: <Lock className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('privacidad'),
    },
    {
      id: 'comunicaciones',
      title: "Comunicaciones",
      description: "Elegí qué tipo de información querés recibir.",
      icon: <MessageSquare className="text-gray-400" size={24} />,
      status: null,
      onClick: () => setActiveSubSection('comunicaciones'),
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
        ? <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black">MP</div>
        : <Wallet className="text-gray-400" size={24} />,
      status: mpStatus.connected ? null : 'warning',
      isMercadoPago: true
    },
    {
      id: 'meli-marketplace',
      title: "Mercado Libre",
      description: meliStatus.loading
        ? "Cargando..."
        : meliStatus.connected
          ? `Conectado · usuario ML ${meliStatus.meliUserId ?? "—"}`
          : "Importá tus publicaciones de Mercado Libre y sincronizá campañas con MADSJEEZ.",
      icon: (
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-black">
          ML
        </div>
      ),
      status: meliStatus.connected ? null : 'warning',
      isMercadoLibre: true,
    },
  ];

  // Renderizar sub-sección si está activa
  if (activeSubSection === 'info') {
    return (
      <ProfileInfoView 
        userData={userData} 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'security') {
    return (
      <ProfileSecurityView 
        hasAccessKey={accessKeyState.hasKey}
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'colaboradores') {
    return (
      <ProfileCollaboratorsView 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'tarjetas') {
    return (
      <ProfileCardsView 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'direcciones') {
    return (
      <ProfileAddressesView 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'privacidad') {
    return (
      <ProfilePrivacyView 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'comunicaciones') {
    return (
      <ProfileCommunicationsView 
        onBack={() => setActiveSubSection(null)} 
      />
    );
  }

  if (activeSubSection === 'meli-marketplace') {
    return (
      <div className="w-full max-w-5xl mx-auto pb-20">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveSubSection(null);
              loadMeliStatus();
            }}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <ChevronRight size={18} className="rotate-180" />
            Volver al perfil
          </button>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-gray-500 text-sm">Cargando Mercado Libre…</div>
          }
        >
          <MeliIntegrationView />
        </Suspense>
      </div>
    );
  }

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
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-primary group-hover:scale-110 transition-transform">
             <ChevronRight size={14} className="-rotate-90" />
          </div>
        </div>
        
        <h1 className="mt-4 text-[22px] font-bold text-gray-800 tracking-tight">
          {user.name}
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          {user.email}
        </p>
        <span className="mt-2 bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
          Negocio
        </span>
      </div>

      {/* --- BANNER DE ALERTA: LLAVE DE ACCESO --- */}
      {!accessKeyState.loading && accessKeyState.showBanner && (
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
            <button
              onClick={() => openAccessKeyModal('create')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
            >
              Crear
            </button>
            <button
              onClick={() => setAccessKeyState(prev => ({ ...prev, showBanner: false }))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* --- ACCESO RÁPIDO: CLAVE DE ACCESO (si ya tiene) --- */}
      {accessKeyState.hasKey && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[15px] text-gray-700 font-medium">Clave de acceso activa</p>
              <p className="text-xs text-gray-500">Tu cuenta tiene una capa extra de seguridad</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAccessKeyModal('create')}
              className="text-primary text-sm font-medium hover:underline px-3 py-1"
            >
              Cambiar
            </button>
            <button
              onClick={() => openAccessKeyModal('delete')}
              className="text-red-500 text-sm font-medium hover:underline px-3 py-1"
            >
              <Trash2 size={16} className="inline mr-1" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* --- GRID DE OPCIONES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {profileCards.map((card: any) => (
          <div 
            key={card.id}
            className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative ${
              card.isMercadoPago || card.isMercadoLibre ? '' : 'cursor-pointer group'
            }`}
            onClick={
              card.isMercadoPago || card.isMercadoLibre ? undefined : card.onClick || undefined
            }
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
              card.isMercadoPago || card.isMercadoLibre ? '' : 'group-hover:text-primary'
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
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Link2 size={16} />
                    Conectar MercadoPago
                  </button>
                )}
              </div>
            )}

            {card.isMercadoLibre && (
              <div className="mt-auto pt-2 space-y-2">
                {meliStatus.loading ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Cargando...
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveSubSection('meli-marketplace')}
                      className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Link2 size={16} />
                      {meliStatus.connected ? 'Sincronizar catálogo y campañas' : 'Conectar con Mercado Libre'}
                    </button>
                    {!meliStatus.connected && (
                      <p className="text-[11px] text-gray-500 text-center leading-snug">
                        También podés hacerlo desde Ventas → Mercado Libre.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- MODAL: CLAVE DE ACCESO --- */}
      {accessKeyState.modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {accessKeyState.modalMode === 'create'
                  ? accessKeyState.hasKey
                    ? 'Cambiar clave de acceso'
                    : 'Crear clave de acceso'
                  : 'Eliminar clave de acceso'}
              </h3>
              <button onClick={closeAccessKeyModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {accessKeyState.modalMode === 'create' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Esta clave te pediremos para confirmar acciones sensibles en tu cuenta.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva clave (4-6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={accessKeyForm.showKey ? 'text' : 'password'}
                      value={accessKeyForm.key}
                      onChange={(e) => setAccessKeyForm(prev => ({ ...prev, key: e.target.value }))}
                      maxLength={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: 1234"
                    />
                    <button
                      type="button"
                      onClick={() => setAccessKeyForm(prev => ({ ...prev, showKey: !prev.showKey }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {accessKeyForm.showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar clave
                  </label>
                  <div className="relative">
                    <input
                      type={accessKeyForm.showConfirm ? 'text' : 'password'}
                      value={accessKeyForm.confirm}
                      onChange={(e) => setAccessKeyForm(prev => ({ ...prev, confirm: e.target.value }))}
                      maxLength={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Repetí la clave"
                    />
                    <button
                      type="button"
                      onClick={() => setAccessKeyForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {accessKeyForm.showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeAccessKeyModal}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAccessKey}
                    disabled={savingKey}
                    className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 shadow-sm"
                  >
                    {savingKey ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Para eliminar tu clave de acceso, ingresala a continuación.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clave de acceso actual
                  </label>
                  <input
                    type="password"
                    value={accessKeyForm.deleteConfirm}
                    onChange={(e) => setAccessKeyForm(prev => ({ ...prev, deleteConfirm: e.target.value }))}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tu clave actual"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeAccessKeyModal}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccessKey}
                    disabled={savingKey}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {savingKey ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <div className="mt-8 text-center">
        <button className="text-[13px] text-primary font-medium hover:underline">
          Podés <span className="font-bold">cancelar tu cuenta</span> siempre que lo desees.
        </button>
      </div>

    </div>
  );
}
