import Link from "next/link";
import type { ReactNode } from "react";

import { ApiDocsSidebar } from "@/components/docs/ApiDocsSidebar";

export default function DocsApiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      {/* Franja tipo portal developers ML */}
      <div className="h-1 bg-[#ffe600]" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/docs/api" className="flex shrink-0 items-center gap-2">
              <span className="rounded bg-slate-900 px-2 py-1 text-xs font-bold tracking-tight text-[#ffe600]">MJ</span>
              <div className="min-w-0 leading-tight">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Developers</span>
                <span className="block truncate text-sm font-semibold text-slate-900">Referencia API</span>
              </div>
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Enlaces documentación">
            <Link href="/docs/api" className="font-medium text-blue-600 hover:underline">
              Documentación
            </Link>
            <span className="text-slate-300" aria-hidden>
              |
            </span>
            <Link href="/" className="text-slate-600 hover:text-slate-900 hover:underline">
              Ir al marketplace
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-10 lg:py-10">
        <ApiDocsSidebar />
        <main className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:max-w-[calc(100%-16rem)]">
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          API base: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">/api</code> · Contenido en{" "}
          <code className="font-mono text-slate-600">docs/api/</code>
        </p>
      </footer>
    </div>
  );
}
