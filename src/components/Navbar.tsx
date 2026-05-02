"use client";

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Search, Bell, ShoppingCart, MapPin, User, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Efecto de desarmado/armado del logo MADSJEEZ
  const logoLetters = [
    { char: 'M', dx: '-10px', dy: '-12px', rot: '-15deg', delay: '0s' },
    { char: 'A', dx: '-5px', dy: '10px', rot: '10deg', delay: '0.05s' },
    { char: 'D', dx: '8px', dy: '-10px', rot: '-8deg', delay: '0.1s' },
    { char: 'S', dx: '15px', dy: '12px', rot: '12deg', delay: '0.15s' },
    { char: 'J', dx: '-10px', dy: '15px', rot: '-10deg', delay: '0.2s', isBlue: true },
    { char: 'E', dx: '5px', dy: '-15px', rot: '20deg', delay: '0.25s', isBlue: true },
    { char: 'E', dx: '12px', dy: '8px', rot: '-5deg', delay: '0.3s', isBlue: true },
    { char: 'Z', dx: '20px', dy: '-8px', rot: '15deg', delay: '0.35s', isBlue: true },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Outfit:wght@300;400;500;600&display=swap');
        
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }

        @keyframes assemble {
          0% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
        }

        .letter-piece {
          display: inline-block;
          animation: assemble 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .group:hover .letter-piece {
          animation: assemble 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* --- Animación de barrido de luz para la insignia MADS PRO --- */
        @keyframes sweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        .mads-pro-badge {
          background: linear-gradient(90deg, #6b1076, #9b20b0);
          position: relative;
          overflow: hidden;
        }

        .mads-pro-badge::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
          transform: skewX(-20deg);
          animation: sweep 3s infinite ease-in-out;
        }

        /* --- ANIMACIÓN DEL EFECTO BORRADOR (WIPER) --- */
        
        /* 1. Movimiento de la insignia de lado a lado */
        @keyframes slideBadge {
          0%, 40% { transform: translateX(240px); }  /* Lado Derecho */
          50%, 90% { transform: translateX(0); }     /* Lado Izquierdo */
          100% { transform: translateX(240px); }     /* Vuelve a la Derecha */
        }
        
        /* 2. Fade Out de "Suscribite a" cuando pasa el borrador */
        @keyframes wipeOut1 {
          0%, 40% { opacity: 1; transform: translateX(0) scale(1); pointer-events: auto; }
          45%, 95% { opacity: 0; transform: translateX(-10px) scale(0.95); pointer-events: none; }
          100% { opacity: 1; transform: translateX(0) scale(1); pointer-events: auto; }
        }

        /* 3. Fade In de "y disfrutá..." cuando el borrador lo revela */
        @keyframes wipeIn2 {
          0%, 45% { opacity: 0; transform: translateX(10px) scale(0.95); pointer-events: none; }
          50%, 90% { opacity: 1; transform: translateX(0) scale(1); pointer-events: auto; }
          95%, 100% { opacity: 0; transform: translateX(10px) scale(0.95); pointer-events: none; }
        }

        .animate-slide-badge { animation: slideBadge 8s infinite cubic-bezier(0.64, 0, 0.36, 1); }
        .animate-wipe-out { animation: wipeOut1 8s infinite cubic-bezier(0.64, 0, 0.36, 1); }
        .animate-wipe-in { animation: wipeIn2 8s infinite cubic-bezier(0.64, 0, 0.36, 1); }

        .search-shadow { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.2); }
        .nav-link { cursor: pointer; color: rgba(51, 51, 51, 0.8); transition: color 0.15s ease; }
        .nav-link:hover { color: #3483fa; }
      `}</style>

      {/* NAVBAR MADSJEEZ */}
      <header className="bg-[#FFF159] w-full sticky top-0 z-[100] border-b border-black/5 h-[100px] flex flex-col justify-center font-outfit">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-0 w-full">
          
          {/* --- FILA 1: LOGO | BÚSQUEDA | BOTÓN MADS PRO ANIMADO --- */}
          <div className="flex items-center h-12">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer group w-[160px] flex-shrink-0">
              <div className="relative w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                 <svg viewBox="0 0 100 100" className="w-6 h-6">
                    <path d="M 15 80 L 35 30 L 55 55" stroke="#3483fa" fill="none" strokeWidth="15" strokeLinecap="round"/>
                    <path d="M 85 80 L 65 30 L 45 65" stroke="#FACC15" fill="none" strokeWidth="15" strokeLinecap="round"/>
                 </svg>
              </div>
              <div className="flex flex-col justify-center leading-none">
                <span className="font-montserrat font-black text-[20px] tracking-tighter uppercase text-[#2d3277]">
                  {logoLetters.map((letter, i) => (
                    <span 
                      key={i} 
                      className={`letter-piece ${letter.isBlue ? 'text-[#3483fa]' : ''}`}
                      style={{'--dx': letter.dx, '--dy': letter.dy, '--rot': letter.rot, animationDelay: letter.delay} as any}
                    >
                      {letter.char}
                    </span>
                  ))}
                </span>
              </div>
            </Link>

            {/* BARRA DE BÚSQUEDA (600px con ml-8 para eje central perfecto) */}
            <form onSubmit={handleSearch} className="w-[600px] flex-shrink-0 ml-8">
              <div className="flex items-center bg-white rounded-[2px] search-shadow h-10 px-4">
                <input 
                  type="text" 
                  placeholder="Buscar productos, marcas y más..." 
                  className="flex-1 outline-none text-[16px] text-slate-800 placeholder-slate-400 font-light"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                <button type="submit" className="text-slate-500 hover:text-slate-800 transition-colors">
                  <Search size={19} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* BOTÓN DESLIZANTE MADS PRO (Efecto Borrador) */}
            <div className="flex-1 flex items-center justify-end">
              <div className="relative overflow-hidden w-[340px] h-[36px] bg-white hover:shadow-md transition-shadow rounded-full shadow-sm border border-black/5 cursor-pointer flex items-center px-1.5">
                 
                 {/* 1. TEXTO DE LA IZQUIERDA (Aparece cuando el botón está a la derecha) */}
                 <div className="absolute left-6 w-[230px] flex items-center justify-center animate-wipe-out">
                    <span className="text-[#2d3277] font-black text-[19px] tracking-tight drop-shadow-sm">Suscribite a</span>
                 </div>

                 {/* 2. TEXTOS DE LA DERECHA (Aparecen cuando el botón está a la izquierda) */}
                 <div className="absolute left-[92px] w-auto flex items-center gap-1.5 animate-wipe-in">
                    <span className="text-[#2d3277] font-semibold text-[12px] whitespace-nowrap">y disfrutá</span>
                    
                    {/* Contenedor Caja + Envíos Reparado (Sin superposición) */}
                    <div className="flex items-center gap-1">
                       {/* SVG de la caja (Ancho Fijo) */}
                       <div className="w-[32px] flex items-center justify-center flex-shrink-0">
                          <svg width="32" height="26" viewBox="0 0 100 80" className="drop-shadow-sm">
                            <defs>
                              <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F5D0A9"/>
                                <stop offset="100%" stopColor="#D8A56D"/>
                              </linearGradient>
                              <linearGradient id="boxLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#C48E56"/>
                                <stop offset="100%" stopColor="#966029"/>
                              </linearGradient>
                              <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#A87541"/>
                                <stop offset="100%" stopColor="#75471B"/>
                              </linearGradient>
                            </defs>
                            <path d="M50 10 L95 25 L50 40 L5 25 Z" fill="url(#boxTop)"/>
                            <path d="M5 25 L50 40 L50 75 L5 60 Z" fill="url(#boxLeft)"/>
                            <path d="M50 40 L95 25 L95 60 L50 75 Z" fill="url(#boxRight)"/>
                            <path d="M48 20 L58 23 L58 75 L48 72 Z" fill="rgba(0,0,0,0.15)"/>
                            <path d="M60 40 L85 32 L85 45 L60 55 Z" fill="#3D2B1F"/>
                            <rect x="62" y="42" width="20" height="2" fill="#fff" opacity="0.4" transform="rotate(-18 62 42)"/>
                          </svg>
                       </div>
                       
                       {/* Texto de envíos (Separado y legible) */}
                       <div className="flex flex-col leading-[1.05] justify-center border-l border-slate-200 pl-1.5 py-0.5">
                          <span className="text-[#2d3277] font-black text-[8.5px] uppercase tracking-wider">Envíos gratis</span>
                          <span className="text-[#2d3277] font-black text-[8.5px] uppercase tracking-wider mt-[1px]">en tus compras</span>
                       </div>
                    </div>
                 </div>

                 {/* 3. LA INSIGNIA MADS PRO (El Borrador Animado) */}
                 <div className="absolute left-[6px] mads-pro-badge rounded-full px-3 py-[5px] flex items-center shadow-sm animate-slide-badge z-20">
                    <span className="font-montserrat font-black text-white text-[11px] italic tracking-tight">MADS PRO</span>
                 </div>

              </div>
            </div>

          </div>

          {/* --- FILA 2: UBICACIÓN + NAV (Izquierda) | USUARIO + ICONOS (Derecha) --- */}
          <div className="flex items-center justify-between h-10 mt-1">
            
            {/* BLOQUE IZQUIERDO: Ubicación + Navegación */}
            <div className="flex items-center">
              
              {/* Ubicación (Ancho fijo alineado con el Logo) */}
              <div className="flex items-center gap-1 cursor-pointer w-[160px] flex-shrink-0 group">
                <MapPin size={18} className="text-slate-900/60 group-hover:text-slate-900" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-slate-700/60 group-hover:text-slate-700 whitespace-nowrap">Enviar a Capital Federal</span>
                  <span className="text-[12px] text-slate-800 font-normal truncate">Av. Corrientes 1234, CABA</span>
                </div>
              </div>

              {/* Navegación (ml-8 para arrancar igual que el buscador) */}
              <nav className="flex items-center gap-x-4 text-[13px] font-light ml-8 w-[480px]">
                <Link href="/categories" className="flex items-center gap-0.5 nav-link whitespace-nowrap">
                  Categorías <ChevronDown size={11} className="mt-0.5 opacity-40" />
                </Link>
                <Link href="/offers" className="nav-link whitespace-nowrap">Ofertas</Link>
                <Link href="/coupons" className="nav-link whitespace-nowrap">Cupones</Link>
                <Link href="/supermarket" className="nav-link whitespace-nowrap">Supermercado</Link>
                <Link href="/fashion" className="nav-link whitespace-nowrap">Moda</Link>
                <Link href="/dashboard/publicaciones" className="nav-link whitespace-nowrap">Vender</Link>
                <Link href="/blog" className="nav-link whitespace-nowrap">Blog</Link>
                <Link href="/help" className="nav-link whitespace-nowrap">Ayuda</Link>
              </nav>
            </div>

            {/* BLOQUE DERECHO: Cuenta + Iconos (Anclado a la derecha) */}
            <div className="flex items-center gap-x-4 text-[13px] font-light flex-shrink-0">
              
              {!session ? (
                <>
                  <Link href="/auth/register" className="nav-link whitespace-nowrap font-medium text-slate-800">Creá tu cuenta</Link>
                  <Link href="/auth/login" className="nav-link whitespace-nowrap font-medium text-slate-800">Ingresá</Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="flex items-center gap-1.5 cursor-pointer nav-link group flex-shrink-0">
                    <User size={16} className="text-slate-600" />
                    <span className="whitespace-nowrap font-normal text-slate-800">{session.user?.name || "Mi cuenta"}</span>
                    <ChevronDown size={10} className="opacity-40 group-hover:rotate-180 transition-transform" />
                  </Link>
                  <Link href="/orders" className="nav-link whitespace-nowrap font-medium text-slate-800">Mis compras</Link>
                  <Link href="/favorites" className="flex items-center gap-0.5 nav-link whitespace-nowrap">
                    Favoritos <ChevronDown size={10} className="opacity-40" />
                  </Link>
                </>
              )}
              
              <div className="flex items-center gap-4 ml-1">
                 <Link href="/notifications" className="relative cursor-pointer nav-link">
                    <Bell size={18} strokeWidth={1.5} className="text-slate-800" />
                 </Link>
                 <Link href="/cart" className="cursor-pointer nav-link relative">
                    <ShoppingCart size={18} strokeWidth={1.5} className="text-slate-800" />
                 </Link>
              </div>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
