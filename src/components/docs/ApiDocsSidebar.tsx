"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { API_DOCS_NAV, apiDocKeyToHref, type ApiDocSlug } from "@/lib/api-docs";

function pathToActiveSlug(pathname: string): ApiDocSlug {
  if (pathname === "/docs/api" || pathname === "/docs/api/") return "README";
  const prefix = "/docs/api/";
  if (!pathname.startsWith(prefix)) return "README";
  const rest = pathname.slice(prefix.length);
  return (rest || "README") as ApiDocSlug;
}

export function ApiDocsSidebar() {
  const pathname = usePathname();
  const active = pathToActiveSlug(pathname);
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      {API_DOCS_NAV.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = apiDocKeyToHref(item.slug);
              const isActive = item.slug === active;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-[13px] transition-colors ${
                      isActive
                        ? "bg-blue-50 font-semibold text-blue-800"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
                    <span className={isActive ? "" : "pl-0.5"}>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <>
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm lg:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" aria-hidden />
          Menú documentación
        </span>
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <aside
        className={`lg:block ${open ? "block" : "hidden"} shrink-0 border-slate-200 lg:w-64 lg:border-r lg:pr-4`}
      >
        <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 lg:top-24" aria-label="Secciones API">
          <NavLinks />
        </nav>
      </aside>
    </>
  );
}
