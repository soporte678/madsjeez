"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DriverShell } from "@/components/driver/DriverShell"
import {
  Phone, Truck, CreditCard, Lock, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const inputClass =
  "mt-1 border-white/10 bg-[#0b0f14] text-white placeholder:text-slate-500 focus-visible:ring-[#facc15]/40"

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14]">
        <Loader2 className="h-10 w-10 animate-spin text-[#facc15]" />
      </div>
    )
  }

  return (
    <DriverShell onScan={() => router.push("/driver")}>
      <h2 className="mb-4 text-lg font-bold text-white">Mi perfil</h2>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-[#121820] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <Phone className="h-4 w-4 text-[#facc15]" />
              Datos de contacto
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <Label className="text-xs text-slate-400">Teléfono</Label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs text-slate-400">
                  <Truck className="h-3 w-3" /> Vehículo
                </Label>
                <select
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-white"
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
                <Label className="flex items-center gap-1 text-xs text-slate-400">
                  <CreditCard className="h-3 w-3" /> Licencia (opcional)
                </Label>
                <Input
                  value={profile.licenseNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, licenseNumber: e.target.value }))}
                  placeholder="Número de licencia"
                  className={inputClass}
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#facc15] font-bold text-black hover:bg-[#fde047]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar datos"}
              </Button>
            </form>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121820] p-4">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
              <Lock className="h-4 w-4 text-[#facc15]" />
              Contraseña de acceso
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              {hasPassword
                ? "Cambiá la contraseña que te dio el administrador por una personal."
                : "Definí tu contraseña para ingresar al panel."}
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              {hasPassword && (
                <div>
                  <Label className="text-xs text-slate-400">Contraseña actual</Label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-400">Nueva contraseña</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  minLength={8}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Confirmar nueva contraseña</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  minLength={8}
                  required
                  className={inputClass}
                />
              </div>
              <Button
                type="submit"
                disabled={savingPwd}
                className="w-full rounded-xl border border-white/15 bg-white/5 font-semibold text-white hover:bg-white/10"
              >
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
              </Button>
            </form>
        </div>
    </DriverShell>
  )
}
