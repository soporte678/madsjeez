"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SELLER_PUBLICATION_QUERY,
  SELLER_PUBLICATION_SORT_OPTIONS,
  type SellerPublicationFlags,
  type SellerPublicationQuery,
  type SellerPublicationsSort,
} from "@/lib/dashboard/seller-publications-query";

type CategoryOption = { id: string; name: string; count: number };

type FlagRow = { id: string; label: string; key: keyof SellerPublicationFlags };

const RECOMMENDED: FlagRow[] = [
  { id: "active", label: "Activas", key: "active" },
  { id: "paused", label: "Inactivas / pausadas", key: "paused" },
  { id: "noStock", label: "Sin stock", key: "noStock" },
  { id: "freeShip", label: "Envío gratis", key: "freeShip" },
  { id: "buyerShip", label: "Envío a cargo del comprador", key: "buyerShip" },
  { id: "lowStock", label: "Stock bajo (1–5 unidades)", key: "lowStock" },
  { id: "noSales", label: "Sin ventas", key: "noSales" },
  { id: "lowQuality", label: "Calidad por mejorar (<40)", key: "lowQuality" },
  { id: "highPrice", label: "Con precio promocional (compare > venta)", key: "highPrice" },
];

const PRODUCT_DATA: FlagRow[] = [
  { id: "newProd", label: "Nuevo", key: "newProd" },
  { id: "usedProd", label: "Usado / reacondicionado", key: "usedProd" },
];

function cloneQuery(q: SellerPublicationQuery): SellerPublicationQuery {
  return {
    sort: q.sort,
    categoryIds: [...q.categoryIds],
    flags: { ...q.flags },
  };
}

function SectionSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FilterCheckboxGrid({
  rows,
  flags,
  onToggle,
  search,
}: {
  rows: FlagRow[];
  flags: SellerPublicationFlags;
  onToggle: (key: keyof SellerPublicationFlags, v: boolean) => void;
  search: string;
}) {
  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? rows.filter((r) => r.label.toLowerCase().includes(q)) : rows),
    [rows, q]
  );
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No hay coincidencias.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {visible.map((row) => (
        <label
          key={row.id}
          className="flex items-start gap-2 rounded-md border border-transparent px-1 py-1.5 hover:bg-slate-50 cursor-pointer"
        >
          <Checkbox
            checked={flags[row.key]}
            onCheckedChange={(c) => onToggle(row.key, c === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug">{row.label}</span>
        </label>
      ))}
    </div>
  );
}

const SORT_GROUPS = [...new Set(SELLER_PUBLICATION_SORT_OPTIONS.map((o) => o.group))];

