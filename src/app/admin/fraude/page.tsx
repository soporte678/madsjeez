"use client"

import { ShieldAlert, Construction } from "lucide-react"

export default function FraudePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-blue-50 p-8 rounded-xl border border-blue-200 text-center">
        <ShieldAlert className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Control de Estafas</h2>
        <p className="text-gray-600 mb-4">Módulo en desarrollo</p>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
          <Construction className="w-4 h-4" />
          Próximamente
        </div>
      </div>
    </div>
  )
}
