/**
 * POST /api/import/parse
 *
 * Recibe un archivo CSV/Excel (multipart o base64), detecta la plataforma de
 * origen y devuelve las filas normalizadas para previsualizar antes de
 * importar. NO escribe en la base.
 *
 * Body (multipart/form-data): file=<archivo>  [&platform=<forzar plataforma>]
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import {
  detectPlatform,
  normalizeRows,
  PLATFORMS,
  type PlatformId,
} from "@/lib/import/platforms";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json(
      { error: "Solo vendedores pueden importar productos" },
      { status: 403 },
    );
  }

  let buf: Buffer;
  let forcedPlatform: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get("file");
    forcedPlatform = (form.get("platform") as string) || null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    const ab = await (file as File).arrayBuffer();
    if (ab.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera 12MB. Dividilo en partes." },
        { status: 413 },
      );
    }
    buf = Buffer.from(ab);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 400 });
  }

  let rawRows: Record<string, unknown>[] = [];
  let headers: string[] = [];
  try {
    const wb = XLSX.read(buf, { type: "buffer", raw: false });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      return NextResponse.json({ error: "El archivo no tiene hojas" }, { status: 400 });
    }
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const headerMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    headers = (headerMatrix[0] || []).map((x) => String(x ?? ""));
  } catch {
    return NextResponse.json(
      { error: "No se pudo parsear el archivo (¿es un CSV/Excel válido?)" },
      { status: 400 },
    );
  }

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
  }

  const platform: PlatformId =
    forcedPlatform && forcedPlatform in PLATFORMS
      ? (forcedPlatform as PlatformId)
      : detectPlatform(headers);

  const normalized = normalizeRows(platform, rawRows);

  // Stats rápidas para que el seller vea qué va a pasar
  const withImages = normalized.filter((r) => r.images.length > 0).length;
  const withPrice = normalized.filter((r) => r.price > 0).length;
  const withStock = normalized.filter((r) => r.stock > 0).length;

  return NextResponse.json({
    platform,
    platformName: PLATFORMS[platform].name,
    detected: !forcedPlatform,
    totalRows: rawRows.length,
    validProducts: normalized.length,
    stats: { withImages, withPrice, withStock },
    headers,
    // Mandamos TODO normalizado para que el commit no tenga que re-parsear,
    // pero el preview en UI muestra solo los primeros.
    rows: normalized,
  });
}
