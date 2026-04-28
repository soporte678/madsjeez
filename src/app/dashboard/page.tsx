"use client"

import React, { useState, useEffect } from 'react';
import {
  Search, Bell, ShoppingCart, User, ChevronDown, ChevronRight,
  ShoppingBag, Tag, Megaphone, FileText, CreditCard, Settings,
  MapPin, HelpCircle, MessageCircle, Star, Heart, TrendingUp, AlertCircle,
  Info, CheckCircle2, ChevronUp, Download, Filter, PieChart, BarChart2,
  MoreVertical, Activity, Clock, Box, ShieldAlert, XCircle, RefreshCcw,
  ThumbsUp, Users, Target, LayoutGrid, Zap, Plus, X, Maximize2, MessageSquare, Calendar,
  ClipboardList, Bookmark, Store, Car, Home, SearchCode
} from 'lucide-react';
import { UserMenu } from '@/components/dashboard/UserMenu';
import ReputacionView from "@/components/dashboard/ReputacionView";
import ResumenView from "@/components/dashboard/ResumenView";
import PreguntasView from "@/components/dashboard/PreguntasView";
import OpinionesView from "@/components/dashboard/OpinionesView";
import FavoritosView from "@/components/dashboard/FavoritosView";
import ComprasView from "@/components/dashboard/ComprasView";
import ProfileView from "@/components/dashboard/ProfileView";
import CartView from "@/components/dashboard/CartView";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";

function getInitialMenu() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
  }
  return 'resumen';
}

