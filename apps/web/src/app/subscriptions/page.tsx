import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Diamond,
  BarChart3,
  Headphones,
  BadgeCheck,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const plans = [
  {
    id: "free",
    name: "Gratis",
    priceArs: 0,
    priceUsd: 0,
    commission: 10,
    description: "Comienza a vender sin costo",
    icon: null,
    color: "gray",
    popular: false,
    features: {
      products: "Ilimitadas",
      images: "5 por producto",
      analytics: "Básicas",
      support: "Email (48-72h)",
      searchPriority: false,
      promotions: "0 mensuales",
      export: false,
      api: false,
    },
  },
  {
    id: "plata",
    name: "Plata",
    priceArs: 9999,
    priceUsd: 9.99,
    commission: 5,
    description: "Perfecto para vendedores en crecimiento",
    icon: Zap,
    color: "slate",
    popular: false,
    features: {
      products: "Ilimitadas",
      images: "10 por producto",
      analytics: "Básicas",
      support: "Email (24-48h)",
      searchPriority: false,
      promotions: "0 mensuales",
      export: false,
      api: false,
    },
  },
  {
    id: "gold",
    name: "Gold",
    priceArs: 19999,
    priceUsd: 19.99,
    commission: 3,
    description: "Para vendedores serios",
    icon: Crown,
    color: "yellow",
    popular: true,
    features: {
      products: "Ilimitadas",
      images: "15 por producto",
      analytics: "Avanzadas con gráficos",
      support: "Prioritario (12-24h)",
      searchPriority: true,
      promotions: "2 mensuales",
      export: "CSV",
      api: false,
    },
  },
  {
    id: "platinum",
    name: "Platinum",
    priceArs: 49999,
    priceUsd: 49.99,
    commission: 1,
    description: "La experiencia definitiva",
    icon: Diamond,
    color: "purple",
    popular: false,
    features: {
      products: "Ilimitadas",
      images: "20 por producto",
      analytics: "Personalizadas + API",
      support: "24/7 con agente dedicado",
      searchPriority: true,
      promotions: "5 mensuales",
      export: "CSV/Excel/API",
      api: true,
    },
  },
];

const featureLabels: Record<string, string> = {
  products: "Publicaciones",
  images: "Imágenes por producto",
  analytics: "Métricas y estadísticas",
  support: "Soporte técnico",
  searchPriority: "Prioridad en búsquedas",
  promotions: "Impulsos incluidos",
  export: "Exportación de datos",
  api: "Acceso a API",
};

