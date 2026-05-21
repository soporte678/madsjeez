"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Camera, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onClose: () => void
}

export function FlashQrScanner({ onClose }: Props) {
  const router = useRouter()
  const scannerRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null)
  const containerId = "flash-qr-reader"
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)
  const [detected, setDetected] = useState("")

  useEffect(() => {
    let mounted = true

    const start = async () => {
      const { Html5Qrcode } = await import("html5-qrcode")
      if (!mounted) return

      const html5QrCode = new Html5Qrcode(containerId)
      scannerRef.current = html5QrCode
      setScanning(true)

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!mounted) return
            // Detener inmediatamente para no disparar múltiples veces
            html5QrCode.stop().catch(() => {})
            setDetected(decodedText)
            setScanning(false)

            // Extraer token de la URL escaneada
            // Formato esperado: https://www.madsjeez.com.ar/flash/scan/TOKEN
            const match = decodedText.match(/\/flash\/scan\/([a-f0-9]+)/)
            if (match) {
              router.push(`/flash/scan/${match[1]}`)
              onClose()
            } else {
              setError("QR no reconocido. Solo se aceptan etiquetas Flash de Madsjeez.")
            }
          },
          () => { /* ignore per-frame errors */ }
        )
      } catch (err: unknown) {
        if (!mounted) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setError("Permiso de cámara denegado. Habilitá el acceso a la cámara en tu navegador.")
        } else {
          setError("No se pudo iniciar la cámara. Intentá recargar la página.")
        }
        setScanning(false)
      }
    }

    start()

    return () => {
      mounted = false
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-yellow-400" />
          <span className="text-white font-bold">Escanear etiqueta Flash</span>
        </div>
        <button
          onClick={() => { scannerRef.current?.stop().catch(() => {}); onClose() }}
          className="text-zinc-400 hover:text-white p-1"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="relative w-full max-w-sm">
          {/* El scanner de html5-qrcode renderiza aquí */}
          <div id={containerId} className="rounded-xl overflow-hidden" />

          {/* Overlay de carga mientras arranca la cámara */}
          {!scanning && !error && !detected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
            </div>
          )}
        </div>

        {scanning && (
          <p className="text-zinc-400 text-sm text-center">
            Apuntá la cámara al código QR de la etiqueta del paquete
          </p>
        )}

        {error && (
          <div className="w-full max-w-sm">
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <Button
              className="w-full mt-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold"
              onClick={() => { setError(""); setScanning(false); }}
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-zinc-700 text-xs pb-6">
        Solo etiquetas Flash de Madsjeez
      </p>
    </div>
  )
}
