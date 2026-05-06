"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, Tag } from "lucide-react";
import ReputacionView from "@/components/dashboard/ReputacionView";
import RainbowLogo from "@/components/brand/RainbowLogo";

export default function ReputacionPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/reputacion");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin h-8 w-8 border-4 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-[#FEE500] pt-3 pb-2 px-4 shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-6 md:gap-12">
            <RainbowLogo textSizeClassName="text-[22px]" iconSizeClassName="w-12 h-12" />

            <div className="flex-1 max-w-3xl relative group">
              <input
                type="text"
                placeholder="Buscar productos, marcas y más..."
                className="w-full py-2.5 px-5 pr-12 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-600/20 transition-all outline-none text-slate-700 font-medium text-[15px]"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer border-l border-slate-100 ml-2 pl-3 group-focus-within:text-blue-600">
                <Search size={18} className="text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-5 font-semibold text-slate-800 text-sm">
              <div className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-xs font-bold">MJ</span>
                </div>
                <span className="hidden lg:block">Madsjeez</span>
              </div>
              <button className="hidden lg:block hover:text-blue-700" type="button">
                Ayuda
              </button>
              <button className="hidden lg:block hover:text-blue-700" type="button">
                Asistente
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto flex relative">
        <aside className="w-56 flex-shrink-0">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="grid grid-cols-2 gap-0.5">
              <span className="w-2 h-2 bg-blue-500 rounded-sm" />
              <span className="w-2 h-2 bg-blue-500 rounded-sm" />
              <span className="w-2 h-2 bg-blue-500 rounded-sm" />
              <span className="w-2 h-2 bg-blue-500 rounded-sm" />
            </span>
            MI CUENTA
          </h2>
          <nav className="flex flex-col gap-1">
            <div className="mb-2">
              <button className="w-full flex items-center justify-between py-2 px-3 hover:bg-blue-50 rounded-lg text-blue-600 font-semibold transition-colors" type="button">
                <div className="flex items-center gap-3">
                  <Tag size={18} />
                  <span>Ventas</span>
                </div>
                <ChevronDown size={16} className="transform rotate-180" />
              </button>
              <div className="flex flex-col ml-9 mt-1 border-l-2 border-gray-200 pl-4 gap-2">
                <Link
                  href="/dashboard"
                  className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900"
                >
                  Resumen
                </Link>
                <Link
                  href="/dashboard/novedades"
                  className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900"
                >
                  Novedades
                </Link>
                <Link
                  href="/dashboard/publicaciones"
                  className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900"
                >
                  Publicaciones
                </Link>
                <Link
                  href="/dashboard/preguntas"
                  className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900"
                >
                  Preguntas
                </Link>
                <Link
                  href="/dashboard/ventas"
                  className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900"
                >
                  Ventas
                </Link>
                <Link
                  href="/dashboard/reputacion"
                  className="text-left text-sm py-1.5 transition-colors text-blue-600 font-bold"
                >
                  Reputación
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <ReputacionView />
        </main>
      </div>
    </div>
  );
}
