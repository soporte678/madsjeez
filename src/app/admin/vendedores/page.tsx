"use client"

import { Store, Construction } from "lucide-react"

export default function VendedoresPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-yellow-50 p-8 rounded-xl border border-yellow-200 text-center">
        <Store className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Vendedores</h2>
        <p className="text-gray-600 mb-4">Módulo en desarrollo</p>
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-100 px-4 py-2 rounded-full">
          <Construction className="w-4 h-4" />
          Próximamente
        </div>
      </div>
    </div>
  )
}
