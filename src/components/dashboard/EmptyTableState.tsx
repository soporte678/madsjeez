"use client"

import { Search, Download, LayoutGrid } from "lucide-react"

interface EmptyTableStateProps {
  title: string
  headers: string[]
  emptyText: string
}

export function EmptyTableState({ title, headers, emptyText }: EmptyTableStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
      {title && (
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." className="w-full py-1.5 pl-9 pr-4 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-blue-500" />
          </div>
          <button className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
            <Download size={14} /> Descargar reporte
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-100/50 text-[11px] uppercase text-gray-500 border-b border-gray-200">
              {headers.map((h, i) => <th key={i} className="px-6 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={headers.length} className="px-6 py-16 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <LayoutGrid size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-700">{emptyText}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
