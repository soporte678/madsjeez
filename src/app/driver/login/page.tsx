"use client"
import { useState, useEffect, Suspense } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Zap, Mail, Lock, Loader2, AlertCircle, CheckCircle2,
  Truck, Clock, MapPin, DollarSign, Phone, User, CreditCard,
  ChevronDown, Star, Shield, Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Sección de beneficios ────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: <DollarSign className="h-6 w-6 text-yellow-400" />,
    title: "Ingresos diarios",
    desc: "Cobrás por cada entrega completada. Sin esperas — liquidación diaria.",
  },
  {
    icon: <Clock className="h-6 w-6 text-yellow-400" />,
    title: "Horarios flexibles",
    desc: "Trabajás cuando querés. Sin jefe, sin horario fijo, sin mínimo de horas.",
  },
  {
    icon: <Smartphone className="h-6 w-6 text-yellow-400" />,
    title: "Todo desde el celular",
    desc: "App web optimizada para móvil. Escaneás el paquete, navegás al domicilio y confirmás la entrega con foto.",
  },
  {
    icon: <MapPin className="h-6 w-6 text-yellow-400" />,
    title: "Zona local",
    desc: "Solo repartís en tu zona. Sin viajes largos ni rutas desconocidas.",
  },
  {
    icon: <Shield className="h-6 w-6 text-yellow-400" />,
    title: "Respaldo de Madsjeez",
    desc: "Operás bajo el paraguas de Madsjeez, marketplace líder en Argentina.",
  },
  {
    icon: <Star className="h-6 w-6 text-yellow-400" />,
    title: "Crecé con el sistema",
    desc: "A mayor volumen de entregas, mejores tarifas. Cuantos más vendedores usen Flash, más trabajo tenés.",
  },
]

const HOW_IT_WORKS = [
  { step: "1", title: "Registrate", desc: "Completá el formulario con tus datos y tipo de vehículo." },
  { step: "2", title: "Aprobación", desc: "El equipo de Madsjeez valida tu perfil en menos de 24 hs." },
  { step: "3", title: "Recibís pedidos", desc: "Desde tu panel ves los envíos asignados con dirección y QR." },
  { step: "4", title: "Entregás y cobrás", desc: "Escaneás, navegás al domicilio, tomás la foto y listo." },
]

// ─── Formulario de login ──────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, update } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    searchParams.get("error") === "not_driver"
      ? "Sesión anterior sin permisos de chofer. Cerrá sesión abajo e ingresá de nuevo con email y contraseña."
      : ""
  )

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/flash/drivers/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          await update()
          router.replace("/driver")
          router.refresh()
          return
        }
        setError(
          res.status === 403
            ? "Tu cuenta aún no está activa como transportista. Si el admin ya te aprobó, cerrá sesión abajo e ingresá de nuevo."
            : "No podés acceder al portal de choferes con esta sesión. Cerrá sesión e ingresá con email y contraseña."
        )
      })
      .catch(() => {})
  }, [status, router, update])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Email o contraseña incorrectos. Si te registraste recién, usá la misma contraseña del registro.")
        return
      }
      const meRes = await fetch("/api/flash/drivers/me", { credentials: "include", cache: "no-store" })
      if (!meRes.ok) {
        await signOut({ redirect: false })
        if (meRes.status === 403) {
          setError(
            "Tu cuenta aún no está activa como transportista. Si el admin ya te aprobó, esperá 1 minuto y volvé a ingresar."
          )
        } else {
          setError("No podés acceder al portal de choferes con esta cuenta.")
        }
        return
      }
      await update()
      router.replace("/driver")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleClearSession = async () => {
    await signOut({ redirect: false })
    setError("")
    router.replace("/driver/login")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-zinc-300 text-xs mb-1.5 block">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input type="email" placeholder="tucorreo@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
          </div>
        </div>
        <div>
          <Label className="text-zinc-300 text-xs mb-1.5 block">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
          </div>
        </div>
        {error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
            {(searchParams.get("error") === "not_driver" || status === "authenticated") && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSession}
                className="w-full border-zinc-600 text-zinc-200 hover:bg-zinc-800"
              >
                Cerrar sesión e intentar de nuevo
              </Button>
            )}
          </div>
        )}
        <Button type="submit" disabled={loading || !email || !password}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black h-11">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ingresar al panel"}
        </Button>
      </form>
      <p className="text-center text-zinc-500 text-sm">
        ¿No tenés cuenta?{" "}
        <button onClick={onSwitch} className="text-yellow-400 hover:text-yellow-300 font-semibold">
          Registrate acá
        </button>
      </p>
    </div>
  )
}

