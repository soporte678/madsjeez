import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const body = await req.json()
    const { action, images, title, description, category } = body

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // ACTION: Analyze images and generate title + description
    if (action === "generate_listing") {
      const imageParts = (images || []).slice(0, 3).map((img: string) => {
        // Handle base64 data URLs
        const base64Match = img.match(/^data:([^;]+);base64,(.+)$/)
        if (base64Match) {
          return { inlineData: { mimeType: base64Match[1], data: base64Match[2] } }
        }
        // For URLs, we can't send them directly, skip
        return null
      }).filter(Boolean)

      if (imageParts.length === 0) {
        return NextResponse.json({ error: "Se necesita al menos una imagen subida (no URL)" }, { status: 400 })
      }

      const result = await model.generateContent([
        ...imageParts,
        {
          text: `Analizá estas fotos de un producto para un marketplace de maquinaria, herramientas y ferretería en Argentina.

Generá un JSON válido (sin markdown) con:
- "title": título optimizado para SEO del producto (máx 60 caracteres). Incluí marca, modelo y características clave. Ejemplo: "Motosierra Stihl MS 170 30cm 1.8hp"
- "description": descripción completa y profesional del producto (200-400 caracteres). Incluí características técnicas, material, usos, beneficios. En español argentino.
- "condition_suggestion": "new", "used" o "refurbished" basado en el estado visual
- "category_suggestion": categoría sugerida (ej: "Motosierras", "Taladros", "Amoladoras")
- "image_quality": array con análisis de cada imagen:
  - "index": número de imagen (0-based)
  - "score": 0-100 calidad
  - "issues": array de problemas detectados (ej: "fondo no blanco", "baja resolución", "marca de agua")
  - "suggestion": sugerencia de mejora
- "seo_keywords": array de 5 palabras clave para SEO
- "price_range": rango de precio estimado en ARS { "min": number, "max": number } (solo si podés estimarlo)

Sé preciso y profesional. Solo responde con JSON.`,
        },
      ])

      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { error: "No se pudo analizar las imágenes" } }
      return NextResponse.json(parsed)
    }

    // ACTION: Improve existing description
    if (action === "improve_description") {
      const prompt = `Mejorá esta descripción de producto para un marketplace de maquinaria y herramientas en Argentina.

Título: ${title || "Sin título"}
Categoría: ${category || "General"}
Descripción actual: ${description || "Sin descripción"}

Generá una descripción mejorada en JSON:
- "description": descripción profesional, completa, con características técnicas, materiales, usos y beneficios. 200-500 caracteres. Español argentino. No incluyas precio ni datos de contacto.
- "improvements": array de mejoras aplicadas (ej: "Se agregaron especificaciones técnicas", "Se mejoró la estructura")

Solo JSON sin markdown.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { description: description || "", improvements: [] } }
      return NextResponse.json(parsed)
    }

    // ACTION: Generate title from description
    if (action === "generate_title") {
      const prompt = `Generá un título optimizado para SEO para este producto en un marketplace de maquinaria y herramientas en Argentina.

Descripción: ${description || "Sin descripción"}
Categoría: ${category || "General"}

Responde SOLO con JSON:
- "title": título optimizado (máx 60 caracteres). Incluí marca, modelo y características clave.
- "alternatives": array de 3 títulos alternativos

Solo JSON sin markdown.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { title: title || "", alternatives: [] } }
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("AI enhance error:", error)
    return NextResponse.json({ error: error?.message || "AI enhancement error" }, { status: 500 })
  }
}
