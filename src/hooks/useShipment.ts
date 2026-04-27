"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export type ShipmentStatus = 
  | "pending" 
  | "ready_to_ship" 
  | "shipped" 
  | "in_transit" 
  | "out_for_delivery" 
  | "delivered" 
  | "exception"

export interface ShipmentEvent {
  id: string
  shipmentId: string
  status: string
  description: string
  location: string | null
  timestamp: string
  createdAt: string
}

export interface Shipment {
  id: string
  orderId: string
  carrier: string
  carrierName: string | null
  trackingNumber: string | null
  status: ShipmentStatus
  labelUrl: string | null
  labelGeneratedAt: string | null
  estimatedDelivery: string | null
  deliveredAt: string | null
  receivedBy: string | null
  shippingAddress: any
  events: ShipmentEvent[]
  createdAt: string
  updatedAt: string
}

interface UseShipmentOptions {
  orderId?: string
}

interface UseShipmentReturn {
  shipment: Shipment | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  createShipment: (data: CreateShipmentData) => Promise<void>
  updateShipment: (id: string, data: UpdateShipmentData) => Promise<void>
  addEvent: (shipmentId: string, data: AddEventData) => Promise<void>
}

interface CreateShipmentData {
  orderId: string
  carrier: string
  carrierName?: string
  trackingNumber?: string
  estimatedDelivery?: string
  shippingAddress?: any
}

interface UpdateShipmentData {
  status?: ShipmentStatus
  trackingNumber?: string
  labelUrl?: string
}

interface AddEventData {
  status: string
  description: string
  location?: string
}

const statusLabels: Record<ShipmentStatus, string> = {
  pending: "Pendiente",
  ready_to_ship: "Listo para enviar",
  shipped: "Enviado",
  in_transit: "En tránsito",
  out_for_delivery: "En camino a domicilio",
  delivered: "Entregado",
  exception: "Problema con el envío"
}

export function useShipment(options: UseShipmentOptions = {}): UseShipmentReturn {
  const { data: session } = useSession()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShipment = useCallback(async () => {
    if (!options.orderId || !session?.user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/shipments?orderId=${options.orderId}`)
      if (!res.ok) {
        if (res.status === 404) {
          setShipment(null)
          setIsLoading(false)
          return
        }
        throw new Error("Error al cargar envío")
      }

      const data = await res.json()
      setShipment(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [options.orderId, session?.user])

  useEffect(() => {
    fetchShipment()
  }, [fetchShipment])

  const createShipment = async (data: CreateShipmentData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al crear envío")
    }

    await fetchShipment()
  }

  const updateShipment = async (id: string, data: UpdateShipmentData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al actualizar envío")
    }

    await fetchShipment()
  }

  const addEvent = async (shipmentId: string, data: AddEventData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al agregar evento")
    }

    await fetchShipment()
  }

  return {
    shipment,
    isLoading,
    error,
    refresh: fetchShipment,
    createShipment,
    updateShipment,
    addEvent
  }
}

export { statusLabels }