export function PublicationsFilterModal({
  open,
  onOpenChange,
  applied,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applied: SellerPublicationQuery;
  onApply: (q: SellerPublicationQuery) => void;
}) {
  const [draft, setDraft] = useState<SellerPublicationQuery>(() => cloneQuery(applied));
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [needleReco, setNeedleReco] = useState("");
  const [needleEstado, setNeedleEstado] = useState("");
  const [needleStock, setNeedleStock] = useState("");
  const [needleEnvio, setNeedleEnvio] = useState("");
  const [needleProd, setNeedleProd] = useState("");
  const [needleCat, setNeedleCat] = useState("");

  useEffect(() => {
    if (open) setDraft(cloneQuery(applied));
  }, [open, applied]);

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch("/api/dashboard/products/filter-options", { credentials: "include" });
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadCategories();
  }, [open, loadCategories]);

  const setFlag = (key: keyof SellerPublicationFlags, v: boolean) => {
    setDraft((d) => ({ ...d, flags: { ...d.flags, [key]: v } }));
  };

  const toggleCategory = (id: string, checked: boolean) => {
    setDraft((d) => {
      const set = new Set(d.categoryIds);
      if (checked) set.add(id);
      else set.delete(id);
      return { ...d, categoryIds: [...set] };
    });
  };

  const estadoRows: FlagRow[] = useMemo(
    () => [
      { id: "e_active", label: "Activas", key: "active" },
      { id: "e_paused", label: "Pausadas / inactivas", key: "paused" },
      { id: "e_no_stock", label: "Sin stock", key: "noStock" },
      { id: "e_no_sales", label: "Sin ventas", key: "noSales" },
    ],
    []
  );

  const stockRows: FlagRow[] = useMemo(
    () => [
      { id: "s_no", label: "Sin stock en tu depósito", key: "noStock" },
      { id: "s_low", label: "Stock bajo (1–5)", key: "lowStock" },
    ],
    []
  );

  const envioRows: FlagRow[] = useMemo(
    () => [
      { id: "v_free", label: "Con envío gratis", key: "freeShip" },
      { id: "v_buyer", label: "Envío a cargo del comprador", key: "buyerShip" },
      { id: "v_high", label: "Precio de venta reducido / promoción", key: "highPrice" },
    ],
    []
  );

  const catsFiltered = useMemo(() => {
    const n = needleCat.trim().toLowerCase();
    if (!n) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(n));
  }, [categories, needleCat]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pub-filter-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl border bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <h2 id="pub-filter-title" className="text-lg font-semibold text-slate-900">
            Filtrar y ordenar
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Ordenar por
              <span className="text-slate-400 text-xs group-open:rotate-180 transition">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <Label className="sr-only">Orden</Label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={draft.sort}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, sort: e.target.value as SellerPublicationsSort }))
                }
              >
                {SORT_GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {SELLER_PUBLICATION_SORT_OPTIONS.filter((o) => o.group === g).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Filtros recomendados
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <SectionSearch
                value={needleReco}
                onChange={setNeedleReco}
                placeholder="Buscar en filtros recomendados"
              />
              <FilterCheckboxGrid
                rows={RECOMMENDED}
                flags={draft.flags}
                onToggle={setFlag}
                search={needleReco}
              />
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Categorías
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <p className="text-xs text-muted-foreground mb-2">
                Solo categorías que usás en tus publicaciones (Prisma y Mercado Libre importadas).
              </p>
              <SectionSearch value={needleCat} onChange={setNeedleCat} placeholder="Buscar categoría" />
              {loadingCats ? (
                <p className="text-sm text-muted-foreground py-4">Cargando categorías…</p>
              ) : catsFiltered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay categorías para mostrar.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-1">
                  {catsFiltered.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-slate-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={draft.categoryIds.includes(c.id)}
                        onCheckedChange={(v) => toggleCategory(c.id, v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-snug">
                        {c.name}
                        <span className="text-muted-foreground"> ({c.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Estado de la publicación
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <SectionSearch
                value={needleEstado}
                onChange={setNeedleEstado}
                placeholder="Buscar en estado"
              />
              <FilterCheckboxGrid
                rows={estadoRows}
                flags={draft.flags}
                onToggle={setFlag}
                search={needleEstado}
              />
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Stock
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <SectionSearch value={needleStock} onChange={setNeedleStock} placeholder="Buscar en stock" />
              <FilterCheckboxGrid
                rows={stockRows}
                flags={draft.flags}
                onToggle={setFlag}
                search={needleStock}
              />
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Condiciones de venta y envío
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <SectionSearch value={needleEnvio} onChange={setNeedleEnvio} placeholder="Buscar" />
              <FilterCheckboxGrid
                rows={envioRows}
                flags={draft.flags}
                onToggle={setFlag}
                search={needleEnvio}
              />
            </div>
          </details>

          <details className="group rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-slate-800 flex items-center justify-between">
              Datos del producto
              <span className="text-slate-400 text-xs">▼</span>
            </summary>
            <div className="border-t bg-white px-3 py-3">
              <SectionSearch value={needleProd} onChange={setNeedleProd} placeholder="Buscar" />
              <FilterCheckboxGrid
                rows={PRODUCT_DATA}
                flags={draft.flags}
                onToggle={setFlag}
                search={needleProd}
              />
            </div>
          </details>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t bg-white px-4 py-3 shrink-0">
          <Button
            className="bg-primary hover:bg-primary-hover"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Filtrar
          </Button>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => {
              const cleared = cloneQuery(DEFAULT_SELLER_PUBLICATION_QUERY);
              setDraft(cleared);
              onApply(cleared);
              onOpenChange(false);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

export function countActivePublicationFilters(q: SellerPublicationQuery): number {
  let n = 0;
  if (q.sort !== "default") n += 1;
  n += q.categoryIds.length;
  for (const v of Object.values(q.flags)) {
    if (v) n += 1;
  }
  return n;
}

export function PublicationsFilterButton({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={onClick}>
      <Filter className="h-4 w-4" />
      Filtrar y ordenar
      {activeCount > 0 && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
