// Descarga imágenes de kachet.com.ar y las sube a Supabase Storage
// Luego actualiza las URLs en product_images
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const IMAGES = [
  { imgId: 4118, productId: 'kachp001', imageId: 'kachi001' },
  { imgId: 4205, productId: 'kachp002', imageId: 'kachi002' },
  { imgId: 3972, productId: 'kachp003', imageId: 'kachi003' },
  { imgId: 3978, productId: 'kachp004', imageId: 'kachi004' },
  { imgId: 3980, productId: 'kachp005', imageId: 'kachi005' },
  { imgId: 4002, productId: 'kachp006', imageId: 'kachi006' },
  { imgId: 4013, productId: 'kachp007', imageId: 'kachi007' },
  { imgId: 3760, productId: 'kachp008', imageId: 'kachi008' },
  { imgId: 4032, productId: 'kachp009', imageId: 'kachi009' },
  { imgId: 4039, productId: 'kachp010', imageId: 'kachi010' },
  { imgId: 4047, productId: 'kachp011', imageId: 'kachi011' },
  { imgId: 4304, productId: 'kachp012', imageId: 'kachi012' },
  { imgId: 3943, productId: 'kachp013', imageId: 'kachi013' },
  { imgId: 4301, productId: 'kachp014', imageId: 'kachi014' },
  { imgId: 4243, productId: 'kachp015', imageId: 'kachi015' },
  { imgId: 3965, productId: 'kachp016', imageId: 'kachi016' },
  { imgId: 4278, productId: 'kachp017', imageId: 'kachi017' },
  { imgId: 4244, productId: 'kachp018', imageId: 'kachi018' },
  { imgId: 4291, productId: 'kachp019', imageId: 'kachi019' },
  { imgId: 4292, productId: 'kachp020', imageId: 'kachi020' },
  { imgId: 4306, productId: 'kachp021', imageId: 'kachi021' },
  { imgId: 4300, productId: 'kachp022', imageId: 'kachi022' },
  { imgId: 4314, productId: 'kachp023', imageId: 'kachi023' },
  { imgId: 4315, productId: 'kachp024', imageId: 'kachi024' },
  { imgId: 4312, productId: 'kachp025', imageId: 'kachi025' },
  { imgId: 4313, productId: 'kachp026', imageId: 'kachi026' },
  { imgId: 4316, productId: 'kachp027', imageId: 'kachi027' },
  { imgId: 4120, productId: 'kachp028', imageId: 'kachi028' },
  { imgId: 4295, productId: 'kachp029', imageId: 'kachi029' },
  { imgId: 4296, productId: 'kachp030', imageId: 'kachi030' },
]

const BUCKET = 'product-images'

async function downloadImage(imgId) {
  const url = `https://www.kachet.com.ar/fotos/shop/${imgId}.jpg`
  const res = await fetch(url, {
    headers: {
      'Referer': 'https://www.kachet.com.ar/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} para imagen ${imgId}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  let ok = 0, fail = 0

  for (const { imgId, productId, imageId } of IMAGES) {
    const storagePath = `kachet/${imgId}.jpg`
    try {
      // Descargar
      const buf = await downloadImage(imgId)

      // Subir a Supabase Storage
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buf, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (upErr) throw upErr

      // URL pública
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      const publicUrl = data.publicUrl

      // Actualizar product_images
      const { error: dbErr } = await supabase
        .from('product_images')
        .update({ url: publicUrl })
        .eq('id', imageId)
      if (dbErr) throw dbErr

      console.log(`✓ ${imgId} → ${publicUrl}`)
      ok++
    } catch (e) {
      console.error(`✗ ${imgId}: ${e.message}`)
      fail++
    }
  }

  console.log(`\nListo: ${ok} OK, ${fail} errores`)
}

main()
