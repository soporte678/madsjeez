import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimitAsync, clientIpFromRequest } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

function validateCuit(cuit: string): boolean {
  const digits = cuit.replace(/[-\s]/g, "")
  return /^\d{11}$/.test(digits)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  // Rate limit: 5 submissions per IP per hour
  const ip = clientIpFromRequest(req as unknown as { headers: Headers })
  const rl = await checkRateLimitAsync(`vendedores:aplicar:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá más tarde." }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const required = [
    "nombreCompleto", "nombreComercio", "email", "whatsapp",
    "direccion", "codigoPostal", "provincia", "localidad",
    "rubro", "cuit", "cantidadProductos",
  ]
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json({ error: `El campo "${field}" es obligatorio.` }, { status: 400 })
    }
  }

  const email = String(body.email).trim().toLowerCase()
  if (!validateEmail(email)) {
    return NextResponse.json({ error: "El email no tiene un formato válido." }, { status: 400 })
  }

  const cuit = String(body.cuit).trim()
  if (!validateCuit(cuit)) {
    return NextResponse.json({ error: "El CUIT debe tener 11 dígitos (formato XX-XXXXXXXX-X)." }, { status: 400 })
  }

  if (!body.aceptaContacto) {
    return NextResponse.json({ error: "Debés aceptar ser contactado para continuar." }, { status: 400 })
  }
  if (!body.confirmaDatos) {
    return NextResponse.json({ error: "Debés confirmar que los datos son correctos." }, { status: 400 })
  }

  // Check duplicates
  const existingByEmail = await prisma.sellerApplication.findUnique({ where: { email }, select: { id: true } }).catch(() => null)
  const existingByCuit = await prisma.sellerApplication.findUnique({ where: { cuit }, select: { id: true } }).catch(() => null)

  if (existingByEmail || existingByCuit) {
    return NextResponse.json({
      error: "Ya recibimos una solicitud con ese email o CUIT. El equipo de Madsjeez se va a comunicar a la brevedad.",
    }, { status: 409 })
  }

  // Save to DB
  let application: { id: string }
  try {
    application = await prisma.sellerApplication.create({
      data: {
        nombreCompleto: String(body.nombreCompleto).trim(),
        nombreComercio: String(body.nombreComercio).trim(),
        email,
        whatsapp: String(body.whatsapp).trim(),
        direccion: String(body.direccion).trim(),
        codigoPostal: String(body.codigoPostal).trim(),
        provincia: String(body.provincia).trim(),
        localidad: String(body.localidad).trim(),
        rubro: String(body.rubro).trim(),
        cuit,
        cantidadProductos: String(body.cantidadProductos).trim(),
        linkMercadoLibre: body.linkMercadoLibre ? String(body.linkMercadoLibre).trim() : null,
        linkTiendaNube: body.linkTiendaNube ? String(body.linkTiendaNube).trim() : null,
        linkInstagram: body.linkInstagram ? String(body.linkInstagram).trim() : null,
        linkWeb: body.linkWeb ? String(body.linkWeb).trim() : null,
        mensaje: body.mensaje ? String(body.mensaje).trim().slice(0, 2000) : null,
        aceptaContacto: Boolean(body.aceptaContacto),
        confirmaDatos: Boolean(body.confirmaDatos),
        estado: "Pendiente de revisión",
      },
      select: { id: true },
    })
  } catch (err) {
    console.error("[vendedores/aplicar] DB error:", err)
    return NextResponse.json({ error: "Error al guardar la solicitud. Intentá de nuevo." }, { status: 500 })
  }

  // Send emails (fire and forget)
  void sendEmails({
    nombreCompleto: String(body.nombreCompleto).trim(),
    nombreComercio: String(body.nombreComercio).trim(),
    email,
    whatsapp: String(body.whatsapp).trim(),
    provincia: String(body.provincia).trim(),
    localidad: String(body.localidad).trim(),
    rubro: String(body.rubro).trim(),
    cuit,
    cantidadProductos: String(body.cantidadProductos).trim(),
    linkMercadoLibre: body.linkMercadoLibre ? String(body.linkMercadoLibre).trim() : null,
    linkTiendaNube: body.linkTiendaNube ? String(body.linkTiendaNube).trim() : null,
  }).catch((e) => console.error("[vendedores/aplicar] email error:", e))

  return NextResponse.json({
    ok: true,
    message: "Solicitud recibida. El equipo de Madsjeez revisará tus datos y se comunicará con vos.",
  })
}

interface EmailData {
  nombreCompleto: string
  nombreComercio: string
  email: string
  whatsapp: string
  provincia: string
  localidad: string
  rubro: string
  cuit: string
  cantidadProductos: string
  linkMercadoLibre: string | null
  linkTiendaNube: string | null
}

async function sendEmails(data: EmailData) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM?.trim() || "Madsjeez <noreply@madsjeez.com.ar>"

  // 1. Confirmation to seller
  await resend.emails.send({
    from,
    to: data.email,
    subject: "Recibimos tu solicitud para vender en Madsjeez",
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <img src="https://www.madsjeez.com.ar/icons/icon-192x192.png" alt="Madsjeez" style="width:48px;height:48px;margin-bottom:16px;">
  <h2 style="color:#f97316;margin:0 0 16px;">Hola ${data.nombreCompleto},</h2>
  <p>Gracias por registrarte para sumar tu tienda a Madsjeez.</p>
  <p>Recibimos tus datos correctamente. Nuestro equipo revisará la información y se comunicará con vos para avanzar con la carga inicial de hasta <strong>200 publicaciones gratis</strong>, disponible para los primeros 1000 vendedores aprobados.</p>
  <p>Recordá que Madsjeez funciona como un canal adicional para mostrar tus productos y llegar a nuevos clientes. No necesitás dejar de vender donde ya vendés.</p>
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:24px 0;">
    <p style="margin:0;font-weight:600;color:#c2410c;">Próximos pasos:</p>
    <ol style="margin:8px 0 0;padding-left:20px;color:#7c2d12;">
      <li>Revisamos tu solicitud (1-3 días hábiles)</li>
      <li>Te contactamos por email o WhatsApp</li>
      <li>Coordinamos la carga inicial de publicaciones</li>
    </ol>
  </div>
  <p style="color:#6b7280;font-size:14px;">Saludos,<br><strong>Equipo Madsjeez</strong><br><a href="https://www.madsjeez.com.ar" style="color:#f97316;">www.madsjeez.com.ar</a><br>WhatsApp: 1121816064</p>
</div>`,
  })

  // 2. Internal notification
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) return
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `Nuevo vendedor interesado en Madsjeez — ${data.nombreComercio}`,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#f97316;">Nuevo vendedor registrado</h2>
  <table style="border-collapse:collapse;width:100%;">
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Nombre</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.nombreCompleto}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Comercio</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.nombreComercio}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Email</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.email}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">WhatsApp</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.whatsapp}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Rubro</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.rubro}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Provincia</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.provincia} — ${data.localidad}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">CUIT</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.cuit}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Cant. productos</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.cantidadProductos}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Link ML</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.linkMercadoLibre ?? "—"}</td></tr>
    <tr><td style="padding:8px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb;">Link TN</td><td style="padding:8px;border:1px solid #e5e7eb;">${data.linkTiendaNube ?? "—"}</td></tr>
  </table>
  <p style="color:#6b7280;margin-top:16px;">Revisar y contactar.</p>
</div>`,
  })
}
