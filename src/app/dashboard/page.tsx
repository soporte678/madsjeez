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

type PostSaleCase = {
  id: string;
  title: string;
  orderRef: string;
  buyer: string;
  reason: string;
  type: "reclamos" | "devoluciones" | "mediaciones";
  status: "abierto" | "en_revision" | "resuelto";
  createdAt: string;
};

type CatalogProductItem = {
  id: string;
  title: string;
  sku: string;
  brand: string;
  status: "sugerido" | "vinculado" | "pausado";
  stock: string;
  price: string;
  updatedAt: string;
};

type ShippingAddressItem = {
  id: string;
  label: string;
  address: string;
  city: string;
  active: boolean;
};

type PickupScheduleItem = {
  id: string;
  day: string;
  range: string;
  enabled: boolean;
};

type LearningResourceItem = {
  id: string;
  title: string;
  category: "ventas" | "logistica" | "catalogo" | "marketing";
  level: "base" | "intermedio" | "pro";
  summary: string;
  completed: boolean;
};

const VEHICLE_INTERESTS_KEY = "madsjeez_dashboard_vehicle_interests";
const PROPERTY_INTERESTS_KEY = "madsjeez_dashboard_property_interests";
const SAVED_SEARCHES_KEY = "madsjeez_dashboard_saved_searches";
const POSTSALE_CASES_KEY = "madsjeez_dashboard_postsale_cases";
const CATALOG_PRODUCTS_KEY = "madsjeez_dashboard_catalog_products";
const SHIPPING_ADDRESSES_KEY = "madsjeez_dashboard_shipping_addresses";
const PICKUP_SCHEDULES_KEY = "madsjeez_dashboard_pickup_schedules";
const EXPRESS_ENABLED_KEY = "madsjeez_dashboard_express_enabled";
const LEARNING_RESOURCES_KEY = "madsjeez_dashboard_learning_resources";

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
  const [postSaleCases, setPostSaleCases] = useState<PostSaleCase[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductItem[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddressItem[]>([]);
  const [pickupSchedules, setPickupSchedules] = useState<PickupScheduleItem[]>([]);
  const [expressEnabled, setExpressEnabled] = useState(false);
  const [learningResources, setLearningResources] = useState<LearningResourceItem[]>([]);
  const [vehicleDraft, setVehicleDraft] = useState({ title: "", location: "", price: "", note: "" });
  const [propertyDraft, setPropertyDraft] = useState({ title: "", location: "", price: "", note: "" });
  const [searchDraft, setSearchDraft] = useState({ label: "", category: "vehiculos" as "vehiculos" | "inmuebles" });
  const [catalogDraft, setCatalogDraft] = useState({ title: "", sku: "", brand: "", stock: "", price: "" });
  const [addressDraft, setAddressDraft] = useState({ label: "", address: "", city: "" });
  const [postSaleDraft, setPostSaleDraft] = useState({
    title: "",
    orderRef: "",
    buyer: "",
    reason: "",
    type: "reclamos" as "reclamos" | "devoluciones" | "mediaciones",
  });
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [showPostSaleForm, setShowPostSaleForm] = useState(false);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [learningQuery, setLearningQuery] = useState("");
  
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
      const rawPostSale = localStorage.getItem(POSTSALE_CASES_KEY);
      const rawCatalog = localStorage.getItem(CATALOG_PRODUCTS_KEY);
      const rawAddresses = localStorage.getItem(SHIPPING_ADDRESSES_KEY);
      const rawSchedules = localStorage.getItem(PICKUP_SCHEDULES_KEY);
      const rawExpress = localStorage.getItem(EXPRESS_ENABLED_KEY);
      const rawLearning = localStorage.getItem(LEARNING_RESOURCES_KEY);
      if (rawVehicles) setVehicleInterests(JSON.parse(rawVehicles));
      if (rawProperties) setPropertyInterests(JSON.parse(rawProperties));
      if (rawSearches) setSavedSearches(JSON.parse(rawSearches));
      if (rawPostSale) setPostSaleCases(JSON.parse(rawPostSale));
      if (rawCatalog) setCatalogProducts(JSON.parse(rawCatalog));
      if (rawAddresses) setShippingAddresses(JSON.parse(rawAddresses));
      if (rawSchedules) setPickupSchedules(JSON.parse(rawSchedules));
      if (rawExpress) setExpressEnabled(rawExpress === "true");
      if (rawLearning) {
        setLearningResources(JSON.parse(rawLearning));
      } else {
        setLearningResources([
          { id: "lr-1", title: "Optimizar publicaciones para vender más", category: "ventas", level: "base", summary: "Checklist para mejorar título, precio, fotos y conversión.", completed: false },
          { id: "lr-2", title: "Configurar logística y tiempos de despacho", category: "logistica", level: "intermedio", summary: "Buenas prácticas para envíos, horarios de colecta y SLA.", completed: false },
          { id: "lr-3", title: "Subir productos al catálogo con criterio", category: "catalogo", level: "intermedio", summary: "Cómo ordenar fichas, SKU y marcas para escalar catálogo.", completed: true },
          { id: "lr-4", title: "Campañas para mover stock lento", category: "marketing", level: "pro", summary: "Acciones comerciales para recuperar publicaciones con baja rotación.", completed: false },
        ]);
      }
      if (!rawAddresses) {
        setShippingAddresses([
          { id: "addr-1", label: "Depósito central", address: "Av. Circunvalación 1550", city: "Rosario", active: true },
        ]);
      }
      if (!rawSchedules) {
        setPickupSchedules([
          { id: "sch-1", day: "Lunes a viernes", range: "09:00 a 18:00", enabled: true },
          { id: "sch-2", day: "Sábados", range: "09:00 a 13:00", enabled: false },
        ]);
      }
      if (!rawCatalog) {
        setCatalogProducts([
          { id: "cat-1", title: "Kit carburador premium", sku: "MDS-CARB-01", brand: "MadsJeez", status: "sugerido", stock: "14", price: "58990", updatedAt: new Date().toISOString() },
          { id: "cat-2", title: "Repuesto bujía 2T", sku: "MDS-BUJ-02", brand: "MadsJeez", status: "vinculado", stock: "22", price: "3200", updatedAt: new Date().toISOString() },
        ]);
      }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(POSTSALE_CASES_KEY, JSON.stringify(postSaleCases));
  }, [postSaleCases]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CATALOG_PRODUCTS_KEY, JSON.stringify(catalogProducts));
  }, [catalogProducts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SHIPPING_ADDRESSES_KEY, JSON.stringify(shippingAddresses));
  }, [shippingAddresses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PICKUP_SCHEDULES_KEY, JSON.stringify(pickupSchedules));
  }, [pickupSchedules]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(EXPRESS_ENABLED_KEY, String(expressEnabled));
  }, [expressEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LEARNING_RESOURCES_KEY, JSON.stringify(learningResources));
  }, [learningResources]);

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
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Posventa</h1>
          <p className="mt-2 text-sm text-muted-foreground">Registra reclamos, devoluciones y mediaciones para hacer seguimiento sin perder el estado de cada caso.</p>
        </div>
        <button onClick={() => setShowPostSaleForm((prev) => !prev)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
          <Plus size={16} />
          Crear caso
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["reclamos", "devoluciones", "mediaciones"] as const).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setActivePosventaTab(tabId)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activePosventaTab === tabId
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tabId}
          </button>
        ))}
      </div>

      {showPostSaleForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={postSaleDraft.title} onChange={(e) => setPostSaleDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titulo del caso" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={postSaleDraft.orderRef} onChange={(e) => setPostSaleDraft((prev) => ({ ...prev, orderRef: e.target.value }))} placeholder="Pedido o referencia" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={postSaleDraft.buyer} onChange={(e) => setPostSaleDraft((prev) => ({ ...prev, buyer: e.target.value }))} placeholder="Comprador" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <select value={postSaleDraft.type} onChange={(e) => setPostSaleDraft((prev) => ({ ...prev, type: e.target.value as "reclamos" | "devoluciones" | "mediaciones" }))} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary">
              <option value="reclamos">Reclamo</option>
              <option value="devoluciones">Devolucion</option>
              <option value="mediaciones">Mediacion</option>
            </select>
          </div>
          <textarea value={postSaleDraft.reason} onChange={(e) => setPostSaleDraft((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Describe el motivo y el siguiente paso esperado" className="mt-3 min-h-[90px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                if (!postSaleDraft.title.trim()) return;
                setPostSaleCases((prev) => [
                  {
                    id: `psc-${Date.now()}`,
                    title: postSaleDraft.title.trim(),
                    orderRef: postSaleDraft.orderRef.trim(),
                    buyer: postSaleDraft.buyer.trim(),
                    reason: postSaleDraft.reason.trim(),
                    type: postSaleDraft.type,
                    status: "abierto",
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                setPostSaleDraft({ title: "", orderRef: "", buyer: "", reason: "", type: "reclamos" });
                setShowPostSaleForm(false);
                setActivePosventaTab(postSaleDraft.type);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Guardar caso
            </button>
            <button onClick={() => setShowPostSaleForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {postSaleCases.filter((item) => item.type === activePosventaTab).length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-16 text-center text-muted-foreground bg-card">No hay actividad de posventa en {activePosventaTab}</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {postSaleCases
            .filter((item) => item.type === activePosventaTab)
            .map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {item.orderRef && <span>Pedido: {item.orderRef}</span>}
                      {item.buyer && <span>Comprador: {item.buyer}</span>}
                      <span>{new Date(item.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    {item.reason && <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["abierto", "en_revision", "resuelto"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setPostSaleCases((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, status } : entry))}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.status === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                      >
                        {status}
                      </button>
                    ))}
                    <button onClick={() => setPostSaleCases((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
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

  const renderPreferenciasVenta = () => (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground mb-2">Preferencias de venta</h1>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mis domicilios de env?os</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gestion? direcciones operativas para despachar sin fricci?n.</p>
          </div>
          <button onClick={() => setShowAddressForm((prev) => !prev)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
            <Plus size={16} className="inline mr-1" />
            Agregar domicilio
          </button>
        </div>

        {showAddressForm && (
          <div className="mt-5 grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3">
            <input value={addressDraft.label} onChange={(e) => setAddressDraft((prev) => ({ ...prev, label: e.target.value }))} placeholder="Nombre del domicilio" className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={addressDraft.address} onChange={(e) => setAddressDraft((prev) => ({ ...prev, address: e.target.value }))} placeholder="Direcci?n" className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={addressDraft.city} onChange={(e) => setAddressDraft((prev) => ({ ...prev, city: e.target.value }))} placeholder="Ciudad" className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <div className="md:col-span-3 flex gap-3">
              <button
                onClick={() => {
                  if (!addressDraft.label.trim() || !addressDraft.address.trim()) return;
                  setShippingAddresses((prev) => [
                    ...prev.map((item) => ({ ...item, active: false })),
                    { id: `addr-${Date.now()}`, label: addressDraft.label.trim(), address: addressDraft.address.trim(), city: addressDraft.city.trim(), active: prev.length === 0 },
                  ]);
                  setAddressDraft({ label: "", address: "", city: "" });
                  setShowAddressForm(false);
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                Guardar domicilio
              </button>
              <button onClick={() => setShowAddressForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          {shippingAddresses.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{item.label}</h3>
                  {item.active && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Activo</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.address}{item.city ? `, ${item.city}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShippingAddresses((prev) => prev.map((entry) => ({ ...entry, active: entry.id === item.id })))} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                  Usar para despachar
                </button>
                <button onClick={() => setShippingAddresses((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-md px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Mis horarios de colecta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Defin? qu? franjas usa tu operaci?n para despachar a tiempo.</p>
          </div>
          <div className="space-y-3">
            {pickupSchedules.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-foreground">{item.day}</div>
                  <div className="text-sm text-muted-foreground">{item.range}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPickupSchedules((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, enabled: !entry.enabled } : entry))} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>
                    {item.enabled ? "Activo" : "Pausado"}
                  </button>
                  <button onClick={() => setPickupSchedules((prev) => prev.filter((entry) => entry.id !== item.id))} className="text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-md px-2 py-1 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPickupSchedules((prev) => [...prev, { id: `sch-${Date.now()}`, day: "Nuevo bloque", range: "10:00 a 16:00", enabled: true }])}
              className="rounded-md border border-dashed border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Agregar horario r?pido
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Env?os Express</h2>
            <p className="mt-1 text-sm text-muted-foreground">Activ? log?stica prioritaria para productos listos para rotar r?pido.</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-foreground">Madsjeez Hub</div>
                <div className="text-sm text-muted-foreground">Guardamos y despachamos stock desde un nodo central.</div>
              </div>
              <button onClick={() => setExpressEnabled((prev) => !prev)} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${expressEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>
                {expressEnabled ? "Activo" : "Desactivado"}
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>? Mejora tiempos de preparaci?n y exposici?n log?stica.</p>
              <p>? Ideal para productos con stock estable.</p>
              <p>? Se puede apagar sin tocar publicaciones activas.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderProductosCatalogo = () => (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground">Productos de cat?logo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Orden? tu base, vincul? fichas y dej? trazabilidad de SKU, marca y estado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "sugerencias", label: "Sugeridos" },
            { id: "vinculados", label: "Vinculados" },
            { id: "pausados", label: "Pausados" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveCatalogoTab(tab.id)} className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeCatalogoTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>
              {tab.label}
            </button>
          ))}
          <button onClick={() => setShowCatalogForm((prev) => !prev)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
            <Plus size={16} className="inline mr-1" />
            Nuevo producto
          </button>
        </div>
      </div>

      {showCatalogForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input value={catalogDraft.title} onChange={(e) => setCatalogDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="T?tulo" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={catalogDraft.sku} onChange={(e) => setCatalogDraft((prev) => ({ ...prev, sku: e.target.value }))} placeholder="SKU" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={catalogDraft.brand} onChange={(e) => setCatalogDraft((prev) => ({ ...prev, brand: e.target.value }))} placeholder="Marca" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={catalogDraft.stock} onChange={(e) => setCatalogDraft((prev) => ({ ...prev, stock: e.target.value }))} placeholder="Stock" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
            <input value={catalogDraft.price} onChange={(e) => setCatalogDraft((prev) => ({ ...prev, price: e.target.value }))} placeholder="Precio" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                if (!catalogDraft.title.trim() || !catalogDraft.sku.trim()) return;
                setCatalogProducts((prev) => [
                  {
                    id: `cp-${Date.now()}`,
                    title: catalogDraft.title.trim(),
                    sku: catalogDraft.sku.trim(),
                    brand: catalogDraft.brand.trim(),
                    stock: catalogDraft.stock.trim(),
                    price: catalogDraft.price.trim(),
                    status: "sugerido",
                    updatedAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
                setCatalogDraft({ title: "", sku: "", brand: "", stock: "", price: "" });
                setShowCatalogForm(false);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Guardar producto
            </button>
            <button onClick={() => setShowCatalogForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {catalogProducts
          .filter((item) => activeCatalogoTab === "sugerencias" ? item.status === "sugerido" : activeCatalogoTab === "vinculados" ? item.status === "vinculado" : item.status === "pausado")
          .map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{item.sku}</span>
                    {item.brand && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.brand}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Stock: {item.stock || "s/d"}</span>
                    <span>Precio: {item.price || "s/d"}</span>
                    <span>Actualizado: {new Date(item.updatedAt).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["sugerido", "vinculado", "pausado"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setCatalogProducts((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.status === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {status}
                    </button>
                  ))}
                  <button onClick={() => setCatalogProducts((prev) => prev.filter((entry) => entry.id !== item.id))} className="rounded-full px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderCentralAprendizaje = () => {
    const filteredResources = learningResources.filter((item) => {
      const query = learningQuery.trim().toLowerCase();
      if (!query) return true;
      return [item.title, item.summary, item.category, item.level].some((value) => value.toLowerCase().includes(query));
    });

    return (
      <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-[26px] font-semibold text-foreground">Central de aprendizaje</h1>
          <p className="mt-2 text-sm text-muted-foreground">Recursos cortos y accionables para mejorar operaci?n, cat?logo, log?stica y conversi?n.</p>
          <div className="mt-4 relative max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={learningQuery} onChange={(e) => setLearningQuery(e.target.value)} placeholder="Buscar gu?a, tema o nivel" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredResources.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{item.level}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <button onClick={() => setLearningResources((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry))} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${item.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>
                  {item.completed ? "Completado" : "Marcar le?do"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            {activeMenu === 'productos-catalogo' && renderProductosCatalogo()}
            {activeMenu === 'preferencias-venta' && renderPreferenciasVenta()}
            {activeMenu === 'central-aprendizaje' && renderCentralAprendizaje()}
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
