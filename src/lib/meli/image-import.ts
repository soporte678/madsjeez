import { createHash } from "crypto";
import { getSupabaseService } from "@/lib/supabase/service";

const BUCKET = "product-images";

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

export async function persistMeliImageUrl(
  sourceUrl: string,
  opts: { productId: string; index: number }
): Promise<string | null> {
  const url = sourceUrl?.trim();
  if (!url || !url.startsWith("http")) return null;

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25_000);
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;

    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 12);
    const ext = extFromContentType(res.headers.get("content-type"));
    const path = `meli/${opts.productId}/${opts.index}-${hash}.${ext}`;

    const supabase = getSupabaseService();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: res.headers.get("content-type") || `image/${ext}`,
      upsert: true,
    });
    if (error) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}

export async function persistMeliImageBatch(urls: string[], productId: string): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const persisted = await persistMeliImageUrl(urls[i], { productId, index: i });
    out.push(persisted || urls[i]);
  }
  return out;
}
