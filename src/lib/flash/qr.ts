import QRCode from "qrcode"
import { randomBytes } from "crypto"

export function generateQrToken(): string {
  return randomBytes(32).toString("hex")
}

export async function generateQrDataUrl(token: string, baseUrl?: string): Promise<string> {
  const url = `${baseUrl ?? process.env.NEXTAUTH_URL ?? "https://madsjeez.com"}/flash/scan/${token}`
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 200,
    color: { dark: "#000000", light: "#ffffff" },
  })
}

export async function generateQrSvg(token: string, baseUrl?: string): Promise<string> {
  const url = `${baseUrl ?? process.env.NEXTAUTH_URL ?? "https://madsjeez.com"}/flash/scan/${token}`
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 1 })
}
