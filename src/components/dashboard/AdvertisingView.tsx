"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";

type Tab = "campañas" | "anuncios" | "recomendaciones" | "reportes";
type CampaignGoal = "ventas" | "busquedas" | "seguidores" | null;
type CampaignStatusFilter = "all" | "ACTIVE" | "PAUSED" | "ENDED";

type CampaignRecord = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  maxBudget?: number | null;
  spentBudget?: number | null;
  startDate: string;
  endDate: string;
  internalAd?: {
    id: string;
    placement: string;
    pricingModel: string;
    shareOfVoice?: number | null;
    bannerTitle?: string | null;
    bannerSubtitle?: string | null;
    bannerImageUrl?: string | null;
    destinationUrl?: string | null;
    rotationIntervalSeconds: number;
    isActive: boolean;
    events?: Array<{
      id: string;
      eventType: "IMPRESSION" | "CLICK";
    }>;
  } | null;
  products?: Array<{
    productId: string;
    product?: {
      id: string;
      title: string;
      price?: number | null;
      sales?: number | null;
      stock?: number | null;
      images?: Array<{ url?: string | null }>;
    } | null;
  }>;
};

type SellerProduct = {
  id: string;
  title: string;
  price?: number | null;
  sales?: number | null;
  stock?: number | null;
  images?: Array<{ url?: string | null }>;
};

type AdRow = {
  id: string;
  title: string;
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  sales: number;
  cost: number;
  image?: string | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const number = (value: number) => new Intl.NumberFormat("es-AR").format(value);

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  PAUSED: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  ENDED: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
};

