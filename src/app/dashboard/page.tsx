"use client"

import React, { useState, useEffect, Suspense } from 'react';
import {
  Search, Bell, ShoppingCart, User, ChevronDown, ChevronRight,
  ShoppingBag, Tag, Megaphone, FileText, CreditCard, Settings,
  MapPin, HelpCircle, MessageCircle, Star, Heart, TrendingUp, AlertCircle,
  Info, CheckCircle2, ChevronUp, Download, Filter, PieChart, BarChart2,
  MoreVertical, Activity, Clock, Box, ShieldAlert, XCircle, RefreshCcw,
  ThumbsUp, Users, Target, LayoutGrid, Zap, Plus, X, Maximize2, MessageSquare, Calendar,
  ClipboardList, Bookmark, Store, Car, Home, SearchCode,
  Eye, Package, DollarSign
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { UserMenu } from '@/components/dashboard/UserMenu';
import ReputacionView from "@/components/dashboard/ReputacionView";
import ResumenView from "@/components/dashboard/ResumenView";
import PreguntasView from "@/components/dashboard/PreguntasView";
import OpinionesView from "@/components/dashboard/OpinionesView";
import FavoritosView from "@/components/dashboard/FavoritosView";
import ComprasView from "@/components/dashboard/ComprasView";
import ProfileView from "@/components/dashboard/ProfileView";
import CartView from "@/components/dashboard/CartView";
import HelpView from "@/components/dashboard/HelpView";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import PublicacionesView from "@/components/dashboard/PublicacionesView";
import MarketingIAPage from "@/app/dashboard/marketing/page";
import MetricasView from "@/components/dashboard/MetricasView";
import ClipsView from "@/components/dashboard/ClipsView";
import VentasView from "@/components/dashboard/VentasView";
import CampaignDetailView from "@/components/dashboard/CampaignDetailView";
import CouponCreateView from "@/components/dashboard/CouponCreateView";
import MarketingCentralView from "@/components/dashboard/MarketingCentralView";
import AdvertisingView from "@/components/dashboard/AdvertisingView";
import MeliIntegrationView from "@/components/dashboard/MeliIntegrationView";
import MeliAdsStudioView from "@/components/dashboard/MeliAdsStudioView";
import ThemeToneSwitcher from "@/components/theme/ThemeToneSwitcher";

export default function App() {
  // Siempre igual en servidor y primer cliente (evita hydration mismatch). El hash se aplica en cliente.
  const [activeMenu, setActiveMenu] = useState('resumen');
  const [hashReady, setHashReady] = useState(false);

  // Leer #fragmento inicial (ej. OAuth redirige a #meli-sync)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveMenu(hash);
    setHashReady(true);
  }, []);

  // Sync activeMenu to URL hash so refresh keeps the selected section
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveMenu(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // No pisar el hash hasta haber leído el inicial (si no, #meli-sync pasaba a #resumen y el panel quedaba vacío)
  useEffect(() => {
    if (!hashReady) return;
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash !== activeMenu) {
      window.history.replaceState(null, '', `#${activeMenu}`);
    }
  }, [activeMenu, hashReady]);

  const [comprasOpen, setComprasOpen] = useState(false);
  const [ventasOpen, setVentasOpen] = useState(false);

  useEffect(() => {
    if (activeMenu === "meli-sync") setVentasOpen(true);
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "meli-ads-studio") setMarketingOpen(true);
  }, [activeMenu]);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [facturacionOpen, setFacturacionOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
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
  const [cartItemCount, setCartItemCount] = useState(0);

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

  // Fetch cart item count
  useEffect(() => {
    fetch('/api/cart')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch cart');
        return r.json();
      })
      .then((data) => {
        if (data?.summary?.itemCount) {
          setCartItemCount(data.summary.itemCount);
        } else {
          setCartItemCount(0);
        }
      })
      .catch((err) => {
        console.error('Error fetching cart count:', err);
        setCartItemCount(0);
      });
  }, []);

  const userData = {
    name: currentUser?.name || "MadsJeez | Repues...",
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
        { id: 'meli-sync', label: 'Mercado Libre' },
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
        { id: 'marketing-ia', label: '✨ Marketing IA' },
        { id: 'meli-ads-studio', label: 'Mercado Libre Ads' },
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
    { id: 'ayuda', label: 'Ayuda', icon: <HelpCircle size={18} /> },
  ];

  // --- VISTAS DE COMPRAS AGREGADAS ---

  const renderFavoritos = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-[26px] font-semibold text-gray-800">Favoritos</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-sm">
          <Plus size={18} /> Crear lista
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button onClick={() => setActiveFavoritosTab('favoritos')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'favoritos' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-800'}`}>Mis favoritos</button>
          <button onClick={() => setActiveFavoritosTab('listas')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'listas' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-800'}`}>Listas</button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
          <Heart size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aún no tienes favoritos</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-8">Guarda los productos que más te gusten para tenerlos siempre a mano.</p>
        <button className="bg-primary/10 text-primary font-semibold text-sm px-8 py-3 rounded-md hover:bg-primary/15 transition-colors">Buscar productos</button>
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
          <input type="text" placeholder="Buscar nombre de la tienda" className="w-full py-2 pl-9 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-primary" />
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
      <div className="flex justify-between items-center mb-2"><h1 className="text-[26px] font-semibold text-gray-800">Novedades</h1><button className="text-primary text-sm font-semibold hover:underline">Configurar notificaciones</button></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0"><Megaphone size={24} /></div>
        <div><div className="flex items-center gap-2 mb-1"><span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Importante</span><span className="text-xs text-gray-400 font-medium">Hace 2 horas</span></div><h3 className="text-lg font-bold text-gray-800 mb-1.5">¡Te damos la bienvenida a Madsjeez!</h3><p className="text-[14px] text-gray-600 mb-3 leading-relaxed">Estamos muy felices de que te sumes a nuestra plataforma. Aquí encontrarás todas las herramientas necesarias para potenciar tu negocio.</p><a href="#" className="text-primary text-sm font-semibold hover:underline">Ir a la Central de Aprendizaje</a></div>
      </div>
    </div>
  );

  const renderPublicaciones = () => <PublicacionesView />;

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


  const renderLiveMonitor = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

    const hourlyData = [
      { hour: '00', hoy: 0, ayer: 0 },
      { hour: '02', hoy: 0, ayer: 0 },
      { hour: '04', hoy: 0, ayer: 0 },
      { hour: '06', hoy: 0, ayer: 0 },
      { hour: '08', hoy: 15000, ayer: 0 },
      { hour: '10', hoy: 45000, ayer: 80000 },
      { hour: '12', hoy: 120000, ayer: 30000 },
      { hour: '14', hoy: 60000, ayer: 0 },
      { hour: '16', hoy: 25000, ayer: 100000 },
      { hour: '18', hoy: 50000, ayer: 150000 },
      { hour: '20', hoy: 220000, ayer: 80000 },
      { hour: '22', hoy: 45000, ayer: 20000 },
    ];

    const topProducts = [
      { rank: 1, title: 'Motor Completo Para Des...', price: '$ 89.999', stock: 4, stockLabel: '🔴', exp: '75 - Buena', img: '/placeholder.svg', highlighted: true },
      { rank: 2, title: 'Combo 40 Unidades Cuell...', price: '$ 73.359', stock: 145, exp: 'Sin calcular', img: '/placeholder.svg' },
      { rank: 3, title: 'Bomba Sin Fin Aceite Man...', price: '$ 67.998', stock: 0, exp: '100 - Buena', img: '/placeholder.svg' },
      { rank: 4, title: 'Caja Engranajes Desmalez...', price: '$ 49.699', stock: 5, exp: '100 - Buena', img: '/placeholder.svg' },
      { rank: 5, title: 'Tapa Arranque Cilambre ...', price: '$ 38.999', stock: 5, exp: '100 - Buena', img: '/placeholder.svg' },
    ];

    return (
      <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
        {/* Header amarillo */}
        <div className="bg-muted py-10 text-center relative border-b border-border">
          <button onClick={() => setShowLiveMonitor(false)} className="absolute left-6 top-6 flex items-center gap-1 text-slate-900 font-bold hover:underline text-sm">
            <ChevronDown className="rotate-90" size={16}/> Volver a Métricas
          </button>
          <button onClick={() => setShowLiveMonitor(false)} className="absolute right-6 top-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-50">
            <X size={20} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-black text-gray-800 mb-8">Ventas de hoy en vivo</h1>
          <div className="bg-white rounded-full px-4 py-1.5 text-xs text-gray-600 font-medium inline-flex items-center gap-1.5 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {dateStr}, {timeStr}
          </div>
          <div className="text-6xl font-black text-gray-800">$ 570.803<span className="text-4xl">,20</span></div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto pt-8 px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Métricas clave */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">Métricas clave</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Eye size={18} className="text-primary" />, label: 'Visitas únicas', value: '789' },
                  { icon: <Users size={18} className="text-primary" />, label: 'Total de compradores', value: '14' },
                  { icon: <ShoppingBag size={18} className="text-primary" />, label: 'Cantidad de ventas', value: '16' },
                  { icon: <TrendingUp size={18} className="text-primary" />, label: 'Conversión', value: '2,03%' },
                  { icon: <Package size={18} className="text-primary" />, label: 'Unidades vendidas', value: '17 u.' },
                  { icon: <DollarSign size={18} className="text-primary" />, label: 'Precio promedio', value: '$ 33.576' },
                ].map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">{m.icon}</div>
                    <div className="text-lg font-black text-gray-800">{m.value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tendencias en ventas brutas */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">Tendencias en ventas brutas</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v/1000).toFixed(0)} mil`} />
                  <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="hoy" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} name="Hoy" />
                  <Line type="monotone" dataKey="ayer" stroke="#EC4899" strokeWidth={2} dot={{ r: 3, fill: '#EC4899' }} name="Ayer" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <span className="text-xs text-gray-500">Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                  <span className="text-xs text-gray-500">Ayer</span>
                </div>
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">Productos más vendidos</h3>
              <div className="space-y-3">
                {topProducts.map((p) => (
                  <div key={p.rank} className={`flex items-center gap-3 p-2.5 rounded-lg ${p.highlighted ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50'}`}>
                    <div className={`text-sm font-bold ${p.rank === 1 ? 'text-primary' : 'text-gray-500'} w-5 text-center`}>{p.rank}</div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img src={p.img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Ventas del día: {p.price}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span>Stock: {p.stock} {p.stockLabel || ''}</span>
                        <span>unidades</span>
                      </div>
                      <div className="text-[11px] text-gray-500">Experiencia de compra: {p.exp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // VISTAS RAÍZ
  if (showLiveMonitor) return renderLiveMonitor();

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col relative">
      <header className="bg-[var(--shell-header-bg)] border-b border-[var(--shell-header-border)] py-2 px-4 shadow-sm z-50 relative flex-shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden group-hover:shadow-primary/20 transition-all">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent"></div>
              <svg viewBox="0 0 100 100" className="w-7 h-7 overflow-visible">
                <polygon points="15,80 35,30 55,55 35,80" fill="#2563EB" className="opacity-90" />
                <polygon points="55,55 75,30 95,80 75,80" fill="#2563EB" className="opacity-90" />
                <path d="M 85 80 L 65 30 L 45 65" fill="none" stroke="#3b82f6" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-black text-[22px] tracking-tighter leading-none flex items-center uppercase">
              <span className="text-slate-900">MADS</span>
              <span className="text-primary">JEEZ</span>
            </span>
          </a>
          <div className="flex items-center gap-4 text-[13px] text-slate-800 font-light">
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 hover:text-gray-900">
                {currentUser?.image ? (
                  <img src={currentUser.image} alt={userData.name} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
                ) : (
                  <User size={16} />
                )}
                <span className="max-w-[100px] truncate">{userData.name}</span>
                <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
            <button onClick={() => setActiveMenu('publicaciones')} className="hover:text-gray-900">Vender</button>
            <button onClick={() => setActiveMenu('ayuda')} className="hover:text-gray-900">Ayuda</button>
            <ThemeToneSwitcher compact />
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative hover:text-gray-900 p-0.5 transition-colors">
                <Bell size={18} />
              </button>
              <NotificationsDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <button 
              type="button"
              onClick={() => setIsAssistantOpen(true)} 
              className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm"
            >
              Asistente
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: sidebar pegado al borde izquierdo */}
      <div className="flex-1 flex">
        {/* SIDEBAR IZQUIERDO: pegado al borde, sin margen */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200">
          <div className="py-6 px-0">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 px-4">
              <span className="grid grid-cols-2 gap-0.5"><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span></span>
              MI CUENTA
            </h2>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.isParent ? (
                    <>
                      <button onClick={() => item.setIsOpen(!item.isOpen)} className="w-full flex items-center justify-between py-2 px-4 hover:bg-primary/10 text-primary font-semibold transition-colors text-sm">
                        <div className="flex items-center gap-3">{item.icon} {item.label}</div>
                        <ChevronDown size={16} className={`transform transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {item.isOpen && (
                        <div className="flex flex-col ml-4 mt-1 border-l-2 border-gray-200 pl-4 gap-1">
                          {item.subItems.map(sub => (
                            <button key={sub.id} onClick={() => setActiveMenu(sub.id)} className={`text-left text-sm py-1.5 px-2 transition-colors flex items-center justify-between rounded ${activeMenu === sub.id ? 'text-primary font-bold bg-[var(--shell-sidebar-active-bg)]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                              <span>{sub.label}</span>
                              {(sub as any).rightIcon && (sub as any).rightIcon}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center justify-between py-2 px-4 font-medium transition-colors text-sm ${activeMenu === item.id ? 'bg-[var(--shell-sidebar-active-bg)] text-primary' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <div className="flex items-center gap-3">{item.icon || <LayoutGrid size={18}/>} {item.label}</div>
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* ÁREA CENTRAL DINÁMICA */}
        <section className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            {activeMenu === 'resumen' && <ResumenView />}
            {activeMenu === 'reputacion' && <ReputacionView />}
            {activeMenu === 'metricas' && <MetricasView />}
            {activeMenu === 'ventas-novedades' && renderNovedades()}
            {activeMenu === 'posventa' && renderPosventa()}
            {activeMenu === 'preferencias-venta' && renderPreferenciasVenta()}
            {activeMenu === 'preguntas' && <PreguntasView />}
            {activeMenu === 'opiniones' && <OpinionesView />}
            {activeMenu === 'favoritos' && <FavoritosView />}
            {activeMenu === 'compras' && <ComprasView />}
            {activeMenu === 'perfil' && <ProfileView userData={currentUser || undefined} />}
            {activeMenu === 'carrito' && <CartView />}
            {activeMenu === 'ayuda' && <HelpView userData={currentUser || undefined} onNavigate={(section) => setActiveMenu(section)} />}
            {activeMenu === 'publicaciones' && <div className="-mx-4 lg:-mx-8">{renderPublicaciones()}</div>}
            {activeMenu === 'meli-sync' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                    Cargando Mercado Libre…
                  </div>
                }
              >
                <MeliIntegrationView />
              </Suspense>
            )}
            {activeMenu === 'marketing-ia' && <MarketingIAPage />}
            {activeMenu === 'meli-ads-studio' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                    Cargando Mercado Libre Ads…
                  </div>
                }
              >
                <MeliAdsStudioView />
              </Suspense>
            )}
            {activeMenu === 'central-marketing' && <MarketingCentralView />}
            {activeMenu === 'publicidad' && <AdvertisingView />}
            {activeMenu === 'clips' && <ClipsView />}
            {activeMenu === 'ventas-lista' && <VentasView />}
            {activeMenu === 'campania-detalle' && <CampaignDetailView />}
            {activeMenu === 'crear-cupon' && <CouponCreateView />}
          </div>
        </section>
      </div>

      {isAssistantOpen && (
        <div className="fixed bottom-24 right-6 z-[10050] flex flex-col items-end max-sm:right-4">
          <div className="bg-white w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 mb-4 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm">
              <h3 className="font-bold text-gray-800 text-[15px]">Asistente</h3>
              <div className="flex items-center gap-2 text-gray-500">
                <button type="button" className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"><Maximize2 size={16}/></button>
                <button type="button" onClick={() => setIsAssistantOpen(false)} className="hover:bg-gray-100 p-1.5 rounded-md transition-colors"><X size={18}/></button>
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
                <input type="text" placeholder="Preguntale al asistente..." className="w-full pl-4 pr-10 py-3 bg-gray-100 rounded-full text-[13px] font-medium focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary"><ChevronUp size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES REUTILIZABLES ---
function PreferenceItem({ title, subtitle, rightElement, hasBorder = true }) {
  return (
    <div className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${hasBorder ? 'border-b border-gray-100' : ''}`}>
      <div><h4 className="text-[15px] text-gray-800 font-medium">{title}</h4>{subtitle && <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>}</div>
      {rightElement || <ChevronRight size={20} className="text-primary" />}
    </div>
  );
}

function TabButton({ id, label, current, set }) {
  return (
    <button onClick={() => set(id)} className={`pb-3 px-1 transition-colors ${current === id ? 'text-primary border-b-2 border-primary' : 'hover:text-gray-800'}`}>{label}</button>
  );
}

function DropdownItem({ text, onClick }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className="flex justify-between items-center px-4 py-2 hover:bg-primary/10 hover:text-primary text-gray-600 transition-colors"><span>{text}</span></a>
  );
}
