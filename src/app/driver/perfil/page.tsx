"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Zap, ArrowLeft, Phone, Truck, CreditCard, Lock, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DriverProfile = {
  id: string
  phone: string
  vehicleType: string
  licenseNumber: string | null
  user: { name: string | null; email: string }
}

export default function DriverProfilePage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasPassword, setHasPassword] = useState(true)

  const [profile, setProfile] = useState({
    phone: "",
    vehicleType: "moto",
    licenseNumber: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/driver/login")
      return
    }
    if (status !== "authenticated") return

    fetch("/api/flash/drivers/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/driver/login")
          return
        }
        const data = await res.json()
        const d = data.driver as DriverProfile
        setHasPassword(Boolean(data.hasPassword))
        setProfile({
          phone: d.phone,
          vehicleType: d.vehicleType,
          licenseNumber: d.licenseNumber ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [status, router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/flash/drivers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: profile.phone,
          vehicleType: profile.vehicleType,
          licenseNumber: profile.licenseNumber || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar")
        return
      }
      setSuccess("Datos actualizados correctamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.")
      return
    }
    setSavingPwd(true)
    try {
      const res = await fetch("/api/flash/drivers/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: hasPassword ? passwordForm.currentPassword : undefined,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar la contraseña")
        return
      }
      setHasPassword(true)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setSuccess("Contraseña actualizada. Usala la próxima vez que ingreses.")
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/driver"
            className="p-2 rounded-lg border bg-white hover:bg-gray-50"
            aria-label="Volver al panel"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-yellow-400 rounded-full p-2">
              <Zap className="h-5 w-5 text-black fill-black" />
            </div>
            <h1 className="font-black text-lg">Mi perfil</h1>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-600" />
              Datos de contacto
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Vehículo
                </Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white mt-1"
                  value={profile.vehicleType}
                  onChange={(e) => setProfile((p) => ({ ...p, vehicleType: e.target.value }))}
                >
                  <option value="moto">Moto</option>
                  <option value="bici">Bici</option>
                  <option value="auto">Auto</option>
                  <option value="furgoneta">Furgoneta</option>
                </select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Licencia (opcional)
                </Label>
                <Input
                  value={profile.licenseNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, licenseNumber: e.target.value }))}
                  placeholder="Número de licencia"
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar datos"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-600" />
              Contraseña de acceso
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              {hasPassword
                ? "Cambiá la contraseña que te dio el administrador por una personal."
                : "Definí tu contraseña para ingresar al panel."}
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              {hasPassword && (
                <div>
                  <Label className="text-xs">Contraseña actual</Label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs">Nueva contraseña</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  minLength={8}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Confirmar nueva contraseña</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  minLength={8}
                  required
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={savingPwd}
                className="w-full font-semibold"
              >
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
