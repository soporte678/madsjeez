"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Check, 
  Sparkles, 
  Crown, 
  Gem, 
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  Clock,
  Percent,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  price: number
  description: string
  icon: any
  color: string
  features: string[]
  commission: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: "PLATA",
    name: "PLATA",
    price: 9999,
    description: "Para vendedores que están empezando",
    icon: Zap,
    color: "#C0C0C0",
    commission: "15%",
    features: [
      "Hasta 100 productos activos",
      "Publicaciones destacadas: 5",
      "Soporte por email",
      "Estadísticas básicas",
      "App móvil para gestión",
      "Chat con clientes",
      "Integración WhatsApp Business",
    ]
  },
  {
    id: "GOLD",
    name: "GOLD",
    price: 19999,
    description: "Para vendedores en crecimiento",
    icon: Crown,
    color: "#FFD700",
    commission: "10%",
    popular: true,
    features: [
      "Hasta 500 productos activos",
      "Publicaciones destacadas: 20",
      "Soporte prioritario 24/7",
      "Estadísticas avanzadas",
      "App móvil con IA integrada",
      "Chat con IA integrada",
      "Integración WhatsApp + Meta API",
      "TikTok Shop integrado",
      "Promociones automáticas",
    ]
  },
  {
    id: "PLATINUM",
    name: "PLATINUM",
    price: 49999,
    description: "Para empresas y sellers profesionales",
    icon: Gem,
    color: "#00D4FF",
    commission: "5%",
    features: [
      "Productos ilimitados",
      "Publicaciones destacadas: ilimitadas",
      "Ejecutivo de cuenta dedicado",
      "IA Premium: generación de contenido",
      "Meta API Enterprise completo",
      "TikTok Ads + TikTok Shop PRO",
      "Retiro de dinero inmediato",
      "API completa para integraciones",
      "White label opcional",
      "Soporte telefónico VIP",
    ]
  }
]

