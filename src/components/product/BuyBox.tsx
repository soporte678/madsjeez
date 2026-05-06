"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Truck, ShieldCheck, Award, MapPin, MessageCircle, Package } from "lucide-react"
import { toast } from "sonner"
import { WholesalePriceDisplay } from "./WholesalePriceDisplay"

interface BuyBoxProps {
  productId: string
  productTitle: string
  basePrice: number
  originalPrice: number | null
  freeShipping: boolean
  shippingCost: number
  stock: number
  sellerId: string
  sellerName: string
  sellerRepLevel: string
  sellerRepColor: string
  sellerTotalSales: number
  isNewSeller: boolean
  salesCount: number
  discount: number | null
  cuotas6: number
}

function upsertGuestCartItem(params: {
  productId: string
  productTitle: string
  unitPrice: number
  quantity: number
  freeShipping: boolean
  sellerId: string
  sellerName: string
  maxStock: number
}) {
  const key = "guestCart"
  const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null
  const list = raw ? (JSON.parse(raw) as GuestCartLine[]) : []
  const idx = list.findIndex((l) => l.productId === params.productId)
  const desired =
    idx >= 0 ? list[idx].quantity + params.quantity : params.quantity
  const qty = Math.min(desired, params.maxStock)
  const line: GuestCartLine = {
    id: idx >= 0 ? list[idx].id : `guest-${params.productId}-${Date.now()}`,
    productId: params.productId,
    quantity: qty,
    product: {
      id: params.productId,
      title: params.productTitle,
      price: params.unitPrice,
      shipping_free: params.freeShipping,
      seller_id: params.sellerId,
      primary_image: null,
      seller_name: params.sellerName,
    },
  }
  if (idx >= 0) list[idx] = line
  else list.push(line)
  localStorage.setItem(key, JSON.stringify(list))
}

type GuestCartLine = {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    title: string
    price: number
    shipping_free: boolean
    seller_id: string
    primary_image: string | null
    seller_name: string
  }
}