async function getCurrentSubscription(userId: string | null) {
  if (!userId) return null;
  
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(`
      *,
      tier:subscription_tiers(*)
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  
  return data as any;
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const currentSubscription = await getCurrentSubscription(session?.user?.id || null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={session?.user ? { id: session.user.id, email: session.user.email! } : null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Hero */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Elige tu plan de vendedor
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desbloquea herramientas profesionales, reduce tus comisiones y aumenta 
              la visibilidad de tus productos con nuestros planes de suscripción.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentSubscription?.tier?.tier_type === plan.id;
              
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.popular ? "border-[#3483FA] shadow-lg scale-105" : ""
                  } ${isCurrent ? "ring-2 ring-green-500" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3483FA]">
                      Más popular
                    </Badge>
                  )}
                  
                  {isCurrent && (
                    <Badge className="absolute -top-3 right-4 bg-green-500">
                      Tu plan actual
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    {Icon && (
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                        plan.color === "yellow" ? "bg-yellow-100" :
                        plan.color === "purple" ? "bg-purple-100" :
                        plan.color === "slate" ? "bg-slate-100" :
                        "bg-gray-100"
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          plan.color === "yellow" ? "text-yellow-600" :
                          plan.color === "purple" ? "text-purple-600" :
                          plan.color === "slate" ? "text-slate-600" :
                          "text-gray-600"
                        }`} />
                      </div>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">
                          ${plan.priceArs.toLocaleString()}
                        </span>
                        <span className="text-gray-500">/mes</span>
                      </div>
                      {plan.priceUsd > 0 && (
                        <p className="text-sm text-gray-400">
                          USD ${plan.priceUsd}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <TrendingUp className="h-4 w-4" />
                      {plan.commission}% comisión
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <Separator className="mb-4" />

                    <ul className="space-y-3 flex-1">
                      {Object.entries(plan.features).map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2">
                          {value ? (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm">
                            <span className="font-medium">{featureLabels[key]}:</span>{" "}
                            {typeof value === "boolean" ? (value ? "Sí" : "No") : value}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isCurrent ? (
                        <Button className="w-full" variant="outline" disabled>
                          Plan actual
                        </Button>
                      ) : (
                        <Link href={`/subscriptions/checkout?plan=${plan.id}`}>
                          <Button 
                            className={`w-full ${
                              plan.popular 
                                ? "bg-[#3483FA] hover:bg-[#2968C8]" 
                                : ""
                            }`}
                          >
                            {plan.id === "free" ? "Comenzar gratis" : "Suscribirme"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Comparativa completa</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Característica</th>
                      <th className="text-center py-3 px-4">Gratis</th>
                      <th className="text-center py-3 px-4">Plata</th>
                      <th className="text-center py-3 px-4 bg-blue-50">Gold</th>
                      <th className="text-center py-3 px-4">Platinum</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="py-3 px-4">Precio mensual</td>
                      <td className="text-center py-3 px-4">Gratis</td>
                      <td className="text-center py-3 px-4">$9.999</td>
                      <td className="text-center py-3 px-4 bg-blue-50">$19.999</td>
                      <td className="text-center py-3 px-4">$49.999</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Comisión por venta</td>
                      <td className="text-center py-3 px-4">10%</td>
                      <td className="text-center py-3 px-4">5%</td>
                      <td className="text-center py-3 px-4 bg-blue-50">3%</td>
                      <td className="text-center py-3 px-4">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Publicaciones</td>
                      <td className="text-center py-3 px-4">Ilimitadas</td>
                      <td className="text-center py-3 px-4">Ilimitadas</td>
                      <td className="text-center py-3 px-4 bg-blue-50">Ilimitadas</td>
                      <td className="text-center py-3 px-4">Ilimitadas</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Imágenes por producto</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">10</td>
                      <td className="text-center py-3 px-4 bg-blue-50">15</td>
                      <td className="text-center py-3 px-4">20</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Métricas avanzadas</td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Prioridad en búsquedas</td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                      <td className="text-center py-3 px-4"><X className="h-4 w-4 mx-auto text-gray-300" /></td>
                      <td className="text-center py-3 px-4 bg-blue-50"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Impulsos mensuales incluidos</td>
                      <td className="text-center py-3 px-4">0</td>
                      <td className="text-center py-3 px-4">0</td>
                      <td className="text-center py-3 px-4 bg-blue-50">2</td>
                      <td className="text-center py-3 px-4">5</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Soporte</td>
                      <td className="text-center py-3 px-4">Email (48-72h)</td>
                      <td className="text-center py-3 px-4">Email (24-48h)</td>
                      <td className="text-center py-3 px-4 bg-blue-50">Prioritario</td>
                      <td className="text-center py-3 px-4">24/7 Dedicado</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Preguntas frecuentes</h2>
            
            <div className="space-y-4">
              {[
                {
                  q: "¿Puedo cambiar de plan en cualquier momento?",
                  a: "Sí, puedes hacer upgrade a un plan superior en cualquier momento. El cambio es inmediato y se cobra la diferencia prorrateada. Para hacer downgrade, el cambio se efectuará al inicio del próximo ciclo de facturación.",
                },
                {
                  q: "¿Cómo funcionan los impulsos incluidos?",
                  a: "Los impulsos incluidos en los planes Gold y Platinum se renuevan mensualmente. Debes activarlos manualmente en las publicaciones que deseas destacar. No se acumulan de un mes a otro.",
                },
                {
                  q: "¿Hay período de prueba?",
                  a: "Sí, ofrecemos 14 días de garantía de satisfacción en tu primer mes. Si no estás conforme, puedes cancelar y solicitar reembolso completo dentro de este período.",
                },
                {
                  q: "¿Qué pasa si cancelo mi suscripción?",
                  a: "Al cancelar, tu cuenta vuelve al plan Gratis al finalizar el período pagado. Tus publicaciones se mantienen pero ajustadas a los límites del plan gratuito.",
                },
                {
                  q: "¿Puedo pagar anualmente?",
                  a: "Sí, ofrecemos descuentos especiales por pago anual adelantado. Contacta a nuestro equipo de ventas para más información.",
                },
              ].map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-4 py-12">
          <div className="bg-[#3483FA] rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Tienes dudas?
            </h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Nuestro equipo está disponible para ayudarte a elegir el plan que mejor se adapte a tus necesidades.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/help">
                <Button variant="secondary">
                  Centro de ayuda
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-[#FEE500] text-[#333333] hover:bg-[#FFD700]">
                  Contactar ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
