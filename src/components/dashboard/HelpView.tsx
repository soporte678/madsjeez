"use client";

import React from 'react';
import { 
  Search, ChevronRight, MessageCircle, Package, 
  RotateCcw, Tag, Clock, HelpCircle, 
  ArrowLeft, ExternalLink, X
} from 'lucide-react';

interface HelpViewProps {
  userData?: {
    name: string;
  } | null;
}

export default function HelpView({ userData }: HelpViewProps) {
  const user = userData || { name: "Usuario" };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto animate-fade-in pb-20">
      
      {/* --- SALUDO Y BUSCADOR --- */}
      <div className="text-center py-10 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Hola, {user.name}. <br />
          <span className="text-gray-900 font-black text-3xl">¿Con qué te ayudamos?</span>
        </h1>
        
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3483fa]" size={20} />
          <input 
            type="text" 
            placeholder="Cómo..." 
            className="w-full pl-14 pr-6 py-4 bg-white rounded-full shadow-lg border border-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-[#3483fa] transition-all"
          />
        </div>
      </div>

      {/* --- CONSULTAS RECIENTES --- */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-gray-800">Consultas recientes</h2>
          <button className="text-[#3483fa] text-sm font-semibold hover:underline">Mostrar todas</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConsultaCard 
            date="Terminada el 14 de Abril"
            title="No hay problema o duda clara para resumir."
            status="Ir a la consulta"
          />
          <ConsultaCard 
            date="Terminada el 2 de Abril"
            title="Necesito ayuda para resolver un problema que tengo."
            status="Ir a la consulta"
          />
        </div>
      </section>

      {/* --- ESTADO DE TU COMPRA --- */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-gray-800">Estado de tu compra</h2>
          <button className="text-[#3483fa] text-sm font-semibold hover:underline">Ir a Mis Compras</button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
               <img src="https://images.unsplash.com/photo-1590234913243-91aa00582046?auto=format&fit=crop&q=60&w=100" alt="Producto" className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#00a650] font-bold text-sm uppercase tracking-wide">Entregado</span>
              <span className="text-gray-800 font-bold text-base">Llegó el 20 de abril</span>
              <p className="text-xs text-gray-400 mt-0.5">Podés devolverlo hasta el miércoles 20 de mayo.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </div>
      </section>

      {/* --- ATAJOS PERSONALIZADOS --- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Atajos personalizados</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <AtajoItem icon={<RotateCcw size={18}/>} label="Devolver una compra" />
          <AtajoItem icon={<Tag size={18}/>} label="Gestionar ventas, envíos y etiquetas" />
          <AtajoItem icon={<Clock size={18}/>} label="Cuándo llegan mis compras" />
          <AtajoItem icon={<MessageCircle size={18}/>} label="Iniciar o seguir un reclamo" />
          <AtajoItem icon={<HelpCircle size={18}/>} label="Explorá las preguntas frecuentes" hasBorder={false} />
        </div>
      </section>

      {/* --- NECESITAS MAS AYUDA? --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">¿Necesitás más ayuda?</h3>
        <button className="bg-blue-50 text-[#3483fa] px-6 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm">
          <MessageCircle size={20} />
          Contactanos
        </button>
      </div>

    </div>
  );
}

function ConsultaCard({ date, title, status }: { date: string; title: string; status: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col h-full hover:shadow-md transition-all cursor-pointer group">
      <span className="text-[11px] font-bold text-gray-400 uppercase mb-4">{date}</span>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
           <HelpCircle size={20} />
        </div>
        <p className="text-[13px] text-gray-600 font-medium leading-relaxed line-clamp-2">
          {title}
        </p>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-50">
        <span className="text-[#3483fa] text-[13px] font-bold hover:underline">
          {status}
        </span>
      </div>
    </div>
  );
}

function AtajoItem({ icon, label, hasBorder = true }: { icon: React.ReactNode; label: string; hasBorder?: boolean }) {
  return (
    <div className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${hasBorder ? 'border-b border-gray-50' : ''}`}>
      <div className="flex items-center gap-4 text-gray-600">
        <div className="w-8 h-8 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[15px] font-medium text-gray-800">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </div>
  );
}
