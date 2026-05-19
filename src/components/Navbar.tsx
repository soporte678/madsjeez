"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Bell, ShoppingCart, MapPin, User, ChevronDown, X, Mic, Camera,
  Sparkles, TrendingUp, History, ArrowRight, Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'product' | 'category' | 'brand' | 'trending' | 'history';
  image?: string;
  url: string;
}

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Cargar historial de búsqueda desde localStorage
  useEffect(() => {
    const history = localStorage.getItem('madsjeez_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Guardar búsqueda en historial
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('madsjeez_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Buscar sugerencias con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Mostrar historial y tendencias cuando no hay query
      const trending: SearchSuggestion[] = [
        { id: 't1', title: 'iPhone 15 Pro', type: 'trending', url: '/search?q=iPhone+15+Pro' },
        { id: 't2', title: 'Zapatillas Nike', type: 'trending', url: '/search?q=Zapatillas+Nike' },
        { id: 't3', title: 'Notebook Gamer', type: 'trending', url: '/search?q=Notebook+Gamer' },
        { id: 't4', title: 'Aire Acondicionado', type: 'trending', url: '/search?q=Aire+Acondicionado' },
      ];
      const historyItems: SearchSuggestion[] = searchHistory.slice(0, 5).map((h, i) => ({
        id: `h${i}`,
        title: h,
        type: 'history',
        url: `/search?q=${encodeURIComponent(h)}`
      }));
      setSuggestions([...historyItems, ...trending]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchHistory]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveToHistory(searchQuery);
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'history' || suggestion.type === 'trending') {
      setSearchQuery(suggestion.title);
    }
    saveToHistory(suggestion.title);
    setIsSearchOpen(false);
    router.push(suggestion.url);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeFromHistory = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== title);
    setSearchHistory(newHistory);
    localStorage.setItem('madsjeez_search_history', JSON.stringify(newHistory));
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Logo: colores claros y saturados para leerse sobre barra oscura (contraste AA+)
  const logoLetters = [
    { char: 'M', dx: '-10px', dy: '-12px', rot: '-15deg', delay: '0s', color: '#fef08a' },
    { char: 'A', dx: '-5px', dy: '10px', rot: '10deg', delay: '0.05s', color: '#fcd34d' },
    { char: 'D', dx: '8px', dy: '-10px', rot: '-8deg', delay: '0.1s', color: '#fdba74' },
    { char: 'S', dx: '15px', dy: '12px', rot: '12deg', delay: '0.15s', color: '#fb923c' },
    { char: 'J', dx: '-10px', dy: '15px', rot: '-10deg', delay: '0.2s', color: '#67e8f9' },
    { char: 'E', dx: '5px', dy: '-15px', rot: '20deg', delay: '0.25s', color: '#7dd3fc' },
    { char: 'E', dx: '12px', dy: '8px', rot: '-5deg', delay: '0.3s', color: '#86efac' },
    { char: 'Z', dx: '20px', dy: '-8px', rot: '15deg', delay: '0.35s', color: '#5eead4' },
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
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
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
          background: linear-gradient(90deg, var(--primary), var(--accent));
          position: relative;
          overflow: hidden;
        }

        .mads-pro-shell {
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.82)),
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 58%);
          border: 1px solid rgba(148, 163, 184, 0.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 10px 30px rgba(2, 6, 23, 0.25);
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
        .nav-link {
          cursor: pointer;
          color: rgba(226, 232, 240, 0.88);
          transition: color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .nav-link:hover { color: #ffffff; transform: translateY(-1px); }
        .nav-link-muted {
          color: rgba(148, 163, 184, 0.82);
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .nav-link-muted:hover { color: rgba(255,255,255,0.94); }
        .nav-icon {
          color: rgba(226, 232, 240, 0.92);
          transition: color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .nav-icon:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }
        
        .search-glow:focus-within { 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16), 0 8px 28px rgba(14, 116, 244, 0.16); 
        }
        
        .suggestion-item { 
          transition: all 0.15s ease; 
        }
        .suggestion-item:hover, .suggestion-item.selected {
          background: linear-gradient(90deg, rgba(255, 77, 46, 0.09), rgba(255, 183, 3, 0.06));
          transform: translateX(4px);
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .gradient-text {
          background: linear-gradient(90deg, #f97316, #ffb703, #00b4d8, #f97316);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        
        .mads-pro-gradient {
          background: linear-gradient(90deg, #db2777, #ec4899, #db2777);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Barra oscura: logo y enlaces legibles; acento ámbar solo en borde */}
      <header className="w-full sticky top-0 z-[100] flex h-[100px] flex-col justify-center border-b border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.95)_46%,rgba(17,24,39,0.94)_100%)] font-outfit shadow-[0_18px_40px_rgba(2,6,23,0.34)] backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-0 w-full">
          
          {/* --- FILA 1: LOGO | BÚSQUEDA | BOTÓN MADS PRO ANIMADO --- */}
          <div className="flex items-center h-12">
            
            {/* LOGO - NUEVA PALETA */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer group w-[160px] flex-shrink-0">
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#162032] via-[#0f172a] to-[#16213e] shadow-lg shadow-sky-900/20 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-xl group-hover:shadow-sky-900/30">
                 <svg viewBox="0 0 100 100" className="w-6 h-6">
                    <path d="M 15 80 L 35 30 L 55 55" stroke="#f97316" fill="none" strokeWidth="15" strokeLinecap="round"/>
                    <path d="M 85 80 L 65 30 L 45 65" stroke="#00b4d8" fill="none" strokeWidth="15" strokeLinecap="round"/>
                 </svg>
                 <div className="absolute inset-0 bg-gradient-to-tr from-[#f97316]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col justify-center leading-none">
                <span className="font-montserrat font-black text-[20px] tracking-tighter uppercase">
                  {logoLetters.map((letter, i) => (
                    <span 
                      key={i} 
                      className="letter-piece"
                      style={{
                        '--dx': letter.dx, 
                        '--dy': letter.dy, 
                        '--rot': letter.rot, 
                        animationDelay: letter.delay,
                        color: letter.color
                      } as any}
                    >
                      {letter.char}
                    </span>
                  ))}
                </span>
              </div>
            </Link>

            {/* BARRA DE BÚSQUEDA INTELIGENTE */}
            <div ref={searchRef} className="w-[600px] flex-shrink-0 ml-8 relative">
              <form onSubmit={handleSearch}>
                <div 
                  className={cn(
                    "search-glow flex h-11 items-center rounded-2xl border bg-[rgba(15,23,42,0.72)] px-4 transition-all duration-300 backdrop-blur-xl",
                    isSearchOpen
                      ? "border-[#60a5fa] shadow-lg shadow-sky-500/20"
                      : "border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  )}
                >
                  <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Buscar productos, marcas y más..." 
                    className="flex-1 bg-transparent text-[16px] font-light text-slate-50 placeholder:text-slate-400 outline-none"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                      setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={clearSearch}
                      className="mr-1 rounded-full p-1 transition-colors hover:bg-white/10"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  )}
                  <div className="mx-2 h-6 w-[1px] bg-white/10"></div>
                  <button 
                    type="button" 
                    className="p-1.5 text-slate-400 transition-colors hover:text-slate-100"
                    title="Búsqueda por voz"
                  >
                    <Mic size={18} />
                  </button>
                  <button 
                    type="button" 
                    className="mr-1 p-1.5 text-slate-400 transition-colors hover:text-slate-100"
                    title="Búsqueda por imagen"
                  >
                    <Camera size={18} />
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-xl bg-gradient-to-r from-[#f97316] via-[#ff9100] to-[#ffb703] p-2 text-white shadow-md shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40"
                  >
                    <Search size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </form>

              {/* DROPDOWN DE SUGERENCIAS INTELIGENTES */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl shadow-orange-500/10 border border-slate-100 overflow-hidden z-50">
                  {/* Loading state */}
                  {isLoading && (
                    <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                      <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Buscando...</span>
                    </div>
                  )}
                  
                  {/* Sugerencias */}
                  {!isLoading && suggestions.length > 0 && (
                    <div className="max-h-[400px] overflow-y-auto">
                      {/* Título de sección */}
                      {searchQuery && (
                        <div className="px-4 py-2 bg-gradient-to-r from-[#f97316]/5 to-[#ffb703]/5 border-b border-slate-100">
                          <span className="text-xs font-bold text-[#f97316] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} />
                            Sugerencias inteligentes
                          </span>
                        </div>
                      )}
                      
                      {/* Historial */}
                      {!searchQuery && searchHistory.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <History size={12} />
                            Búsquedas recientes
                          </span>
                        </div>
                      )}
                      
                      {/* Tendencias */}
                      {!searchQuery && (
                        <div className="px-4 py-2 bg-gradient-to-r from-[#ffb703]/10 to-[#f97316]/5 border-b border-slate-100">
                          <span className="text-xs font-bold text-[#ffb703] uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp size={12} />
                            Tendencias
                          </span>
                        </div>
                      )}

                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={cn(
                              "suggestion-item w-full px-4 py-2.5 flex items-center gap-3 text-left",
                              selectedIndex === index && "selected"
                            )}
                          >
                            {/* Icono según tipo */}
                            {suggestion.type === 'history' && (
                              <History size={16} className="text-slate-400 flex-shrink-0" />
                            )}
                            {suggestion.type === 'trending' && (
                              <TrendingUp size={16} className="text-[#f97316] flex-shrink-0" />
                            )}
                            {suggestion.type === 'product' && (
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {suggestion.image ? (
                                  <img src={suggestion.image} alt="" className="w-6 h-6 object-cover rounded" />
                                ) : (
                                  <Search size={14} className="text-slate-400" />
                                )}
                              </div>
                            )}
                            {suggestion.type === 'category' && (
                              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#f97316]/10 to-[#ffb703]/10 flex items-center justify-center flex-shrink-0">
                                <ArrowRight size={14} className="text-[#f97316]" />
                              </div>
                            )}
                            {suggestion.type === 'brand' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00b4d8]/10 to-[#f97316]/10 flex items-center justify-center flex-shrink-0">
                                <Zap size={14} className="text-[#00b4d8]" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {suggestion.title}
                              </p>
                              <p className="text-xs text-slate-400 capitalize">
                                {suggestion.type === 'history' && 'Búsqueda reciente'}
                                {suggestion.type === 'trending' && 'Tendencia'}
                                {suggestion.type === 'product' && 'Producto'}
                                {suggestion.type === 'category' && 'Categoría'}
                                {suggestion.type === 'brand' && 'Marca'}
                              </p>
                            </div>
                            
                            {suggestion.type === 'history' && (
                              <button
                                onClick={(e) => removeFromHistory(e, suggestion.title)}
                                className="p-1 hover:bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar del historial"
                              >
                                <X size={14} className="text-slate-400" />
                              </button>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Footer */}
                      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Usa ↑↓ para navegar, ↵ para seleccionar
                        </span>
                        {searchHistory.length > 0 && !searchQuery && (
                          <button
                            onClick={() => {
                              setSearchHistory([]);
                              localStorage.removeItem('madsjeez_search_history');
                            }}
                            className="text-xs text-[#f97316] hover:text-[#ff9100] font-medium"
                          >
                            Borrar historial
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTÓN DESLIZANTE MADS PRO (Efecto Borrador) */}
            <div className="flex-1 flex items-center justify-end">
              <div className="mads-pro-shell relative flex h-[38px] w-[340px] cursor-pointer items-center overflow-hidden rounded-full px-1.5 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/20 hover:shadow-[0_14px_36px_rgba(2,6,23,0.32)]">
                 
                 {/* 1. TEXTO DE LA IZQUIERDA (Aparece cuando el botón está a la derecha) */}
                 <div className="absolute left-6 w-[230px] flex items-center justify-center animate-wipe-out">
                    <span className="font-black tracking-tight text-white/92 drop-shadow-sm text-[18px]">Suscribite a</span>
                 </div>

                 {/* 2. TEXTOS DE LA DERECHA (Aparecen cuando el botón está a la izquierda) */}
                 <div className="absolute left-[92px] w-auto flex items-center gap-1.5 animate-wipe-in">
                    <span className="whitespace-nowrap text-[12px] font-semibold text-slate-200">y disfrutá</span>
                    
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
                       <div className="flex flex-col justify-center border-l border-white/12 py-0.5 pl-1.5 leading-[1.05]">
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-100">Envíos gratis</span>
                          <span className="mt-[1px] text-[8.5px] font-black uppercase tracking-wider text-slate-100">en tus compras</span>
                       </div>
                    </div>
                 </div>

                 {/* 3. LA INSIGNIA MADS PRO (El Borrador Animado) - NUEVA PALETA FUCSIA */}
                 <div className="absolute left-[6px] rounded-full px-3 py-[5px] flex items-center shadow-lg shadow-primary/30 animate-slide-badge z-20 mads-pro-badge">
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
                <MapPin size={18} className="text-slate-500 transition-colors group-hover:text-slate-200" />
                <div className="flex flex-col leading-none">
                  <span className="nav-link-muted whitespace-nowrap text-[10px]">Enviar a Capital Federal</span>
                  <span className="truncate text-[12px] font-medium text-slate-100 transition-colors group-hover:text-white">Av. Corrientes 1234, CABA</span>
                </div>
              </div>

              {/* Navegación (ml-8 para arrancar igual que el buscador) */}
              <nav className="flex flex-1 min-w-0 items-center gap-x-3 lg:gap-x-4 text-[13px] font-light ml-4 md:ml-8 overflow-x-auto scrollbar-hide pb-0.5 md:pb-0">
                <Link href="/categories" className="flex items-center gap-0.5 nav-link whitespace-nowrap shrink-0">
                  Categorías <ChevronDown size={11} className="mt-0.5 opacity-40" />
                </Link>
                <Link href="/offers" className="nav-link whitespace-nowrap shrink-0">Ofertas</Link>
                <Link href="/deals" className="nav-link whitespace-nowrap shrink-0">Descuentos</Link>
                <Link href="/coupons/public" className="nav-link whitespace-nowrap shrink-0">Cupones</Link>
                <Link href="/search" className="nav-link whitespace-nowrap shrink-0">Catálogo</Link>
                <Link href="/notifications" className="nav-link whitespace-nowrap shrink-0 hidden sm:inline">Alertas</Link>
                <Link href="/subscriptions" className="nav-link whitespace-nowrap shrink-0 hidden md:inline">MADS+</Link>
                <Link href="/seller/register" className="nav-link whitespace-nowrap shrink-0 hidden lg:inline">Vender</Link>
                {/* Reservan el hueco del nav (visibility) sin mostrar ni enlazar */}
                <span
                  className="nav-link whitespace-nowrap shrink-0 hidden xl:inline invisible pointer-events-none select-none"
                  aria-hidden="true"
                >
                  Mi panel
                </span>
                <span
                  className="nav-link whitespace-nowrap shrink-0 invisible pointer-events-none select-none"
                  aria-hidden="true"
                >
                  Ayuda
                </span>
              </nav>
            </div>

            {/* BLOQUE DERECHO: Cuenta + Iconos (Anclado a la derecha) */}
            <div className="flex items-center gap-x-4 text-[13px] font-light flex-shrink-0">
              
              {!session ? (
                <>
                  <Link href="/auth/register" className="nav-link whitespace-nowrap font-medium">Creá tu cuenta</Link>
                  <Link href="/auth/login" className="nav-link whitespace-nowrap font-medium">Ingresá</Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="flex items-center gap-1.5 cursor-pointer nav-link group flex-shrink-0">
                    <User size={16} className="text-slate-300 transition-colors group-hover:text-white" />
                    <span className="whitespace-nowrap font-normal">{session.user?.name || "Mi cuenta"}</span>
                    <ChevronDown size={10} className="opacity-50 group-hover:rotate-180 transition-transform" />
                  </Link>
                  <Link href="/orders" className="nav-link whitespace-nowrap font-medium">Mis compras</Link>
                  <Link href="/favorites" className="flex items-center gap-0.5 nav-link whitespace-nowrap">
                    Favoritos <ChevronDown size={10} className="opacity-50" />
                  </Link>
                </>
              )}
              
              <div className="flex items-center gap-4 ml-1">
                 <Link href="/notifications" className="relative cursor-pointer nav-icon">
                    <Bell size={18} strokeWidth={1.5} className="nav-icon" />
                 </Link>
                 <Link href="/cart" className="relative cursor-pointer nav-icon">
                    <ShoppingCart size={18} strokeWidth={1.5} className="nav-icon" />
                 </Link>
              </div>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
