import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseService } from "@/lib/supabase/service"

const BUCKET = "flash-photos"
const TTL = 60 * 60 * 24 * 365 // 1 año

// POST /api/flash/photos/refresh — regenera URLs firmadas vencidas
// Body: { paths: string[] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { paths } = (await req.json()) as { paths: string[] }
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: "paths requerido" }, { status: 400 })
  }
  if (paths.length > 20) {
    return NextResponse.json({ error: "Máximo 20 paths por llamada" }, { status: 400 })
  }

  const results = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabaseService.storage
        .from(BUCKET)
        .createSignedUrl(path, TTL)
      return { path, url: data?.signedUrl ?? null, error: error?.message ?? null }
    })
  )

  return NextResponse.json({ urls: results })
}