// ─── Formulario de registro ───────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", dni: "", vehicleType: "moto", province: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/flash/drivers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? "Error al registrarse"); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="text-center py-4 space-y-3">
      <CheckCircle2 className="h-12 w-12 text-yellow-400 mx-auto" />
      <h3 className="text-white font-bold text-lg">¡Solicitud enviada!</h3>
      <p className="text-zinc-400 text-sm">
        Revisamos tu perfil en menos de 24 hs. Te avisamos por email cuando esté aprobado.
      </p>
      <button onClick={onSwitch} className="text-yellow-400 text-sm hover:underline">
        Volver al login
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-zinc-300 text-xs mb-1 block">Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Juan Pérez" value={form.name} onChange={set("name")} required
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-zinc-300 text-xs mb-1 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input type="email" placeholder="tucorreo@email.com" value={form.email} onChange={set("email")} required
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-zinc-300 text-xs mb-1 block">Contraseña (mín. 8 caracteres)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required minLength={8}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Teléfono / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="1145678901" value={form.phone} onChange={set("phone")} required
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">DNI</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="12345678" value={form.dni} onChange={set("dni")} required maxLength={8}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Vehículo</Label>
            <select value={form.vehicleType} onChange={set("vehicleType")}
              className="w-full h-10 rounded-md border border-zinc-700 bg-zinc-800 text-white text-sm px-3 focus:border-yellow-400 focus:outline-none">
              <option value="moto">🏍️ Moto</option>
              <option value="bici">🚲 Bici</option>
              <option value="auto">🚗 Auto</option>
              <option value="furgoneta">🚐 Furgoneta</option>
            </select>
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Provincia</Label>
            <Input placeholder="Buenos Aires" value={form.province} onChange={set("province")}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <Button type="submit" disabled={loading || !form.name || !form.email || !form.password || !form.phone || !form.dni}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black h-11 mt-1">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar solicitud"}
        </Button>
        <p className="text-zinc-600 text-xs text-center">
          Tu cuenta queda pendiente de aprobación. Te avisamos en menos de 24 hs.
        </p>
      </form>
      <p className="text-center text-zinc-500 text-sm">
        ¿Ya tenés cuenta?{" "}
        <button onClick={onSwitch} className="text-yellow-400 hover:text-yellow-300 font-semibold">
          Iniciá sesión
        </button>
      </p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
function DriverLoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login")

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center bg-yellow-400 rounded-2xl w-16 h-16 mb-5 shadow-lg shadow-yellow-400/20">
            <Zap className="h-9 w-9 text-black fill-black" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            ⚡ FLASH — Reparto exprés
          </h1>
          <p className="text-xl text-zinc-300 font-medium mb-2">
            El sistema de logística de Madsjeez para entregas en 24 horas
          </p>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Sumarte como transportista Flash te permite recibir pedidos de vendedores del marketplace
            y entregarlos el mismo día. Trabajás con tu propio vehículo, en tu zona, a tu ritmo.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-yellow-400" /> Sin horario fijo</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-yellow-400" /> Cobro diario</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-yellow-400" /> 100% móvil</span>
          </div>
          <a href="#unirse" className="inline-flex items-center gap-1 mt-8 text-yellow-400 text-sm font-semibold hover:text-yellow-300">
            Quiero sumarme <ChevronDown className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* ── Cómo funciona ── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-black text-center mb-10">¿Cómo funciona?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-400 text-black font-black text-lg flex items-center justify-center mx-auto mb-3">
                {s.step}
              </div>
              <p className="font-bold text-sm mb-1">{s.title}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section className="bg-zinc-950 border-y border-zinc-800 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-black text-center mb-10">Por qué elegir Flash</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                <div className="mb-3">{b.icon}</div>
                <p className="font-bold text-sm mb-1">{b.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Requisitos ── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-black text-center mb-8">Requisitos para ser transportista</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: <Truck className="h-5 w-5 text-yellow-400" />, text: "Vehículo propio (moto, bici, auto o furgoneta)" },
            { icon: <CreditCard className="h-5 w-5 text-yellow-400" />, text: "DNI argentino vigente" },
            { icon: <Smartphone className="h-5 w-5 text-yellow-400" />, text: "Celular con acceso a internet y cámara" },
          ].map((r) => (
            <div key={r.text} className="flex items-start gap-3 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              {r.icon}
              <p className="text-zinc-300 text-sm">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Auth card ── */}
      <section id="unirse" className="max-w-sm mx-auto px-6 pb-20">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-xl bg-zinc-800 p-1 mb-5">
            {(["login", "register"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-yellow-400 text-black" : "text-zinc-400 hover:text-white"}`}>
                {t === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="h-6 w-6 text-yellow-400 animate-spin" /></div>}>
            {tab === "login"
              ? <LoginForm onSwitch={() => setTab("register")} />
              : <RegisterForm onSwitch={() => setTab("login")} />
            }
          </Suspense>
        </div>
      </section>

      <footer className="text-center text-zinc-700 text-xs pb-8">
        Madsjeez Flash · Sistema de logística · Argentina
      </footer>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Zap className="h-10 w-10 text-yellow-400 animate-pulse" />
      </div>
    }>
      <DriverLoginPage />
    </Suspense>
  )
}
