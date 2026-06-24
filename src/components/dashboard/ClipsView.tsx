"use client";

import React, { useState } from 'react';
import { Search, Filter, Info, MoreVertical, ChevronDown } from 'lucide-react';


export default function ClipsView() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mis Clips</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline">
            <Info size={16} />
            Requisitos para crear clips
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Subir un clip
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-lg">🔥</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">Colaborador, ya podés crear clips desde tu celular</div>
          <div className="text-xs text-gray-500 mt-0.5">Inicia sesión en la app de Mercado Libre con tu correo de colaborador y empezá a crear clips con ayuda de IA.</div>
        </div>
        <button className="text-blue-600 text-sm font-medium hover:underline flex-shrink-0">Crear desde el celular</button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Busca por el número de la publicación"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg border border-gray-300">
          <Filter size={16} />
          Filtrar
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Video</th>
              <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Publicación</th>
              <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Visualizaciones
                </div>
              </th>
              <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Retención
                </div>
              </th>
              <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Interacciones
                </div>
              </th>
              <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Seguidores
                </div>
              </th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="p-12 text-center">
                <div className="text-gray-400 text-sm">No tenés clips subidos todavía</div>
                <div className="text-gray-300 text-xs mt-1">Subí tu primer clip para empezar a ver métricas de visualizaciones y retención</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
