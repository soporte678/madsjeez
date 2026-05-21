"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Clock, UserCheck, Users, Home, UserX, X, Loader2 } from "lucide-react"
import type { FlashReceiverType } from "@prisma/client"

interface AuthorizedPerson { id: string; name: string; dni: string }

interface Props {
  shipmentId: string
  attemptId: string
  recipientName: string
  recipientDni: string
  authorizedPeople: AuthorizedPerson[]
  arrivedAt: Date
  onDelivered: () => void
  onFailed: () => void
}

interface PhotoEntry {
  preview: string    // object URL local para la miniatura
  path: string       // path en Supabase Storage (ej: "shipmentId/userId_abc.jpg")
  uploading: boolean
  error: boolean
}

const RECEIVER_OPTIONS: { type: FlashReceiverType; label: string; icon: React.ReactNode }[] = [
  { type: "TITULAR",    label: "Titular del pedido",       icon: <UserCheck className="h-4 w-4" /> },
  { type: "AUTHORIZED", label: "Otro titular autorizado",  icon: <Users className="h-4 w-4" /> },
  { type: "FAMILY",     label: "Familiar",                 icon: <Home className="h-4 w-4" /> },
  { type: "NEIGHBOR",   label: "Vecino",                   icon: <UserX className="h-4 w-4" /> },
]