const billingOptions = [
  { months: 1, label: "Mensual", discount: 0 },
  { months: 6, label: "6 meses", discount: 20, badge: "¡AHORRÁ 20%!" },
  { months: 12, label: "12 meses", discount: 30, badge: "¡MEJOR OPCIÓN!" }
]

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedBilling, setSelectedBilling] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3483FA]" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Inicia sesión</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para ver y contratar suscripciones</p>
          <Link href="/auth/login">
            <Button className="w-full bg-[#3483FA] hover:bg-[#2968C8]">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const calculatePrice = (basePrice: number, months: number, discount: number) => {
    const totalWithoutDiscount = basePrice * months
    const discountAmount = totalWithoutDiscount * (discount / 100)
    const finalPrice = totalWithoutDiscount - discountAmount
    return {
      totalWithoutDiscount,
      discountAmount,
      finalPrice,
      monthlyPrice: finalPrice / months
    }
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error("Selecciona un plan")
      return
    }

    setIsLoading(true)
    
    try {
      const plan = plans.find(p => p.id === selectedPlan)
      const billing = billingOptions.find(b => b.months === selectedBilling)
      
      if (!plan || !billing) return

      const { finalPrice } = calculatePrice(plan.price, billing.months, billing.discount)

      // Crear preferencia de MercadoPago
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedPlan,
          billingCycle: selectedBilling,
          totalAmount: finalPrice,
          discountPercent: billing.discount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al procesar la suscripción")
      }

      const data = await response.json()
      
      if (data.initPoint) {
        // Redirigir a MercadoPago
        window.location.href = data.initPoint
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pago")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B4A] via-[#FFC107] to-[#00D4FF] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
            Suscripciones MadsJeez
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Accedé a todas las funciones de la plataforma y hacé crecer tu negocio
          </p>
          
          {/* Billing Selector */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {billingOptions.map((option) => (
              <button
                key={option.months}
                onClick={() => setSelectedBilling(option.months)}
                className={`relative px-6 py-3 rounded-xl font-bold transition-all ${
                  selectedBilling === option.months
                    ? "bg-white text-[#1a1a2e] shadow-2xl scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {option.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B4A] text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                    {option.badge}
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-lg">{option.label}</span>
                  {option.discount > 0 && (
                    <span className="text-sm font-semibold text-green-600">
                      {option.discount}% OFF
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const billing = billingOptions.find(b => b.months === selectedBilling)
            const { totalWithoutDiscount, discountAmount, finalPrice, monthlyPrice } = calculatePrice(
              plan.price, 
              billing?.months || 1, 
              billing?.discount || 0
            )
            const isSelected = selectedPlan === plan.id
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "ring-4 ring-[#3483FA] scale-105 shadow-2xl"
                    : "hover:scale-102 hover:shadow-xl"
                } ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FFC107] to-[#FFD700] text-slate-900 px-4 py-1 rounded-full text-sm font-black shadow-lg">
                    MÁS POPULAR
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: plan.color }} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-gray-800">
                      ${Math.round(monthlyPrice).toLocaleString()}
                    </span>
                    <span className="text-gray-400">/mes</span>
                  </div>
                  
                  {billing && billing.discount > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-400 line-through">
                        ${plan.price.toLocaleString()}/mes
                      </p>
                      <p className="text-green-600 font-semibold text-sm">
                        Total: ${finalPrice.toLocaleString()} 
                        <span className="text-gray-500 font-normal">
                          ({billing.months} meses)
                        </span>
                      </p>
                      <p className="text-xs text-green-600">
                        ¡Ahorrás ${discountAmount.toLocaleString()}!
                      </p>
                    </div>
                  )}

                  <div 
                    className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold"
                    style={{ 
                      backgroundColor: `${plan.color}20`,
                      color: plan.color 
                    }}
                  >
                    {plan.commission} COMISIÓN POR VENTA
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div 
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${plan.color}20` }}
                      >
                        <Check className="w-3 h-3" style={{ color: plan.color }} />
                      </div>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <Button
                  className={`w-full py-6 text-lg font-bold rounded-xl transition-all ${
                    isSelected
                      ? "bg-[#3483FA] hover:bg-[#2968C8] text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  {isSelected ? (
                    <>
                      Seleccionado
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    "Seleccionar plan"
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Summary & CTA */}
        {selectedPlan && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Resumen de tu suscripción
              </h3>
              
              {(() => {
                const plan = plans.find(p => p.id === selectedPlan)
                const billing = billingOptions.find(b => b.months === selectedBilling)
                if (!plan || !billing) return null
                
                const { finalPrice, discountAmount } = calculatePrice(
                  plan.price, 
                  billing.months, 
                  billing.discount
                )

                return (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Plan {plan.name}</span>
                      <span className="font-semibold">${plan.price.toLocaleString()}/mes</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Período</span>
                      <span className="font-semibold">{billing.months} meses</span>
                    </div>
                    {billing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento ({billing.discount}%)</span>
                        <span className="font-semibold">-${discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                      <span>Total a pagar</span>
                      <span className="text-[#3483FA]">${finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}

              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] hover:from-[#E55A3A] hover:to-[#E57A32] text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Contratar ahora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                Pago seguro procesado por MercadoPago
              </p>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Preguntas frecuentes
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <h4 className="font-bold text-[#FFC107] mb-2 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                ¿Cómo funcionan los descuentos?
              </h4>
              <p className="text-white/80 text-sm">
                Al pagar 6 meses te damos 20% de descuento. Si pagás 12 meses, el descuento es del 30%. 
                El descuento se aplica al total del período contratado.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <h4 className="font-bold text-[#00D4FF] mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ¿Puedo cambiar de plan?
              </h4>
              <p className="text-white/80 text-sm">
                Sí, podés upgradear tu plan en cualquier momento. La diferencia se prorratea 
                según los días restantes de tu suscripción actual.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <h4 className="font-bold text-[#FF6B4A] mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ¿Qué pasa si no renuevo?
              </h4>
              <p className="text-white/80 text-sm">
                Tu cuenta pasa al plan FREE con funciones limitadas. Podés volver a contratar 
                cuando quieras y recuperar todas las funcionalidades.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <h4 className="font-bold text-[#7CFC00] mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                ¿Hay período de prueba?
              </h4>
              <p className="text-white/80 text-sm">
                Ofrecemos 14 días de prueba gratuita en el plan GOLD. No se requiere tarjeta 
                de crédito para comenzar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