export default function App() {
  const [activeMenu, setActiveMenu] = useState(getInitialMenu);

  // Sync activeMenu to URL hash so refresh keeps the selected section
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) setActiveMenu(hash);
      };
      window.addEventListener('hashchange', onHashChange);
      return () => window.removeEventListener('hashchange', onHashChange);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeMenu) {
        window.history.replaceState(null, '', `#${activeMenu}`);
      }
    }
  }, [activeMenu]);
  const [comprasOpen, setComprasOpen] = useState(true);
  const [ventasOpen, setVentasOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(true);
  const [facturacionOpen, setFacturacionOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeMetricasTab, setActiveMetricasTab] = useState('negocio');
  const [activePromocionesSubTab, setActivePromocionesSubTab] = useState('promociones');
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);
  
  const [activePosventaTab, setActivePosventaTab] = useState('reclamos');
  const [activeCatalogoTab, setActiveCatalogoTab] = useState('sugerencias');
  const [activeFavoritosTab, setActiveFavoritosTab] = useState('favoritos');
  
  // Estado para el widget del Asistente
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; image: string | null } | null>(null);

  // Fetch real user data from session
  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setCurrentUser(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching user:', err);
      });
  }, []);

  const userData = {
    name: currentUser?.name || "Maqjeez | Repues...",
    email: currentUser?.email || "",
    reputation: "VENDEDOR NUEVO",
    billing: "0,00",
    adsSales: 0,
    pendingQuestions: 0,
    itemsToImprove: 0,
    expressShipping: 0,
    competitivePrices: 0
  };

  const menuItems = [
    {
      id: 'compras-group',
      label: 'Compras',
      icon: <ShoppingBag size={18} />,
      isParent: true,
      isOpen: comprasOpen,
      setIsOpen: setComprasOpen,
      subItems: [
        { id: 'compras', label: 'Compras' },
        { id: 'carrito', label: 'Carrito' },
        { id: 'preguntas', label: 'Preguntas' },
        { id: 'opiniones', label: 'Opiniones' },
        { id: 'favoritos', label: 'Favoritos' },
        { id: 'tiendas-sigo', label: 'Tiendas que sigo' },
        { id: 'vehiculos-interes', label: 'Vehículos de interés' },
        { id: 'inmuebles-interes', label: 'Inmuebles de interés' },
        { id: 'busquedas-guardadas', label: 'Búsquedas guardadas' },
      ]
    },
    {
      id: 'ventas-group',
      label: 'Ventas',
      icon: <Tag size={18} />,
      isParent: true,
      isOpen: ventasOpen,
      setIsOpen: setVentasOpen,
      subItems: [
        { id: 'resumen', label: 'Resumen' },
        { id: 'ventas-novedades', label: 'Novedades' },
        { id: 'publicaciones', label: 'Publicaciones' },
        { id: 'preguntas', label: 'Preguntas' },
        { id: 'ventas-lista', label: 'Ventas' },
        { id: 'posventa', label: 'Posventa' },
        { id: 'metricas', label: 'Métricas' },
        { id: 'reputacion', label: 'Reputación' },
        { id: 'productos-catalogo', label: 'Productos de catálogo' },
        { id: 'preferencias-venta', label: 'Preferencias de venta' },
        { id: 'central-aprendizaje', label: 'Central de aprendizaje' },
      ]
    },
    {
      id: 'marketing-group',
      label: 'Marketing',
      icon: <Megaphone size={18} />,
      isParent: true,
      isOpen: marketingOpen,
      setIsOpen: setMarketingOpen,
      subItems: [
        { id: 'central-marketing', label: 'Central de marketing' },
        { id: 'publicidad', label: 'Publicidad' },
        { id: 'promociones', label: 'Promociones' },
        { id: 'clips', label: 'Clips' },
        { id: 'mi-pagina', label: 'Mi página' },
        { id: 'canal-difusion', label: 'Canal de difusión' },
      ]
    },
    {
      id: 'facturacion-group',
      label: 'Facturación',
      icon: <FileText size={18} />,
      isParent: true,
      isOpen: facturacionOpen,
      setIsOpen: setFacturacionOpen,
      subItems: [
        { id: 'tarifas-pagos', label: 'Tarifas y pagos' },
        { id: 'facturacion', label: 'Facturación' },
      ]
    },
    { id: 'perfil', label: 'Mi perfil', icon: <User size={18} /> },
    {
      id: 'configuracion-group',
      label: 'Configuración',
      icon: <Settings size={18} />,
      isParent: true,
      isOpen: configOpen,
      setIsOpen: setConfigOpen,
      subItems: [
        { id: 'mis-marcas', label: 'Mis marcas' },
        { id: 'colaboradores', label: 'Colaboradores' },
      ]
    },
  ];

  // --- VISTAS DE COMPRAS AGREGADAS ---

  const renderFavoritos = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-[26px] font-semibold text-gray-800">Favoritos</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm">
          <Plus size={18} /> Crear lista
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button onClick={() => setActiveFavoritosTab('favoritos')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'favoritos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Mis favoritos</button>
          <button onClick={() => setActiveFavoritosTab('listas')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'listas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Listas</button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
          <Heart size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aún no tienes favoritos</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-8">Guarda los productos que más te gusten para tenerlos siempre a mano.</p>
        <button className="bg-blue-50 text-blue-600 font-semibold text-sm px-8 py-3 rounded-md hover:bg-blue-100 transition-colors">Buscar productos</button>
      </div>
    </div>
  );

  const renderTiendasSigo = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[26px] font-semibold text-gray-800">Tiendas que sigo</h1>
        <span className="text-sm text-gray-400 font-medium">0 tiendas que sigo</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar nombre de la tienda" className="w-full py-2 pl-9 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
        <Store size={40} className="text-gray-200 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">No sigues ninguna tienda</h3>
        <p className="text-sm text-gray-500 mb-6">Sigue a tus marcas favoritas para enterarte de sus novedades.</p>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recomendadas para ti</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between opacity-50 italic text-gray-400">
             Pronto verás recomendaciones aquí...
          </div>
        </div>
      </div>
    </div>
  );

  const renderVehiculosInteres = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-gray-800">Vehículos de interés</h1>
      <div className="flex items-center gap-2 mb-4">
        <button className="flex items-center gap-1 text-gray-600 text-sm font-semibold hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300"><Filter size={14}/> Filtrar</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-24 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
           <Car size={48} className="text-gray-200" />
           <div className="absolute -bottom-2 -right-2 bg-gray-100 p-1 rounded-full border-2 border-white"><Search size={14} className="text-gray-400"/></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aquí encontrarás los vehículos en los que te intereses</h3>
        <p className="text-sm text-gray-500">Aparecerán aquí cuando contactes a un vendedor desde una publicación.</p>
      </div>
    </div>
  );

  const renderInmueblesInteres = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-gray-800">Inmuebles de interés</h1>
      <div className="flex items-center gap-2 mb-4">
        <button className="flex items-center gap-1 text-gray-600 text-sm font-semibold hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300"><Filter size={14}/> Filtrar</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-24 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
           <Home size={48} className="text-gray-200" />
           <div className="absolute -bottom-2 -right-2 bg-gray-100 p-1 rounded-full border-2 border-white"><Search size={14} className="text-gray-400"/></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aquí encontrarás los inmuebles en los que te intereses</h3>
        <p className="text-sm text-gray-500">Aparecerán aquí cuando contactes a un vendedor desde una publicación.</p>
      </div>
    </div>
  );

  const renderBusquedasGuardadas = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-gray-800">Búsquedas guardadas</h1>
      <div className="flex items-center gap-2 mb-2">
        <button className="flex items-center gap-1 text-gray-600 text-sm font-semibold hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300"><LayoutGrid size={14}/> Todas <ChevronDown size={14}/></button>
        <span className="text-xs text-gray-400 ml-4 font-medium italic">0 resultados</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-24 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-6 border border-gray-200">
           <SearchCode size={32} className="text-gray-200" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aún no tenés búsquedas guardadas</h3>
        <p className="text-sm text-gray-500 max-w-sm">Encontrarás tus búsquedas y podrás administrar tus notificaciones para las publicaciones de inmuebles y vehículos.</p>
      </div>
    </div>
  );

  // --- VISTAS PREVIAMENTE DESARROLLADAS (MANTENIDAS) ---


  const renderNovedades = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-2"><h1 className="text-[26px] font-semibold text-gray-800">Novedades</h1><button className="text-blue-600 text-sm font-semibold hover:underline">Configurar notificaciones</button></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Megaphone size={24} /></div>
        <div><div className="flex items-center gap-2 mb-1"><span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Importante</span><span className="text-xs text-gray-400 font-medium">Hace 2 horas</span></div><h3 className="text-lg font-bold text-gray-800 mb-1.5">¡Te damos la bienvenida a Madsjeez!</h3><p className="text-[14px] text-gray-600 mb-3 leading-relaxed">Estamos muy felices de que te sumes a nuestra plataforma. Aquí encontrarás todas las herramientas necesarias para potenciar tu negocio.</p><a href="#" className="text-blue-600 text-sm font-semibold hover:underline">Ir a la Central de Aprendizaje</a></div>
      </div>
    </div>
  );

  const renderProductosCatalogo = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center"><h1 className="text-[26px] font-semibold text-gray-800">Productos de Catálogo</h1><button className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-600 shadow-sm">Crear productos</button></div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-center mt-4">
        <Box size={32} className="text-gray-300 mb-3" /><p className="text-sm font-semibold text-gray-700">Aún no tienes sugerencias de catálogo</p>
      </div>
    </div>
  );

  const renderPosventa = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-gray-800">Posventa</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="p-16 text-center text-gray-400 bg-white">No hay actividad de posventa en {activePosventaTab}</div></div>
    </div>
  );

  const renderPreferenciasVenta = () => (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-4xl">
      <h1 className="text-[26px] font-semibold text-gray-800 mb-2">Preferencias de venta</h1>
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <PreferenceItem title="Mis domicilios de envíos" subtitle="Gestioná tus domicilios de envíos." />
        <PreferenceItem title="Mis horarios de colecta" subtitle="Consultá tus horarios para enviar tus ventas a tiempo." />
        <PreferenceItem title="Envíos Express" subtitle="Almacenamos tus productos en Madsjeez Hub." hasBorder={false} rightElement={<span></span>}/>
      </section>
    </div>
  );

  const renderMetricas = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl">
      <div className="flex justify-between items-center"><h1 className="text-[28px] font-medium text-gray-800">Métricas</h1><button onClick={() => setShowLiveMonitor(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Monitor de ventas en vivo</button></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 text-center text-gray-400 italic">Panel de métricas en preparación...</div>
    </div>
  );

  const renderLiveMonitor = () => (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      <div className="bg-[#fff159] py-8 text-center relative border-b border-yellow-400">
        <button onClick={() => setShowLiveMonitor(false)} className="absolute left-6 top-6 flex items-center gap-1 text-blue-900 font-bold hover:underline"><ChevronDown className="rotate-90" size={16}/> Volver a Métricas</button>
        <h1 className="text-2xl font-black text-gray-800">Ventas de hoy en vivo</h1>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-[500px] bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100"><div className="text-5xl font-black text-gray-800">$ 0</div></div>
      </div>
      <div className="max-w-[1200px] mx-auto pt-20 px-4 text-center py-20 text-gray-400 font-medium">Esperando datos reales...</div>
    </div>
  );

  // VISTAS RAÍZ
  if (showLiveMonitor) return renderLiveMonitor();

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col relative overflow-x-hidden">
      {/* HEADER AMARILLO */}
      <header className="bg-[#fff159] py-2 px-4 shadow-sm z-50 relative">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden group-hover:shadow-blue-500/20 transition-all">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent"></div>
                <svg viewBox="0 0 100 100" className="w-7 h-7 overflow-visible">
                  <polygon points="15,80 35,30 55,55 35,80" fill="#2563EB" className="opacity-90" />
                  <polygon points="55,55 75,30 95,80 75,80" fill="#2563EB" className="opacity-90" />
                  <path d="M 85 80 L 65 30 L 45 65" fill="none" stroke="#FACC15" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-black text-[22px] tracking-tighter leading-none flex items-center uppercase">
                <span className="text-slate-900">MADS</span>
                <span className="text-blue-700">JEEZ</span>
              </span>
            </a>
            <div className="flex-1 max-w-2xl mx-8 relative">
              <input type="text" placeholder="Buscar productos, marcas y más..." className="w-full py-2 px-4 rounded-full shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Search size={18} /></button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1.5 hover:text-gray-600 font-semibold">
                  {currentUser?.image ? (
                    <img src={currentUser.image} alt={userData.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <User size={18} />
                  )}
                  <span className="max-w-[120px] truncate">{userData.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <UserMenu 
                  isOpen={userMenuOpen}
                  onClose={() => setUserMenuOpen(false)}
                  userData={{
                    name: userData.name,
                    email: userData.email,
                    image: currentUser?.image || null
                  }}
                  onNavigate={(view) => {
                    setActiveMenu(view);
                    setUserMenuOpen(false);
                  }}
                />
              </div>
              <button className="hover:text-gray-600">Ayuda</button>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative hover:text-gray-600 p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <Bell size={20} />
                </button>
                <NotificationsDropdown
                  isOpen={notifOpen}
                  onClose={() => setNotifOpen(false)}
                />
              </div>
              <button className="relative hover:text-gray-600"><ShoppingCart size={20} /><span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">2</span></button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"><MapPin size={16} /> Enviar a Carlos Spegazzini 1812</button>
            <nav className="flex items-center gap-4 text-gray-600 font-medium">
              <a href="#" className="hover:text-gray-900">Categorías <ChevronDown size={14} className="inline" /></a>
              <a href="#" className="hover:text-gray-900">Ofertas</a>
              <a href="#" className="hover:text-gray-900">Vender</a>
            </nav>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs tracking-wider"><Star size={14} fill="currentColor" /> MADSJEEZ PRO</div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1200px] w-full mx-auto py-8 px-4 flex gap-8 flex-1 items-start">
        {/* SIDEBAR IZQUIERDO */}
        <aside className="w-56 flex-shrink-0 overflow-hidden">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="grid grid-cols-2 gap-0.5"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span></span>
            MI CUENTA
          </h2>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <div key={item.id} className="mb-2">
                {item.isParent ? (
                  <>
                    <button onClick={() => item.setIsOpen(!item.isOpen)} className="w-full flex items-center justify-between py-2 px-3 hover:bg-blue-50 rounded-lg text-blue-600 font-semibold transition-colors">
                      <div className="flex items-center gap-3">{item.icon} {item.label}</div>
                      <ChevronDown size={16} className={`transform transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {item.isOpen && (
                      <div className="flex flex-col ml-9 mt-1 border-l-2 border-gray-200 pl-4 gap-2">
                        {item.subItems.map(sub => (
                          <button key={sub.id} onClick={() => setActiveMenu(sub.id)} className={`text-left text-sm py-1.5 transition-colors flex items-center justify-between ${activeMenu === sub.id ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
                            <span>{sub.label}</span>
                            {(sub as any).rightIcon && (sub as any).rightIcon}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center justify-between py-2 px-3 rounded-lg font-medium transition-colors ${activeMenu === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-200'}`}>
                    <div className="flex items-center gap-3">{item.icon || <LayoutGrid size={18}/>} {item.label}</div>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* ÁREA CENTRAL DINÁMICA */}
        <section className="flex-1">
          {activeMenu === 'resumen' && <ResumenView />}
          {activeMenu === 'reputacion' && <ReputacionView />}
          {activeMenu === 'metricas' && renderMetricas()}
          {activeMenu === 'ventas-novedades' && renderNovedades()}
          {activeMenu === 'posventa' && renderPosventa()}
          {activeMenu === 'preferencias-venta' && renderPreferenciasVenta()}
          {activeMenu === 'preguntas' && <PreguntasView />}
          {activeMenu === 'opiniones' && <OpinionesView />}
          {activeMenu === 'favoritos' && <FavoritosView />}
          {activeMenu === 'compras' && <ComprasView />}
          {activeMenu === 'perfil' && <ProfileView userData={currentUser || undefined} />}
          {activeMenu === 'carrito' && <CartView />}
          {activeMenu === 'publicaciones' && renderProductosCatalogo()}
        </section>
      </main>

      {/* ASISTENTE */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isAssistantOpen && (
          <div className="bg-white w-[340px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 mb-4 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm">
              <h3 className="font-bold text-gray-800 text-[15px]">Asistente</h3>
              <div className="flex items-center gap-2 text-gray-500">
                <button className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"><Maximize2 size={16}/></button>
                <button onClick={() => setIsAssistantOpen(false)} className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"><X size={18}/></button>
              </div>
            </div>
            <div className="p-5 h-[320px] bg-gray-50 flex flex-col justify-end">
              <div className="flex items-center gap-3 text-gray-600 bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-200 self-start w-3/4">
                 <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span></div>
                 <span className="text-sm font-medium">Pensando...</span>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative">
                <input type="text" placeholder="Preguntale al asistente..." className="w-full pl-4 pr-10 py-3 bg-gray-100 rounded-full text-[13px] font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition-all" />
                <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-100 hover:text-blue-600"><ChevronUp size={16} /></button>
              </div>
            </div>
          </div>
        )}
        {!isAssistantOpen && (
          <button onClick={() => setIsAssistantOpen(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all">
            <MessageCircle size={28} /><span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES REUTILIZABLES ---
function PreferenceItem({ title, subtitle, rightElement, hasBorder = true }) {
  return (
    <div className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${hasBorder ? 'border-b border-gray-100' : ''}`}>
      <div><h4 className="text-[15px] text-gray-800 font-medium">{title}</h4>{subtitle && <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>}</div>
      {rightElement || <ChevronRight size={20} className="text-blue-500" />}
    </div>
  );
}

function TabButton({ id, label, current, set }) {
  return (
    <button onClick={() => set(id)} className={`pb-3 px-1 transition-colors ${current === id ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-800'}`}>{label}</button>
  );
}

function DropdownItem({ text, onClick }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className="flex justify-between items-center px-4 py-2 hover:bg-blue-50/50 hover:text-blue-600 text-gray-600 transition-colors"><span>{text}</span></a>
  );
}
