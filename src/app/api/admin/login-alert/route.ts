import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SETUP_SECRET
    if (!internalSecret || request.headers.get("x-internal-secret") !== internalSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { adminUserId, email, ip, userAgent, timestamp } = await request.json()
    
    // Get client IP from request
    const clientIp = ip || 
      request.headers.get("x-forwarded-for") || 
      request.headers.get("x-real-ip") || 
      "unknown"
    
    const loginTime = timestamp || new Date().toISOString()
    const formattedTime = new Date(loginTime).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      dateStyle: "full",
      timeStyle: "long",
    })

    // Send email using Supabase Edge Function or external service
    // For now, we'll use a simple Resend implementation if available
    // or log to audit_logs table
    
    const supabase = await createClient()
    
    // Log to audit_logs
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      action: "login",
      entity_type: "admin_user",
      entity_id: adminUserId,
      details: {
        email,
        ip: clientIp,
        user_agent: userAgent,
        timestamp: loginTime,
      },
      ip_address: clientIp,
      user_agent: userAgent,
    })

    // Try to send email alert
    try {
      // Using Resend if available, otherwise skip
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: "MadsJeez ERP <security@madsjeez.com.ar>",
          to: "vianferreteria@gmail.com",
          subject: `🔒 Alerta de Login - MadsJeez ERP`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; color: #FFF159;">🔒 MadsJeez ERP - Alerta de Seguridad</h2>
              </div>
              <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                <p style="color: #dc2626; font-weight: bold; font-size: 18px;">⚠️ Se detectó un inicio de sesión en el panel de administración</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 30%;">Usuario:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Fecha/Hora:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Dirección IP:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-family: monospace;">${clientIp}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #475569;">Navegador:</td>
                    <td style="padding: 10px; color: #64748b; font-size: 12px;">${userAgent || "No disponible"}</td>
                  </tr>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>Nota:</strong> Si no reconoces este inicio de sesión, contacta inmediatamente al administrador de sistemas.
                  </p>
                </div>
                
                <p style="margin-top: 30px; color: #64748b; font-size: 12px; text-align: center;">
                  Este es un mensaje automático de MadsJeez ERP.<br>
                  ID de sesión: ${adminUserId}
                </p>
              </div>
            </div>
          `,
        })
      }
    } catch (emailError) {
      console.error("Failed to send email alert:", emailError)
      // Don't fail the login if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login alert error:", error)
    return NextResponse.json({ error: "Failed to process login alert" }, { status: 500 })
  }
}
