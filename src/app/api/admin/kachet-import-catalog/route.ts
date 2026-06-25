import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"
import { prisma } from "@/lib/prisma"

const SELLER_ID = "cmrkachetbikinis0001aaaaa"
const CATEGORY_ID = "cmrkachetcategory001aaaa"
const BASE_IMG = "/api/img-proxy?u=https://www.kachet.com.ar/fotos/shop/"

type KachetEntry = {
  id: string
  imgId: number
  title: string
  price: number
  comparePrice?: number
  isAnticipo?: boolean
}

const NEW_KACHET_PRODUCTS: KachetEntry[] = [
  { id: "kachp031", imgId: 4297, title: "Top Con Vivo Deportivo Estampa Argentina", price: 24990, isAnticipo: true },
  { id: "kachp032", imgId: 4286, title: "Malla Lili Con Pareo De Tul", price: 69990 },
  { id: "kachp033", imgId: 4287, title: "Vedetina Tiro Alto Negra Con Pollerita De Tul", price: 35990 },
  { id: "kachp034", imgId: 4279, title: "Top Deportivo Luna Texturado Rayado Negro", price: 29990, isAnticipo: true },
  { id: "kachp035", imgId: 4298, title: "Top Multiusos Sofi Hierro", price: 29990 },
  { id: "kachp036", imgId: 3443, title: "Top Deportivo Luna Con Cierre Negro", price: 29990 },
  { id: "kachp037", imgId: 3992, title: "Triangulito Texturado Río Vichy Lavanda", price: 10000, comparePrice: 24990 },
  { id: "kachp038", imgId: 4255, title: "Tankini Lusine Negra", price: 49990 },
  { id: "kachp039", imgId: 4256, title: "Tankini Lusine Visón", price: 49990 },
  { id: "kachp040", imgId: 3831, title: "Malla Enteriza Texturada Río Con Argolla", price: 25000, comparePrice: 57990 },
  { id: "kachp041", imgId: 4266, title: "Remera Manga Corta UV Estampa Kari", price: 36990 },
  { id: "kachp042", imgId: 4267, title: "Remera Manga Corta UV Negra", price: 36990 },
  { id: "kachp043", imgId: 4270, title: "Remera Manga Larga UV Estampa Mexicana", price: 39990 },
  { id: "kachp044", imgId: 4273, title: "Tankini Ágata Negra", price: 45990 },
  { id: "kachp045", imgId: 4274, title: "Top Lusine Negro", price: 29990 },
  { id: "kachp046", imgId: 4275, title: "Top Lusine Hierro", price: 29990 },
  { id: "kachp047", imgId: 4281, title: "Top Deportivo Euge Con Manga Corta", price: 32990 },
  { id: "kachp048", imgId: 4251, title: "Short Tiro Alto Lola Con Vivo Rojo", price: 29990 },
  { id: "kachp049", imgId: 4245, title: "Pollerita Biker Gabi Negra", price: 35990 },
  { id: "kachp050", imgId: 3993, title: "Malla Lili Con Pareo Estampado Muna", price: 30000, comparePrice: 69990 },
  { id: "kachp051", imgId: 4250, title: "Short Tiro Alto Lola Con Vivo Negro", price: 29990 },
  { id: "kachp052", imgId: 3136, title: "Malla Lili Con Pareo Estampado Samanta", price: 30000, comparePrice: 69990 },
  { id: "kachp053", imgId: 4225, title: "Top Emi Dos Posturas Luisa Negro", price: 33990 },
  { id: "kachp054", imgId: 3976, title: "Top Lusine De Lycra Fucsia", price: 32990 },
  { id: "kachp055", imgId: 4083, title: "Culotteless Alto Con Frunces Lila", price: 29990 },
  { id: "kachp056", imgId: 4066, title: "Malla Vedetina Con Breteles Whitney Fucsia", price: 25000, comparePrice: 56990 },
  { id: "kachp057", imgId: 4220, title: "Triangulito Whitney", price: 10000, comparePrice: 22990 },
  { id: "kachp058", imgId: 3964, title: "Malla Vedetina Baywatch Rayado Negro", price: 25000, comparePrice: 59990 },
  { id: "kachp059", imgId: 1202, title: "Top Con Arquito Y Base Negro", price: 26990 },
  { id: "kachp060", imgId: 4033, title: "Top Deportivo Miri Estampa Kari", price: 24990 },
  { id: "kachp061", imgId: 4202, title: "Top Nelly Estampado Whitney", price: 15000, comparePrice: 33990 },
  { id: "kachp062", imgId: 3963, title: "Malla Vedetina Baywatch Rayada Roja", price: 25000, comparePrice: 59990 },
  { id: "kachp063", imgId: 3804, title: "Malla Negra Natación Anticloro", price: 39990 },
  { id: "kachp064", imgId: 1512, title: "Top Miri Deportivo Rojo", price: 24999 },
  { id: "kachp065", imgId: 2181, title: "Top Belén Con Doble Volado Negro", price: 33990 },
  { id: "kachp066", imgId: 3641, title: "Top Leti Negro", price: 27990 },
  { id: "kachp067", imgId: 1454, title: "Malla Lili Pollerita Negra", price: 69990 },
  { id: "kachp068", imgId: 4199, title: "Top Nelly Lycra Negro", price: 33990 },
  { id: "kachp069", imgId: 4172, title: "Top Emi Dos Posturas Negra", price: 33990 },
  { id: "kachp070", imgId: 3889, title: "Malla Enteriza Belén Visón Con Volado Champagne", price: 69990 },
  { id: "kachp071", imgId: 3973, title: "Top Juanita Texturado Río Vichy Rojo", price: 15000, comparePrice: 39990 },
  { id: "kachp072", imgId: 4119, title: "Top Lusine De Lycra Negro", price: 32990 },
  { id: "kachp073", imgId: 1246, title: "Top Grichu Con Volado Negro", price: 39990 },
  { id: "kachp074", imgId: 1407, title: "Tankini Paisana Riti Negra", price: 49990 },
  { id: "kachp075", imgId: 3894, title: "Top Melisa Negro", price: 34990 },
  { id: "kachp076", imgId: 2648, title: "Triángulo Leti Fucsia", price: 29990 },
  { id: "kachp077", imgId: 3550, title: "Malla Leini Un Hombro Doble Volado Negro", price: 65990 },
  { id: "kachp078", imgId: 3454, title: "Malla Enteriza Juli Manga Larga UV Negro", price: 69990 },
  { id: "kachp079", imgId: 3924, title: "Malla Noé Negra", price: 59990 },
  { id: "kachp080", imgId: 2558, title: "Bando Agustina Negro", price: 29990 },
  { id: "kachp081", imgId: 3878, title: "Malla Paisana Con Volado Estampado Susi", price: 29999, comparePrice: 59990 },
  { id: "kachp082", imgId: 412,  title: "Short Tiro Alto Negro", price: 29990 },
  { id: "kachp083", imgId: 3778, title: "Biker Texturada Río Negra", price: 15000, comparePrice: 29990 },
  { id: "kachp084", imgId: 1508, title: "Culotte Tiro Alto Negro", price: 29990 },
  { id: "kachp085", imgId: 3603, title: "Short De Baño Negro", price: 29990 },
  { id: "kachp086", imgId: 3803, title: "Malla Cala Texturada Combinada Negro Y Blanco", price: 25000, comparePrice: 59990 },
  { id: "kachp087", imgId: 3758, title: "Remera Manga Larga Texturada UV Negra", price: 25000, comparePrice: 49990 },
  { id: "kachp088", imgId: 2572, title: "Top Miri Deportivo Lavanda", price: 24999 },
  { id: "kachp089", imgId: 3361, title: "Calza De Lycra Negra", price: 36990 },
]

