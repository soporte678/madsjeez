"use client"

import React, { useState, useEffect, Suspense } from 'react';
import Link from "next/link";
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
import RainbowLogo from "@/components/brand/RainbowLogo";

type InterestItem = {
  id: string;
  title: string;
  location: string;
  price: string;
  note: string;
  status: "nuevo" | "contactado" | "seguimiento";
  createdAt: string;
};

type SavedSearchItem = {
  id: string;
  label: string;
  category: "vehiculos" | "inmuebles";
  alerts: boolean;
  createdAt: string;
};

const VEHICLE_INTERESTS_KEY = "madsjeez_dashboard_vehicle_interests";
const PROPERTY_INTERESTS_KEY = "madsjeez_dashboard_property_interests";
const SAVED_SEARCHES_KEY = "madsjeez_dashboard_saved_searches";

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
  const [vehicleInterests, setVehicleInterests] = useState<InterestItem[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<InterestItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [vehicleDraft, setVehicleDraft] = useState({ title: "", location: "", price: "", note: "" });
  const [propertyDraft, setPropertyDraft] = useState({ title: "", location: "", price: "", note: "" });
  const [searchDraft, setSearchDraft] = useState({ label: "", category: "vehiculos" as "vehiculos" | "inmuebles" });
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawVehicles = localStorage.getItem(VEHICLE_INTERESTS_KEY);
      const rawProperties = localStorage.getItem(PROPERTY_INTERESTS_KEY);
      const rawSearches = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (rawVehicles) setVehicleInterests(JSON.parse(rawVehicles));
      if (rawProperties) setPropertyInterests(JSON.parse(rawProperties));
      if (rawSearches) setSavedSearches(JSON.parse(rawSearches));
    } catch (error) {
      console.error("Error loading dashboard local data:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(VEHICLE_INTERESTS_KEY, JSON.stringify(vehicleInterests));
  }, [vehicleInterests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PROPERTY_INTERESTS_KEY, JSON.stringify(propertyInterests));
  }, [propertyInterests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches));
  }, [savedSearches]);

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
        { id: 'carrito', label: 'Carrito (panel)' },
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
        { id: 'metricas', label: 'Métricas (resumen)' },
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
        { id: 'marketing-ia', label: '✨ Marketing IA (beta)' },
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
        <h1 className="text-[26px] font-semibold text-foreground">Favoritos</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-sm">
          <Plus size={18} /> Crear lista
        </button>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-8">
          <button onClick={() => setActiveFavoritosTab('favoritos')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'favoritos' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>Mis favoritos</button>
          <button onClick={() => setActiveFavoritosTab('listas')} className={`pb-3 px-1 text-[15px] font-medium transition-colors ${activeFavoritosTab === 'listas' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>Listas</button>
        </nav>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 border border-border">
          <Heart size={32} className="text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aún no tienes favoritos</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-8">Guarda los productos que más te gusten para tenerlos siempre a mano.</p>
        <button className="bg-primary/10 text-primary font-semibold text-sm px-8 py-3 rounded-md hover:bg-primary/15 transition-colors">Buscar productos</button>
      </div>
    </div>
  );

  const renderTiendasSigo = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[26px] font-semibold text-foreground">Tiendas que sigo</h1>
        <span className="text-sm text-muted-foreground font-medium">0 tiendas que sigo</span>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-2">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar nombre de la tienda" className="w-full py-2 pl-9 pr-4 text-sm border border-border rounded-full focus:outline-none focus:border-primary bg-card text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
        <Store size={40} className="text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No sigues ninguna tienda</h3>
        <p className="text-sm text-muted-foreground mb-6">Sigue a tus marcas favoritas para enterarte de sus novedades.</p>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Recomendadas para ti</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between opacity-50 italic text-muted-foreground">
             Pronto verás recomendaciones aquí...
          </div>
        </div>
      </div>
    </div>
  );

  const renderVehiculosInteres = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Vehiculos de interes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Guarda oportunidades, deja notas y marca en que punto va cada contacto.</p>
        </div>
        <button onClick={() => setShowVehicleForm((prev) => !prev)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} />
          Agregar vehiculo
        </button>
      </div>

      {showVehicleForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={vehicleDraft.title} onChange={(e) => setVehicleDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Modelo o publicacion" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={vehicleDraft.location} onChange={(e) => setVehicleDraft((prev) => ({ ...prev, location: e.target.value }))} placeholder="Ubicacion" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={vehicleDraft.price} onChange={(e) => setVehicleDraft((prev) => ({ ...prev, price: e.target.value }))} placeholder="Precio visto" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={vehicleDraft.note} onChange={(e) => setVehicleDraft((prev) => ({ ...prev, note: e.target.value }))} placeholder="Nota o detalle del vendedor" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                if (!vehicleDraft.title.trim()) return;
                setVehicleInterests((prev) => [
                  {
                    id: `veh-${Date.now()}`,
                    title: vehicleDraft.title.trim(),
                    location: vehicleDraft.location.trim(),
                    price: vehicleDraft.price.trim(),
                    note: vehicleDraft.note.trim(),
                    status: "nuevo",
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                setVehicleDraft({ title: "", location: "", price: "", note: "" });
                setShowVehicleForm(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Guardar interes
            </button>
            <button onClick={() => setShowVehicleForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {vehicleInterests.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-24 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
             <Car size={48} className="text-muted-foreground/40" />
             <div className="absolute -bottom-2 -right-2 bg-muted p-1 rounded-full border-2 border-card"><Search size={14} className="text-muted-foreground"/></div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Todavia no guardaste vehiculos</h3>
          <p className="text-sm text-muted-foreground">Puedes cargarlos manualmente mientras conectamos esta vista con contactos reales.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {vehicleInterests.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {item.location}</span>}
                    {item.price && <span className="inline-flex items-center gap-1"><DollarSign size={14} /> {item.price}</span>}
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {new Date(item.createdAt).toLocaleDateString("es-AR")}</span>
                  </div>
                  {item.note && <p className="mt-3 text-sm text-muted-foreground">{item.note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["nuevo", "contactado", "seguimiento"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setVehicleInterests((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, status } : entry))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.status === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {status}
                    </button>
                  ))}
                  <button onClick={() => setVehicleInterests((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInmueblesInteres = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Inmuebles de interes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Centraliza propiedades seguidas, precio visto y observaciones para no perder contexto.</p>
        </div>
        <button onClick={() => setShowPropertyForm((prev) => !prev)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} />
          Agregar inmueble
        </button>
      </div>

      {showPropertyForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={propertyDraft.title} onChange={(e) => setPropertyDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Propiedad o publicacion" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={propertyDraft.location} onChange={(e) => setPropertyDraft((prev) => ({ ...prev, location: e.target.value }))} placeholder="Zona o barrio" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={propertyDraft.price} onChange={(e) => setPropertyDraft((prev) => ({ ...prev, price: e.target.value }))} placeholder="Precio visto" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={propertyDraft.note} onChange={(e) => setPropertyDraft((prev) => ({ ...prev, note: e.target.value }))} placeholder="Nota o condicion destacada" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                if (!propertyDraft.title.trim()) return;
                setPropertyInterests((prev) => [
                  {
                    id: `prop-${Date.now()}`,
                    title: propertyDraft.title.trim(),
                    location: propertyDraft.location.trim(),
                    price: propertyDraft.price.trim(),
                    note: propertyDraft.note.trim(),
                    status: "nuevo",
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                setPropertyDraft({ title: "", location: "", price: "", note: "" });
                setShowPropertyForm(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Guardar interes
            </button>
            <button onClick={() => setShowPropertyForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {propertyInterests.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-24 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
             <Home size={48} className="text-muted-foreground/40" />
             <div className="absolute -bottom-2 -right-2 bg-muted p-1 rounded-full border-2 border-card"><Search size={14} className="text-muted-foreground"/></div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Todavia no guardaste inmuebles</h3>
          <p className="text-sm text-muted-foreground">Puedes cargar propiedades manualmente mientras conectamos esta vista con contactos reales.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {propertyInterests.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {item.location}</span>}
                    {item.price && <span className="inline-flex items-center gap-1"><DollarSign size={14} /> {item.price}</span>}
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {new Date(item.createdAt).toLocaleDateString("es-AR")}</span>
                  </div>
                  {item.note && <p className="mt-3 text-sm text-muted-foreground">{item.note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["nuevo", "contactado", "seguimiento"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setPropertyInterests((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, status } : entry))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.status === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {status}
                    </button>
                  ))}
                  <button onClick={() => setPropertyInterests((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBusquedasGuardadas = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Busquedas guardadas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Guarda consultas recurrentes y activa alertas locales para retomarlas rapido.</p>
        </div>
        <button onClick={() => setShowSearchForm((prev) => !prev)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} />
          Guardar busqueda
        </button>
      </div>

      {showSearchForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input value={searchDraft.label} onChange={(e) => setSearchDraft((prev) => ({ ...prev, label: e.target.value }))} placeholder="Ej: depto 3 ambientes rosario" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <select value={searchDraft.category} onChange={(e) => setSearchDraft((prev) => ({ ...prev, category: e.target.value as "vehiculos" | "inmuebles" }))} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary">
              <option value="vehiculos">Vehiculos</option>
              <option value="inmuebles">Inmuebles</option>
            </select>
            <button
              onClick={() => {
                if (!searchDraft.label.trim()) return;
                setSavedSearches((prev) => [
                  {
                    id: `search-${Date.now()}`,
                    label: searchDraft.label.trim(),
                    category: searchDraft.category,
                    alerts: true,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                setSearchDraft({ label: "", category: "vehiculos" });
                setShowSearchForm(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <button className="flex items-center gap-1 text-muted-foreground text-sm font-semibold hover:bg-muted px-3 py-1.5 rounded-md border border-border"><LayoutGrid size={14}/> Todas <ChevronDown size={14}/></button>
        <span className="text-xs text-muted-foreground ml-4 font-medium italic">{savedSearches.length} resultados</span>
      </div>

      {savedSearches.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6 border border-border">
             <SearchCode size={32} className="text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Aun no tenes busquedas guardadas</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Aqui veras consultas frecuentes y podras administrar alertas para vehiculos e inmuebles.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedSearches.map((searchItem) => (
            <div key={searchItem.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">{searchItem.label}</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye size={14} /> {searchItem.category}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={14} /> {new Date(searchItem.createdAt).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSavedSearches((prev) => prev.map((entry) => entry.id === searchItem.id ? { ...entry, alerts: !entry.alerts } : entry))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${searchItem.alerts ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                >
                  {searchItem.alerts ? "Alertas activas" : "Activar alertas"}
                </button>
                <button onClick={() => setSavedSearches((prev) => prev.filter((entry) => entry.id !== searchItem.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VISTAS PREVIAMENTE DESARROLLADAS (MANTENIDAS) ---


  const renderNovedades = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-2"><h1 className="text-[26px] font-semibold text-foreground">Novedades</h1><button className="text-primary text-sm font-semibold hover:underline">Configurar notificaciones</button></div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex gap-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0"><Megaphone size={24} /></div>
        <div><div className="flex items-center gap-2 mb-1"><span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Importante</span><span className="text-xs text-muted-foreground font-medium">Hace 2 horas</span></div><h3 className="text-lg font-bold text-foreground mb-1.5">¡Te damos la bienvenida a Madsjeez!</h3><p className="text-[14px] text-muted-foreground mb-3 leading-relaxed">Estamos muy felices de que te sumes a nuestra plataforma. Aquí encontrarás todas las herramientas necesarias para potenciar tu negocio.</p><a href="#" className="text-primary text-sm font-semibold hover:underline">Ir a la Central de Aprendizaje</a></div>
      </div>
    </div>
  );

  const renderPublicaciones = () => <PublicacionesView />;

  const renderPosventa = () => (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Posventa</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"><div className="p-16 text-center text-muted-foreground bg-card">No hay actividad de posventa en {activePosventaTab}</div></div>
    </div>
  );

  const renderPreferenciasVenta = () => (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-4xl">
      <h1 className="text-[26px] font-semibold text-foreground mb-2">Preferencias de venta</h1>
      <section className="bg-card rounded-lg shadow-sm border border-border">
        <PreferenceItem title="Mis domicilios de envíos" subtitle="Gestioná tus domicilios de envíos." rightElement={null} />
        <PreferenceItem title="Mis horarios de colecta" subtitle="Consultá tus horarios para enviar tus ventas a tiempo." rightElement={null} />
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
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        {/* Header amarillo */}
        <div className="bg-muted py-10 text-center relative border-b border-border">
          <button onClick={() => setShowLiveMonitor(false)} className="absolute left-6 top-6 flex items-center gap-1 text-foreground font-bold hover:underline text-sm">
            <ChevronDown className="rotate-90" size={16}/> Volver a Métricas
          </button>
          <button onClick={() => setShowLiveMonitor(false)} className="absolute right-6 top-6 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow hover:bg-muted border border-border">
            <X size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-black text-foreground mb-8">Ventas de hoy en vivo</h1>
          <div className="bg-card rounded-full px-4 py-1.5 text-xs text-muted-foreground font-medium inline-flex items-center gap-1.5 shadow-sm mb-4 border border-border">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {dateStr}, {timeStr}
          </div>
          <div className="text-6xl font-black text-foreground">$ 570.803<span className="text-4xl">,20</span></div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto pt-8 px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Métricas clave */}
            <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Métricas clave</h3>
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
                    <div className="text-lg font-black text-foreground">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tendencias en ventas brutas */}
            <div className="lg:col-span-5 bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Tendencias en ventas brutas</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--border) 75%, transparent)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)} mil`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Line type="monotone" dataKey="hoy" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary)' }} name="Hoy" />
                  <Line type="monotone" dataKey="ayer" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} name="Ayer" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <span className="text-xs text-muted-foreground">Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  <span className="text-xs text-muted-foreground">Ayer</span>
                </div>
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="lg:col-span-4 bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Productos más vendidos</h3>
              <div className="space-y-3">
                {topProducts.map((p) => (
                  <div key={p.rank} className={`flex items-center gap-3 p-2.5 rounded-lg ${p.highlighted ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted'}`}>
                    <div className={`text-sm font-bold ${p.rank === 1 ? 'text-primary' : 'text-muted-foreground'} w-5 text-center`}>{p.rank}</div>
                    <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      <img src={p.img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Ventas del día: {p.price}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>Stock: {p.stock} {p.stockLabel || ''}</span>
                        <span>unidades</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">Experiencia de compra: {p.exp}</div>
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
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col relative">
      <header className="bg-[var(--shell-header-bg)] border-b border-[var(--shell-header-border)] py-2 px-4 shadow-sm z-50 relative flex-shrink-0 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--shell-header-bg)_88%,transparent)]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <RainbowLogo />
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground font-light bg-card/70 border border-border/60 rounded-full px-3 py-1.5">
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {currentUser?.image ? (
                  <img src={currentUser.image} alt={userData.name} className="w-5 h-5 rounded-full object-cover border border-border" />
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
            <button onClick={() => setActiveMenu('publicaciones')} className="hover:text-foreground transition-colors">Vender</button>
            <button onClick={() => setActiveMenu('ayuda')} className="hover:text-foreground transition-colors">Ayuda</button>
            <ThemeToneSwitcher compact />
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative hover:text-foreground p-0.5 transition-colors">
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
        <aside className="w-56 flex-shrink-0 bg-card/95 border-r border-border shadow-[inset_-1px_0_0_var(--border)]">
          <div className="py-6 px-0">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 px-4 text-foreground">
              <span className="grid grid-cols-2 gap-0.5"><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span><span className="w-2 h-2 bg-primary rounded-sm"></span></span>
              MI CUENTA
            </h2>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.isParent ? (
                    <>
                      <button onClick={() => item.setIsOpen(!item.isOpen)} className="w-full flex items-center justify-between py-2 px-4 hover:bg-primary/10 text-primary font-semibold transition-colors text-sm rounded-md">
                        <div className="flex items-center gap-3">{item.icon} {item.label}</div>
                        <ChevronDown size={16} className={`transform transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {item.isOpen && (
                        <div className="flex flex-col ml-4 mt-1 border-l-2 border-border/80 pl-4 gap-1">
                          {item.subItems.map(sub => (
                            <button key={sub.id} onClick={() => setActiveMenu(sub.id)} className={`text-left text-sm py-1.5 px-2 transition-colors flex items-center justify-between rounded-md ${activeMenu === sub.id ? 'text-primary font-bold bg-[var(--shell-sidebar-active-bg)] shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}>
                              <span>{sub.label}</span>
                              {(sub as any).rightIcon && (sub as any).rightIcon}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center justify-between py-2 px-4 font-medium transition-colors text-sm rounded-md ${activeMenu === item.id ? 'bg-[var(--shell-sidebar-active-bg)] text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}>
                      <div className="flex items-center gap-3">{item.icon || <LayoutGrid size={18}/>} {item.label}</div>
                    </button>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-6 px-4 pt-5 border-t border-border space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                Accesos rápidos (sitio)
              </p>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Home size={16} className="shrink-0 opacity-70" />
                Ir a la tienda
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ClipboardList size={16} className="shrink-0 opacity-70" />
                Mis pedidos / compras
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ShoppingCart size={16} className="shrink-0 opacity-70" />
                Carrito público
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <BarChart2 size={16} className="shrink-0 opacity-70" />
                Métricas detalladas (página)
              </Link>
              <Link
                href="/dashboard/live"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Activity size={16} className="shrink-0 opacity-70" />
                Monitor en vivo
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Bell size={16} className="shrink-0 opacity-70" />
                Notificaciones
              </Link>
              <Link
                href="/subscriptions"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Zap size={16} className="shrink-0 opacity-70" />
                Planes MADS+
              </Link>
              <Link
                href="/seller/register"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Store size={16} className="shrink-0 opacity-70" />
                Herramientas para vender
              </Link>
            </div>
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
            {activeMenu === 'tiendas-sigo' && renderTiendasSigo()}
            {activeMenu === 'vehiculos-interes' && renderVehiculosInteres()}
            {activeMenu === 'inmuebles-interes' && renderInmueblesInteres()}
            {activeMenu === 'busquedas-guardadas' && renderBusquedasGuardadas()}
            {activeMenu === 'perfil' && <ProfileView userData={currentUser || undefined} />}
            {activeMenu === 'carrito' && <CartView />}
            {activeMenu === 'ayuda' && <HelpView userData={currentUser || undefined} onNavigate={(section) => setActiveMenu(section)} />}
            {activeMenu === 'publicaciones' && <div className="-mx-4 lg:-mx-8">{renderPublicaciones()}</div>}
            {activeMenu === 'meli-sync' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
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
                  <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
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
          <div className="bg-card w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-border mb-4 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center shadow-sm">
              <h3 className="font-bold text-foreground text-[15px]">Asistente</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <button type="button" className="hover:bg-muted p-1.5 rounded-md transition-colors"><Maximize2 size={16}/></button>
                <button type="button" onClick={() => setIsAssistantOpen(false)} className="hover:bg-muted p-1.5 rounded-md transition-colors"><X size={18}/></button>
              </div>
            </div>
            <div className="p-5 h-[320px] bg-muted flex flex-col justify-end">
              <div className="flex items-center gap-3 text-muted-foreground bg-card px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-border self-start w-3/4">
                 <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"></span></div>
                 <span className="text-sm font-medium">Pensando...</span>
              </div>
            </div>
            <div className="p-4 bg-card border-t border-border">
              <div className="relative">
                <input type="text" placeholder="Preguntale al asistente..." className="w-full pl-4 pr-10 py-3 bg-muted rounded-full text-[13px] font-medium focus:outline-none focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all border border-transparent" />
                <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary"><ChevronUp size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES REUTILIZABLES ---
function PreferenceItem({
  title,
  subtitle,
  rightElement,
  hasBorder = true,
}: {
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
  hasBorder?: boolean;
}) {
  return (
    <div className={`p-5 flex items-center justify-between hover:bg-muted transition-colors cursor-pointer ${hasBorder ? 'border-b border-border' : ''}`}>
      <div><h4 className="text-[15px] text-foreground font-medium">{title}</h4>{subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}</div>
      {rightElement || <ChevronRight size={20} className="text-primary" />}
    </div>
  );
}

function TabButton({
  id,
  label,
  current,
  set,
}: {
  id: string;
  label: string;
  current: string;
  set: (id: string) => void;
}) {
  return (
    <button onClick={() => set(id)} className={`pb-3 px-1 transition-colors ${current === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
  );
}

function DropdownItem({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className="flex justify-between items-center px-4 py-2 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"><span>{text}</span></a>
  );
}