export function BuyBox({
  productId,
  productTitle,
  basePrice,
  originalPrice,
  freeShipping,
  shippingCost: _shippingCost,
  stock,
  sellerId,
  sellerName,
  sellerRepLevel,
  sellerRepColor,
  sellerTotalSales,
  isNewSeller,
  salesCount: _salesCount,
  discount,
  cuotas6,
}: BuyBoxProps) {
  const router = useRouter()
  const { status } = useSession()
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(basePrice)
  const [busy, setBusy] = useState<null | "cart" | "buy">(null)

  const handleQuantityChange = (qty: number, price: number) => {
    setQuantity(qty)
    setUnitPrice(price)
  }

  const totalPrice = unitPrice * quantity

  const addViaApi = async (qty: number) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: qty }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || "No se pudo agregar al carrito")
    }
  }

  const handleAddToCart = async () => {
    if (stock < 1) {
      toast.error("Sin stock")
      return
    }
    if (quantity > stock) {
      toast.error("Cantidad mayor al stock disponible")
      return
    }

    setBusy("cart")
    try {
      if (status === "authenticated") {
        await addViaApi(quantity)
        toast.success("Agregado al carrito")
      } else {
        upsertGuestCartItem({
          productId,
          productTitle,
          unitPrice,
          quantity,
          freeShipping,
          sellerId,
          sellerName,
          maxStock: stock,
        })
        toast.success("Agregado al carrito")
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al agregar")
    } finally {
      setBusy(null)
    }
  }

  const handleBuyNow = async () => {
    if (stock < 1) {
      toast.error("Sin stock")
      return
    }
    if (quantity > stock) {
      toast.error("Cantidad mayor al stock disponible")
      return
    }

    setBusy("buy")
    try {
      if (status === "authenticated") {
        await addViaApi(quantity)
        router.push("/checkout")
      } else {
        upsertGuestCartItem({
          productId,
          productTitle,
          unitPrice,
          quantity,
          freeShipping,
          sellerId,
          sellerName,
          maxStock: stock,
        })
        router.push("/auth/login?redirect=/checkout")
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      {/* Wholesale Prices */}
      <WholesalePriceDisplay 
        productId={productId} 
        basePrice={basePrice} 
        onQuantityChange={handleQuantityChange}
      />

      <div className="flex flex-col gap-1 mb-6 mt-4">
        {freeShipping ? (
          <>
            <span className="text-emerald-500 font-semibold text-[15px] flex items-center gap-1"><Truck size={18}/> Llega gratis mañana</span>
            <span className="text-emerald-500 text-[13px] mt-0.5">Llega mañana entre las 10 y 12 hs.</span>
            <Link href="#" className="text-blue-500 text-[13px] hover:underline mt-1">Más detalles y formas de entrega</Link>
          </>
        ) : (
          <>
            <span className="text-gray-700 font-semibold text-[15px] flex items-center gap-1"><Truck size={18}/> Envío a calcular</span>
            <Link href="#" className="text-blue-500 text-[13px] hover:underline mt-1">Ver opciones de envío</Link>
          </>
        )}
        <span className="text-gray-500 text-[13px] mt-1 flex items-center gap-1">
          <MapPin size={14}/> Capital Federal
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-baseline gap-2">
          {originalPrice && originalPrice > totalPrice && (
            <span className="text-gray-400 line-through text-[15px]">${originalPrice.toLocaleString("es-AR")}</span>
          )}
          <span className="text-[36px] font-light text-gray-800">${totalPrice.toLocaleString("es-AR")}</span>
        </div>
        {discount && (
          <span className="text-emerald-500 font-medium">{discount}% OFF</span>
        )}
        <span className="text-emerald-500 font-medium">
          Mismo precio en 6 cuotas de ${cuotas6.toLocaleString("es-AR")}
        </span>
        <Link href="#" className="text-blue-500 text-[13px] hover:underline">Ver los medios de pago</Link>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <button
          type="button"
          disabled={busy !== null || stock < 1}
          onClick={handleBuyNow}
          className="w-full bg-[#3483fa] text-white font-semibold py-3.5 rounded-md hover:bg-[#2968c8] transition-colors text-center text-[16px] disabled:opacity-60"
        >
          {busy === "buy" ? "Procesando…" : "Comprar ahora"}
        </button>
        <button
          type="button"
          disabled={busy !== null || stock < 1}
          onClick={handleAddToCart}
          className="w-full bg-[#d7e7ff] text-[#3483fa] font-semibold py-3.5 rounded-md hover:bg-[#c5dcfa] transition-colors text-[16px] disabled:opacity-60"
        >
          {busy === "cart" ? "Agregando…" : "Agregar al carrito"}
        </button>
      </div>

      {/* Stock info */}
      <div className="flex items-center gap-2 text-[13px] text-gray-600 mb-4">
        <Package size={16} />
        <span>{stock > 0 ? `${stock} unidades disponibles` : "Sin stock"}</span>
      </div>

      {/* Seller Info */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-sm">{sellerName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <Link href={`/seller/${sellerId}`} className="text-blue-600 hover:underline text-[14px] font-medium">
              {sellerName}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                sellerRepColor === "VERDE" ? "bg-green-100 text-green-700" :
                sellerRepColor === "AMARILLO" ? "bg-primary/10 text-primary" :
                sellerRepColor === "ROJO" ? "bg-red-100 text-red-700" :
                "bg-green-100 text-green-700"
              }`}>
                {sellerRepLevel}
              </span>
              <span className="text-[12px] text-gray-500">{sellerTotalSales} ventas</span>
            </div>
            {isNewSeller && (
              <span className="text-[11px] text-gray-400 mt-1 block">Vendedor nuevo</span>
            )}
          </div>
          <Link 
            href={`/messages?seller=${sellerId}&product=${productId}`}
            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
          >
            <MessageCircle size={20} />
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
        <div className="flex items-start gap-2 text-[13px]">
          <ShieldCheck size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-blue-600 font-medium">Compra Protegida</span>
            <span className="text-gray-600">, recibí el producto que esperabas o te devolvemos tu dinero.</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-[13px]">
          <Award size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-blue-600 font-medium">Mercado Puntos</span>
            <span className="text-gray-600">. Sumás 150 puntos.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
