"use client";

/**
 * Herramientas virales de la tienda (Fase 6): copiar link, WhatsApp, Facebook,
 * QR descargable y flyer descargable ("Conocé mi tienda en Madsjeez"), + badge.
 * Todo client-side con la lib `qrcode` (ya instalada). Sin dependencias nuevas.
 */

import { useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { Copy, Share2, QrCode, ImageDown, Users as FacebookIcon, Code2 } from "lucide-react";

export function StoreShareTools({ url, subdomainUrl, name, primaryColor }: {
  url: string; subdomainUrl: string | null; name: string; primaryColor: string | null;
}) {
  const shareUrl = subdomainUrl || url;
  const color = primaryColor || "#1d4ed8";
  const [busy, setBusy] = useState(false);

  const copy = (t: string, msg = "Copiado") => { navigator.clipboard.writeText(t); toast.success(msg); };

  const share = (kind: "whatsapp" | "facebook") => {
    trackEvent("store_share_click", { channel: kind, source: "panel" });
    const href = kind === "whatsapp"
      ? `https://wa.me/?text=${encodeURIComponent(`Mirá mi tienda en Madsjeez: ${shareUrl}`)}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl; a.download = filename; a.click();
  };

  const downloadQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(shareUrl, { width: 800, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
      downloadDataUrl(dataUrl, "qr-tienda-madsjeez.png");
      trackEvent("store_share_click", { channel: "qr", source: "panel" });
    } catch { toast.error("No se pudo generar el QR"); }
  };

  const downloadFlyer = async () => {
    setBusy(true);
    try {
      const W = 1080, H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");

      // Fondo con color de marca
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Tarjeta blanca
      const cardX = 90, cardY = 230, cardW = W - 180, cardH = H - 460;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, cardX, cardY, cardW, cardH, 40); ctx.fill();

      // Encabezado
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("Conocé mi tienda en", W / 2, 150);
      ctx.font = "900 64px sans-serif";
      ctx.fillText("MADSJEEZ", W / 2, 215);

      // Nombre de la tienda
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 56px sans-serif";
      wrapText(ctx, name || "Mi tienda", W / 2, cardY + 110, cardW - 120, 64);

      // QR
      const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 520, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
      const qrImg = await loadImage(qrDataUrl);
      const qrSize = 520;
      ctx.drawImage(qrImg, (W - qrSize) / 2, cardY + 200, qrSize, qrSize);

      // Link
      ctx.fillStyle = color;
      ctx.font = "bold 36px sans-serif";
      const cleanUrl = shareUrl.replace(/^https?:\/\//, "");
      ctx.fillText(cleanUrl, W / 2, cardY + cardH - 70);

      // Footer
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "500 30px sans-serif";
      ctx.fillText("Escaneá el código o entrá al link", W / 2, H - 90);

      const dataUrl = canvas.toDataURL("image/png");
      downloadDataUrl(dataUrl, "flyer-tienda-madsjeez.png");
      trackEvent("store_share_click", { channel: "flyer", source: "panel" });
    } catch {
      toast.error("No se pudo generar el flyer");
    } finally { setBusy(false); }
  };

  const badgeSnippet = `<a href="${url}" target="_blank" rel="noopener">Tienda creada con Madsjeez</a>`;
  const btn = "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-bold text-foreground">Compartí tu tienda</p>
        <p className="mt-1 text-xs text-muted-foreground">Tu link: <span className="font-medium text-foreground">{shareUrl.replace(/^https?:\/\//, "")}</span></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => copy(shareUrl)} className={btn}><Copy className="h-4 w-4" /> Copiar link</button>
          <button onClick={() => share("whatsapp")} className={btn}><Share2 className="h-4 w-4" /> WhatsApp</button>
          <button onClick={() => share("facebook")} className={btn}><FacebookIcon className="h-4 w-4" /> Facebook</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><QrCode className="h-5 w-5" /></div>
          <h3 className="font-semibold text-foreground">Código QR</h3>
          <p className="mt-1 text-sm text-muted-foreground">Descargalo para imprimir en tu local, tarjetas o cajas.</p>
          <button onClick={() => void downloadQR()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"><QrCode className="h-4 w-4" /> Descargar QR</button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ImageDown className="h-5 w-5" /></div>
          <h3 className="font-semibold text-foreground">Flyer para redes</h3>
          <p className="mt-1 text-sm text-muted-foreground">Una placa lista para compartir en historias y posteos.</p>
          <button onClick={() => void downloadFlyer()} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"><ImageDown className="h-4 w-4" /> {busy ? "Generando…" : "Descargar flyer"}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Code2 className="h-5 w-5" /></div>
        <h3 className="font-semibold text-foreground">Badge para tu web</h3>
        <p className="mt-1 text-sm text-muted-foreground">Pegá este código en tu sitio para enlazar tu tienda.</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground"><code>{badgeSnippet}</code></pre>
        <button onClick={() => copy(badgeSnippet, "Código copiado")} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Copy className="h-4 w-4" /> Copiar código</button>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, cx, yy); line = w; yy += lh; }
    else line = test;
  }
  ctx.fillText(line, cx, yy);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default StoreShareTools;
