"use client"

import { MessageCircle } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface WhatsAppButtonProps {
  productName: string
  price: number
  sellerPhone: string
  sellerName: string
  productUrl: string
}

export function WhatsAppButton({ 
  productName, 
  price, 
  sellerPhone, 
  sellerName,
  productUrl 
}: WhatsAppButtonProps) {
  
  const handleClick = () => {
    // Mensaje pre-llenado
    const message = encodeURIComponent(
      `¡Hola ${sellerName}! 👋\n\n` +
      `Vi este producto en MadsJeez y me interesa:\n\n` +
      `📦 *${productName}*\n` +
      `💰 Precio: $${price.toLocaleString('es-AR')}\n\n` +
      `¿Sigue disponible?\n` +
      `${productUrl}`
    )
    
    // Abrir WhatsApp Web/App
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`
    trackEvent("contact_whatsapp", {
      seller_name: sellerName,
      product_name: productName,
      product_url: productUrl,
      value: Number(price || 0),
    })
    window.open(whatsappUrl, "_blank")
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
    >
      <MessageCircle className="w-5 h-5" />
      Contactar por WhatsApp
    </button>
  )
}