export function FlashDeliveryConfirm({
  shipmentId, attemptId, recipientName, recipientDni,
  authorizedPeople, arrivedAt, onDelivered, onFailed,
}: Props) {
  const [receiverType, setReceiverType] = useState<FlashReceiverType | null>(null)
  const [receiverName, setReceiverName] = useState("")
  const [receiverDni, setReceiverDni] = useState("")
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [canMarkFailed, setCanMarkFailed] = useState(false)
  const objectUrlsRef = useRef<string[]>([])

  // Countdown 10 minutos
  useEffect(() => {
    const tick = () => {
      const waited = Math.floor((Date.now() - new Date(arrivedAt).getTime()) / 1000)
      setWaitSeconds(waited)
      setCanMarkFailed(waited >= 600)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [arrivedAt])

  // Liberar object URLs al desmontar
  useEffect(() => {
    return () => { objectUrlsRef.current.forEach(URL.revokeObjectURL) }
  }, [])

  const remaining = Math.max(0, 600 - waitSeconds)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const handleTypeSelect = (t: FlashReceiverType) => {
    setReceiverType(t)
    if (t === "TITULAR") {
      setReceiverName(recipientName)
      setReceiverDni(recipientDni)
    } else if (t === "AUTHORIZED" && authorizedPeople.length > 0) {
      setReceiverName(authorizedPeople[0].name)
      setReceiverDni(authorizedPeople[0].dni)
    } else {
      setReceiverName("")
      setReceiverDni("")
    }
  }

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("shipmentId", shipmentId)

    try {
      const res = await fetch("/api/flash/photos/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir")
      // Guardar el PATH (no la URL firmada) — se regenera on-demand
      setPhotoEntries((prev) =>
        prev.map((e, i) => i === index ? { ...e, path: data.path, uploading: false } : e)
      )
    } catch {
      setPhotoEntries((prev) =>
        prev.map((e, i) => i === index ? { ...e, uploading: false, error: true } : e)
      )
    }
  }

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const slots = 5 - photoEntries.length
    const toAdd = files.slice(0, slots)

    setPhotoEntries((prev) => {
      const startIndex = prev.length
      const newEntries: PhotoEntry[] = toAdd.map((file) => {
        const preview = URL.createObjectURL(file)
        objectUrlsRef.current.push(preview)
        return { preview, path: "", uploading: true, error: false }
      })
      toAdd.forEach((file, i) => uploadFile(file, startIndex + i))
      return [...prev, ...newEntries]
    })
    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotoEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const retryUpload = async (index: number) => {
    // Re-intentar: el usuario debe volver a seleccionar la foto
    removePhoto(index)
  }

  const handleDeliver = async () => {
    if (!receiverType || !receiverName || !receiverDni) {
      setError("Completá todos los datos del receptor"); return
    }
    if (photoEntries.length === 0) { setError("Agregá al menos 1 foto de evidencia"); return }
    if (photoEntries.some((p) => p.uploading)) { setError("Esperá que terminen de subir las fotos"); return }
    if (photoEntries.some((p) => p.error)) { setError("Hay fotos con error — eliminalas y volvé a intentarlo"); return }

    // Enviamos paths de Storage al servidor (no URLs firmadas que vencen)
    const photos = photoEntries.map((p) => p.path)
    setError(""); setLoading(true)
    try {
      const res = await fetch(`/api/flash/shipments/${shipmentId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverType, receiverName, receiverDni, photos, attemptId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al confirmar"); return }
      onDelivered()
    } finally { setLoading(false) }
  }

  const handleFailed = async () => {
    if (!canMarkFailed) return
    setLoading(true)
    try {
      const res = await fetch(`/api/flash/shipments/${shipmentId}/failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, arrivedAt }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return }
      onFailed()
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-base flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" /> Confirmar entrega
      </h3>

      {/* Selector de receptor */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-gray-500">¿Quién recibe el paquete?</Label>
        {RECEIVER_OPTIONS.map((opt) => {
          if (opt.type === "AUTHORIZED" && authorizedPeople.length === 0) return null
          return (
            <button
              key={opt.type}
              onClick={() => handleTypeSelect(opt.type)}
              className={`w-full flex items-center gap-3 border rounded-lg px-4 py-3 text-sm text-left transition-colors
                ${receiverType === opt.type ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-yellow-300"}`}
            >
              {opt.icon}
              <span className="font-medium">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {/* Datos del receptor */}
      {receiverType && (
        <div className="space-y-3 bg-gray-50 rounded-lg p-3">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              readOnly={receiverType === "TITULAR"}
            />
          </div>
          <div>
            <Label className="text-xs">DNI</Label>
            <Input
              value={receiverDni}
              onChange={(e) => setReceiverDni(e.target.value.replace(/\D/g, ""))}
              maxLength={8}
              readOnly={receiverType === "TITULAR"}
            />
          </div>
        </div>
      )}

      {/* Fotos de evidencia */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-gray-500">
          Fotos de evidencia ({photoEntries.length}/5)
        </Label>
        <div className="flex gap-2 flex-wrap">
          {photoEntries.map((entry, i) => (
            <div key={i} className="relative w-16 h-16">
              <img
                src={entry.preview}
                alt={`Foto ${i + 1}`}
                className={`w-16 h-16 object-cover rounded border ${entry.error ? "opacity-40" : ""}`}
              />
              {/* Overlay de cargando */}
              {entry.uploading && (
                <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
              {/* Overlay de error */}
              {entry.error && (
                <div className="absolute inset-0 bg-red-500/60 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
              {/* Botón eliminar */}
              {!entry.uploading && (
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}

          {photoEntries.length < 5 && (
            <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-2xl hover:border-yellow-400 cursor-pointer">
              +
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handlePhotoInput}
              />
            </label>
          )}
        </div>
        {photoEntries.some((p) => p.uploading) && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Subiendo fotos...
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleDeliver}
          disabled={loading || photoEntries.some((p) => p.uploading)}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "✅"} Confirmar entrega
        </Button>
        <Button
          variant="outline"
          className={`flex-1 border-red-300 text-red-600 ${!canMarkFailed ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50"}`}
          onClick={handleFailed}
          disabled={!canMarkFailed || loading}
          title={!canMarkFailed ? `Disponible en ${mins}:${String(secs).padStart(2, "0")}` : undefined}
        >
          {canMarkFailed ? "❌ No encontrado" : (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {mins}:{String(secs).padStart(2, "0")}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