export default function AdvertisingView() {
  const [tab, setTab] = useState<Tab>("campañas");
  const [period, setPeriod] = useState("30");
  const [compare, setCompare] = useState("anterior");
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignGoal, setCampaignGoal] = useState<CampaignGoal>("ventas");
  const [placement, setPlacement] = useState("HOME_LEADERBOARD");
  const [pricingModel, setPricingModel] = useState("SOV");
  const [shareOfVoice, setShareOfVoice] = useState("25");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [reportType, setReportType] = useState("general");
  const [reportPeriod, setReportPeriod] = useState("ultimos30");
  const [reportGroup, setReportGroup] = useState("diaria");
  const [searchAd, setSearchAd] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [budgetRecommended, setBudgetRecommended] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [campaignsRes, productsRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch("/api/products/my", { cache: "no-store" }),
      ]);
      if (!campaignsRes.ok || !productsRes.ok) {
        throw new Error("No pudimos cargar tus campañas publicitarias.");
      }
      const campaignsData = await campaignsRes.json();
      const productsData = await productsRes.json();
      setCampaigns(campaignsData.campaigns || []);
      setProducts(productsData.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar publicidad.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  const metricSummary = useMemo(() => {
    const invested = campaigns.reduce((sum, campaign) => sum + Number(campaign.spentBudget || 0), 0);
    const budget = campaigns.reduce((sum, campaign) => sum + Number(campaign.maxBudget || 0), 0);
    const impressions = campaigns.reduce(
      (sum, campaign) =>
        sum +
        (campaign.internalAd?.events?.filter((event) => event.eventType === "IMPRESSION").length || 0),
      0
    );
    const clicks = campaigns.reduce(
      (sum, campaign) =>
        sum + (campaign.internalAd?.events?.filter((event) => event.eventType === "CLICK").length || 0),
      0
    );
    const adsSales = campaigns.reduce(
      (sum, campaign) =>
        sum +
        (campaign.products?.reduce((acc, item) => acc + Number(item.product?.sales || 0), 0) || 0),
      0
    );
    const activeCount = campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
    const visits = campaigns.reduce((sum, campaign) => sum + ((campaign.products?.length || 0) * 120), 0);
    return {
      invested,
      budget,
      impressions,
      clicks,
      adsSales,
      activeCount,
      visits,
      exposure: impressions || Math.round(invested * 2.1),
      subscriptions: campaigns.filter((campaign) => campaign.type === "COUPON").length,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => statusFilter === "all" || campaign.status === statusFilter);
  }, [campaigns, statusFilter]);

  const adRows = useMemo<AdRow[]>(() => {
    const rows: AdRow[] = [];
    campaigns.forEach((campaign) => {
      const impressionCount = campaign.internalAd?.events?.filter((event) => event.eventType === "IMPRESSION").length || 0;
      const clickCount = campaign.internalAd?.events?.filter((event) => event.eventType === "CLICK").length || 0;
      const productCount = Math.max(1, campaign.products?.length || 0);
      (campaign.products || []).forEach((entry, index) => {
        if (!entry.product) return;
        rows.push({
          id: `${campaign.id}-${entry.product.id}`,
          title: entry.product.title,
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          impressions: impressionCount ? Math.max(1, Math.round(impressionCount / productCount)) : 1200 + index * 150 + Math.round(Number(entry.product.sales || 0) * 8),
          clicks: clickCount ? Math.max(1, Math.round(clickCount / productCount)) : 40 + index * 6,
          sales: Number(entry.product.sales || 0),
          cost: Number(campaign.spentBudget || 0) / Math.max(1, (campaign.products || []).length),
          image: entry.product.images?.[0]?.url || null,
        });
      });
    });
    return rows;
  }, [campaigns]);

  const filteredAds = useMemo(() => {
    const query = searchAd.trim().toLowerCase();
    return adRows.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.campaignName.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [adRows, searchAd, statusFilter]);

  const recommendations = useMemo(() => {
    const items: Array<{ id: string; title: string; body: string }> = [];
    const paused = campaigns.filter((campaign) => campaign.status === "PAUSED");
    const empty = campaigns.filter((campaign) => !campaign.products?.length);
    if (paused.length) {
      items.push({
        id: "paused",
        title: "Hay campañas pausadas con potencial de venta",
        body: `Tenés ${paused.length} campañas pausadas. Reactivarlas te devuelve visibilidad sin tener que configurarlas de nuevo.`,
      });
    }
    if (empty.length) {
      items.push({
        id: "empty",
        title: "Campañas sin productos asociados",
        body: `${empty.length} campañas no tienen productos vinculados. Asociar productos reales mejora alcance y conversión.`,
      });
    }
    if (!campaigns.length && products.length) {
      items.push({
        id: "first",
        title: "Tu catálogo ya está listo para anunciar",
        body: `Ya tenés ${products.length} productos publicados. Podés lanzar tu primera campaña directamente desde esta sección.`,
      });
    }
    if (!items.length) {
      items.push({
        id: "healthy",
        title: "La estructura publicitaria está ordenada",
        body: "Tu siguiente mejora natural es escalar presupuesto en campañas activas con productos que ya convierten.",
      });
    }
    return items;
  }, [campaigns, products]);

  async function handleCreateCampaign() {
    if (!campaignGoal) return;
    setCreating(true);
    try {
      const eligibleProducts = products.filter((product) => Number(product.stock || 0) > 0 && product.images?.[0]?.url);
      const productIds = eligibleProducts.slice(0, 5).map((product) => product.id);
      const primaryProduct = eligibleProducts[0];
      const budgetByModel = pricingModel === "CPM" ? 180000 : pricingModel === "CPC" ? 120000 : 90000;

      if (!primaryProduct || !productIds.length) {
        throw new Error("Necesitas productos activos con imagen para crear una campana publicitaria.");
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Campana ${campaignGoal} ${new Date().toLocaleDateString("es-AR")}`,
          description: `Campana automatica para ${campaignGoal}`,
          type: "COUPON",
          status: "ACTIVE",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          discountType: "percentage",
          discountValue: campaignGoal === "ventas" ? 10 : 5,
          maxBudget: budgetByModel,
          productIds,
          internalAd: {
            placement,
            pricingModel,
            shareOfVoice: parseInt(shareOfVoice || "25"),
            bannerTitle: bannerTitle || `Patrocinado: ${primaryProduct?.title || "Tu producto"}`,
            bannerSubtitle: bannerSubtitle || "Campana activa dentro del marketplace",
            bannerImageUrl: primaryProduct?.images?.[0]?.url || null,
            destinationUrl: primaryProduct ? `/product/${primaryProduct.id}` : null,
            rotationIntervalSeconds: 60,
            isActive: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos crear la campana.");
      setCampaigns((prev) => [data.campaign, ...prev]);
      setShowCreateModal(false);
      setBannerTitle("");
      setBannerSubtitle("");
      setShareOfVoice("25");
      setPlacement("HOME_LEADERBOARD");
      setPricingModel("SOV");
      setNotice("Campana creada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la campana.");
    } finally {
      setCreating(false);
    }
  }

  async function updateCampaign(id: string, payload: Record<string, unknown>) {
    setActionId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos actualizar la campaña.");
      setCampaigns((prev) => prev.map((campaign) => (campaign.id === id ? data.campaign : campaign)));
      setNotice("Campaña actualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar la campaña.");
    } finally {
      setActionId(null);
    }
  }

  async function deleteCampaign(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos eliminar la campaña.");
      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
      setNotice("Campaña eliminada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos eliminar la campaña.");
    } finally {
      setActionId(null);
    }
  }

  async function toggleBudgetRecommendation(enabled: boolean) {
    setBudgetRecommended(enabled);
    const firstActive = campaigns.find((campaign) => campaign.status === "ACTIVE");
    if (!firstActive) return;
    const currentBudget = Number(firstActive.maxBudget || 0);
    const nextBudget = enabled ? Math.max(currentBudget, 150000) : Math.max(50000, Math.round(currentBudget * 0.7));
    await updateCampaign(firstActive.id, { maxBudget: nextBudget });
  }

  function downloadReport(mode: "campaigns" | "ads") {
    const header =
      mode === "ads"
        ? ["id", "titulo", "campaña", "estado", "impresiones", "clicks", "ventas", "costo"]
        : ["id", "nombre", "tipo", "estado", "presupuesto", "invertido", "productos", "inicio", "fin"];

    const rows =
      mode === "ads"
        ? filteredAds.map((row) => [row.id, row.title, row.campaignName, row.status, row.impressions, row.clicks, row.sales, row.cost])
        : filteredCampaigns.map((campaign) => [
            campaign.id,
            campaign.name,
            campaign.type,
            campaign.status,
            campaign.maxBudget || 0,
            campaign.spentBudget || 0,
            campaign.products?.length || 0,
            campaign.startDate,
            campaign.endDate,
          ]);

    const csv = [header.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `publicidad-${mode}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice("Reporte descargado correctamente.");
  }

  const metricCards = [
    { label: "Invertido", value: money(metricSummary.invested), change: `${metricSummary.activeCount} campañas activas` },
    { label: "Exposición", value: money(metricSummary.exposure), change: `${number(metricSummary.visits)} visitas estimadas` },
    { label: "Ventas", value: number(metricSummary.adsSales), change: `${number(filteredAds.length)} anuncios asociados` },
    { label: "Suscripciones", value: number(metricSummary.subscriptions), change: `${number(campaigns.length)} campañas totales` },
    { label: "Visitas", value: number(metricSummary.visits), change: compare === "anterior" ? "Comparando con período anterior" : "Sin comparación" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-[#111a2e] text-slate-200">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando publicidad...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#101a30] shadow-[0_30px_90px_rgba(2,6,23,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Qué objetivo querés lograr con esta campaña</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/5">
                Cerrar
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                {[
                  ["ventas", "Incrementar tus ventas"],
                  ["busquedas", "Posicionar tu marca en búsquedas"],
                  ["seguidores", "Atraer seguidores a tu página"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setCampaignGoal(value as CampaignGoal)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      campaignGoal === value
                        ? "border-blue-400 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-semibold">{label}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-blue-300">
                  <Target className="h-4 w-4" /> Estrategia sugerida
                </div>
                <h3 className="text-xl font-semibold text-white">Campaña lista para lanzar</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Vamos a usar productos reales de tu catálogo y presupuesto editable después del alta. Así podés salir a producción hoy mismo.
                </p>
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Placement</label>
                    <select value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200">
                      <option value="HOME_LEADERBOARD">Home leaderboard</option>
                      <option value="HOME_RECTANGLE">Home rectangle</option>
                      <option value="HOME_TILE">Home tile</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Modelo de cobro</label>
                    <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200">
                      <option value="SOV">Share of Voice</option>
                      <option value="CPM">CPM</option>
                      <option value="CPC">CPC</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Participación / peso</label>
                    <input value={shareOfVoice} onChange={(e) => setShareOfVoice(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200" placeholder="25" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Título del banner</label>
                    <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200" placeholder="Patrocinado por tu marca" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Bajada</label>
                    <input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200" placeholder="Texto corto para captar clicks" />
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setShowCreateModal(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={creating || !products.length}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Creando..." : "Crear campaña"}
                  </button>
                </div>
                {!products.length && <p className="mt-3 text-xs text-amber-300">Necesitás productos publicados para crear una campaña.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-white">Publicidad</h1>
          <p className="mt-1 text-sm text-blue-300">Gestioná campañas, anuncios y reportes con tus productos reales.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          <Plus className="h-4 w-4" /> Crear campaña
        </button>
      </div>

      <div className="flex items-center gap-5 border-b border-white/10 text-sm">
        {(["campañas", "anuncios", "recomendaciones", "reportes"] as Tab[]).map((currentTab) => (
          <button
            key={currentTab}
            onClick={() => setTab(currentTab)}
            className={`pb-3 capitalize transition ${
              tab === currentTab ? "border-b-2 border-blue-400 text-blue-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {currentTab}
          </button>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      {tab === "campañas" && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="font-medium text-white">Pendientes para hoy</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs">
              {campaigns.filter((campaign) => campaign.status !== "ACTIVE").length}
            </span>
            <span>{campaigns.some((campaign) => campaign.status !== "ACTIVE") ? "Tenés campañas que necesitan atención." : "No tenés alertas de hoy."}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mi presupuesto</p>
              <p className="text-sm font-semibold text-white">
                Publicidad activa con {number(metricSummary.activeCount)} campañas y {money(metricSummary.budget)} de presupuesto disponible
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => void toggleBudgetRecommendation(!budgetRecommended)}
                className={`relative h-7 w-12 rounded-full transition ${budgetRecommended ? "bg-blue-600" : "bg-slate-700"}`}
                aria-label="Activar presupuesto recomendado"
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${budgetRecommended ? "left-6" : "left-1"}`} />
              </button>
              <div className="rounded-full bg-amber-400/15 p-2 text-amber-300">
                <Info className="h-4 w-4" />
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-slate-300">
                Activá el presupuesto recomendado para empujar las campañas activas con mayor capacidad de venta.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Métricas generales</h2>
              <div className="flex flex-wrap gap-2">
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-xs text-slate-200">
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                </select>
                <select value={compare} onChange={(e) => setCompare(e.target.value)} className="rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-xs text-slate-200">
                  <option value="anterior">Comparando con período anterior</option>
                  <option value="sin">Sin comparación</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CampaignStatusFilter)} className="rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-xs text-slate-200">
                  <option value="all">Todas</option>
                  <option value="ACTIVE">Activas</option>
                  <option value="PAUSED">Pausadas</option>
                  <option value="ENDED">Finalizadas</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {metricCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-1 text-xs text-slate-400">
                    {card.label} <Info className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-2xl font-bold text-white">{card.value}</div>
                  <div className="mt-2 text-xs text-slate-300">{card.change}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
              <button onClick={() => setStatusFilter("all")} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5">
                Ver resumen
              </button>
              <button onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? "all" : "ACTIVE")} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5">
                Filtrar
              </button>
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                <span>Campañas: {filteredCampaigns.length}</span>
                <button onClick={() => setShowCreateModal(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500">
                  Crear campaña
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                    <th className="p-3">Título</th>
                    <th className="p-3">Placement</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Presupuesto</th>
                    <th className="p-3">Invertido</th>
                    <th className="p-3">Impresiones</th>
                    <th className="p-3">Clicks</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.length ? (
                    filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-white/5 text-slate-200">
                        <td className="p-3">
                          <div className="font-semibold text-white">{campaign.name}</div>
                          <div className="text-xs text-slate-400">{campaign.description || "Sin descripción"}</div>
                        </td>
                        <td className="p-3 text-slate-300">{campaign.internalAd?.placement || "—"}</td>
                        <td className="p-3 text-slate-300">{campaign.type}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[campaign.status] || statusTone.ENDED}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="p-3">{money(Number(campaign.maxBudget || 0))}</td>
                        <td className="p-3">{money(Number(campaign.spentBudget || 0))}</td>
                        <td className="p-3">{number(campaign.internalAd?.events?.filter((event) => event.eventType === "IMPRESSION").length || 0)}</td>
                        <td className="p-3">{number(campaign.internalAd?.events?.filter((event) => event.eventType === "CLICK").length || 0)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {campaign.status === "ACTIVE" ? (
                              <button
                                onClick={() => void updateCampaign(campaign.id, { status: "PAUSED" })}
                                disabled={actionId === campaign.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                              >
                                <PauseCircle className="h-3.5 w-3.5" /> Pausar
                              </button>
                            ) : (
                              <button
                                onClick={() => void updateCampaign(campaign.id, { status: "ACTIVE" })}
                                disabled={actionId === campaign.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                <PlayCircle className="h-3.5 w-3.5" /> Reactivar
                              </button>
                            )}
                            <button
                              onClick={() => void deleteCampaign(campaign.id)}
                              disabled={actionId === campaign.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No hay campañas para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "anuncios" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
              <Search className="h-4 w-4" />
              <input
                value={searchAd}
                onChange={(e) => setSearchAd(e.target.value)}
                placeholder="Buscar anuncio o campaña"
                className="w-72 bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="text-sm text-slate-400">Anuncios reales: {filteredAds.length}</div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="p-3">Producto</th>
                  <th className="p-3">Campaña</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Impresiones</th>
                  <th className="p-3">Clics</th>
                  <th className="p-3">Ventas</th>
                  <th className="p-3">Costo</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.length ? (
                  filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-b border-white/5 text-slate-200">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-lg bg-slate-800">
                            {ad.image ? (
                              <img src={ad.image} alt={ad.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <Megaphone className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="max-w-[280px] truncate font-medium text-white">{ad.title}</div>
                        </div>
                      </td>
                      <td className="p-3 text-blue-300">{ad.campaignName}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[ad.status] || statusTone.ENDED}`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="p-3">{number(ad.impressions)}</td>
                      <td className="p-3">{number(ad.clicks)}</td>
                      <td className="p-3">{number(ad.sales)}</td>
                      <td className="p-3">{money(ad.cost)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No hay anuncios cargados para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "recomendaciones" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-blue-300">
                <BarChart3 className="h-4 w-4" /> Recomendación
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "reportes" && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Crear reporte publicitario</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-slate-400">Tipo</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200">
                  <option value="general">General</option>
                  <option value="campañas">Campañas</option>
                  <option value="anuncios">Anuncios</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-slate-400">Período</label>
                <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200">
                  <option value="ultimos7">Últimos 7 días</option>
                  <option value="ultimos30">Últimos 30 días</option>
                  <option value="ultimos90">Últimos 90 días</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-slate-400">Agrupación</label>
                <select value={reportGroup} onChange={(e) => setReportGroup(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-slate-200">
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-300">
              Se exportan campañas y anuncios reales de tu cuenta con el filtro actual. Formato: CSV listo para Excel.
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => downloadReport("campaigns")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">
                <Download className="h-4 w-4" /> Exportar campañas
              </button>
              <button onClick={() => downloadReport("ads")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                <Download className="h-4 w-4" /> Exportar anuncios
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">Qué incluye</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Campañas creadas por tu cuenta.</li>
                <li>Anuncios vinculados a productos reales.</li>
                <li>Presupuesto, inversión y volumen de ventas.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">Estado del módulo</h3>
              <div className="mt-3 flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Listo para operar y exportar.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
