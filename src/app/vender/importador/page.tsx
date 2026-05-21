"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, PackageCheck, Upload } from "lucide-react";

export default function CatalogImporterLeadPage() {
  const [raw, setRaw] = useState("");
  const rows = useMemo(() => raw.split(/\r?\n/).filter(Boolean), [raw]);
  const headers = useMemo(() => rows[0]?.split(/[;,]/).map((x) => x.trim()) || [], [rows]);
  const productCount = Math.max(rows.length - 1, 0);
  const readiness = Math.min(95, 35 + productCount * 2 + headers.length * 4);

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
            <FileSpreadsheet size={14} />
            Pre-importador de catalogo
          </p>
          <h1 className="mt-6 text-4xl font-black md:text-6xl">Mostrale al vendedor que entrar a MadsJeez puede ser rapido.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Pegá una muestra CSV o planilla exportada. La herramienta calcula productos detectados, columnas y nivel de preparacion para importar.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <textarea
            className="min-h-[360px] bg-white p-4 font-mono text-sm text-slate-950"
            placeholder={"titulo;precio;stock;categoria\nTaladro percutor;45000;8;Herramientas\nManguera 20m;12000;15;Riego"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <aside className="border border-white/15 bg-white/[0.06] p-6">
            <Upload className="text-cyan-300" size={26} />
            <h2 className="mt-4 text-2xl font-black">Diagnostico de importacion</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-400">Productos</p>
                <p className="text-3xl font-black">{productCount}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-400">Columnas</p>
                <p className="text-3xl font-black">{headers.length}</p>
              </div>
            </div>
            <div className="mt-5 border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-100">Preparacion estimada</p>
              <p className="mt-2 text-5xl font-black">{readiness}%</p>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><PackageCheck className="text-emerald-300" size={16} /> Columnas recomendadas: titulo, precio, stock, categoria, descripcion, imagen.</li>
              <li className="flex gap-2"><PackageCheck className="text-emerald-300" size={16} /> Siguiente paso: convertir esta muestra en lead y cargar catalogo piloto.</li>
            </ul>
            <a href="/vender#registro" className="mt-6 inline-block bg-cyan-300 px-5 py-3 font-black text-slate-950">Quiero importar mi catalogo</a>
          </aside>
        </div>
      </section>
    </main>
  );
}