export async function POST(req: Request) {
  const authErr = await requireAdminRequest(req)
  if (authErr) return authErr

  const created: string[] = []
  const skipped: string[] = []
  const errors: { id: string; error: string }[] = []

  for (const product of NEW_KACHET_PRODUCTS) {
    try {
      const exists = await prisma.product.findUnique({
        where: { id: product.id },
        select: { id: true },
      })
      if (exists) {
        skipped.push(product.id)
        continue
      }

      const desc = product.isAnticipo
        ? `Anticipo ${product.title} - Kachet Bikinis. Disponible próxima temporada.`
        : `${product.title} - Kachet Bikinis. Diseño argentino de alta calidad.`

      await prisma.product.create({
        data: {
          id: product.id,
          title: product.title,
          description: desc,
          price: product.price,
          comparePrice: product.comparePrice ?? null,
          stock: 30,
          isActive: true,
          condition: "new",
          freeShipping: false,
          sellerId: SELLER_ID,
          categoryId: CATEGORY_ID,
        },
      })

      const num = product.id.replace("kachp", "")
      await prisma.productImage.create({
        data: {
          id: `kachi${num}`,
          productId: product.id,
          url: `${BASE_IMG}${product.imgId}.jpg`,
          order: 1,
        },
      })

      created.push(product.id)
    } catch (e) {
      errors.push({ id: product.id, error: String(e) })
    }
  }

  return NextResponse.json({
    created: created.length,
    skipped: skipped.length,
    errors: errors.length,
    details: { created, skipped, errors },
  })
}
