"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Reveal } from "@/components/seller/premium/motion-primitives"
import { Store, Check } from "lucide-react"

const REG_BENEFITS = [
  "Publicá productos con fotos, precio y stock.",
  "Recibí consultas y ventas desde un solo lugar.",
  "Compartí tu tienda por WhatsApp, Instagram y Facebook.",
  "0% de comisión por venta durante la etapa beta.",
  "Te ayudamos a empezar, para cualquier rubro.",
]

export default function SellerRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    businessName: "",
    cuit: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    acceptsTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.acceptsTerms) {
      setError("Debes aceptar los términos y condiciones")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse como vendedor")
      }

      router.push("/dashboard?registered=seller")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px] lg:items-start">
          {/* Propuesta de valor (premium, motion) */}
          <Reveal className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Store className="h-3.5 w-3.5" /> Crear cuenta de vendedor
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">Empezá a vender en Madsjeez</h1>
            <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
              Sumá un canal de venta sin dejar tus redes. Publicás tu catálogo, recibís consultas y cobrás con tu Mercado Pago.
            </p>
            <ul className="mt-7 space-y-3.5">
              {REG_BENEFITS.map((b, i) => (
                <Reveal as="li" key={b} delay={0.1 + i * 0.06} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Check className="h-4 w-4" /></span>
                  <span className="text-sm leading-6 text-foreground">{b}</span>
                </Reveal>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div><p className="text-2xl font-black text-primary">0%</p><p className="text-xs text-muted-foreground">comisión en la beta</p></div>
              <div><p className="text-2xl font-black text-primary">Mercado Pago</p><p className="text-xs text-muted-foreground">cobrás en tu cuenta</p></div>
              <div><p className="text-2xl font-black text-primary">Minutos</p><p className="text-xs text-muted-foreground">para tu primer producto</p></div>
            </div>
          </Reveal>

          {/* Formulario (intacto) */}
          <Reveal delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Registrarse como Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="businessName">Nombre del negocio</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cuit">CUIT/CUIL</Label>
                  <Input
                    id="cuit"
                    value={formData.cuit}
                    onChange={(e) =>
                      setFormData({ ...formData, cuit: e.target.value })
                    }
                    placeholder="20-12345678-9"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptsTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acceptsTerms: checked as boolean })
                    }
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    Acepto los{" "}
                    <Link href="/legal/terminos" className="text-[#3483FA] hover:underline">
                      términos y condiciones
                    </Link>{" "}
                    para vendedores
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#3483FA]"
                  disabled={loading}
                >
                  {loading ? "Registrando..." : "Comenzar a vender"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </Reveal>
        </div>
      </main>
    </div>
  )
}
