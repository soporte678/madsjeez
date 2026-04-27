"use client"

import { useState } from "react"
import { useClaims, ClaimStatus, ClaimType } from "@/hooks/useClaims"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertCircle, 
  Package, 
  RefreshCcw, 
  MessageSquare,
  ChevronRight,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface ClaimsListProps {
  asBuyer?: boolean
}

const statusLabels: Record<ClaimStatus, string> = {
  OPEN: "Abierto",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado"
}

const statusColors: Record<ClaimStatus, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-500"
}

const typeLabels: Record<ClaimType, string> = {
  CLAIM: "Reclamo",
  RETURN: "Devolución",
  EXCHANGE: "Cambio"
}

export function ClaimsList({ asBuyer = false }: ClaimsListProps) {
  const { claims, isLoading, total } = useClaims({ asBuyer })
  const [filter, setFilter] = useState<ClaimStatus | "all">("all")

  const filteredClaims = filter === "all" 
    ? claims 
    : claims.filter(c => c.status === filter)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {asBuyer ? "Mis Reclamos" : "Reclamos Recibidos"}
          <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>
        </h3>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ClaimStatus | "all")}
          className="border rounded-md px-3 py-1 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="OPEN">Abiertos</option>
          <option value="IN_REVIEW">En revisión</option>
          <option value="RESOLVED">Resueltos</option>
          <option value="CLOSED">Cerrados</option>
        </select>
      </div>

      {filteredClaims.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            {asBuyer 
              ? "No has iniciado ningún reclamo" 
              : "No tienes reclamos de compradores"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => (
            <Link
              key={claim.id}
              href={`/claims/${claim.id}`}
              className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[claim.status]}>
                      {statusLabels[claim.status]}
                    </Badge>
                    <Badge variant="outline">{typeLabels[claim.type]}</Badge>
                  </div>
                  
                  <p className="font-medium text-gray-900">
                    Orden #{claim.order.orderNumber}
                  </p>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {claim.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {claim.order.items.length} productos
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {claim._count?.claimMessages || 0} mensajes
                    </span>
                    
                    <span>
                      ${claim.order.total.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
