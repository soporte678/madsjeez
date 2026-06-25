import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseService } from "@/lib/supabase/service"

// POST /api/questions/upload - Subir imágenes para preguntas
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll("images") as File[]
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron imágenes" },
        { status: 400 }
      )
    }

    // Máximo 2 imágenes
    if (files.length > 2) {
      return NextResponse.json(
        { error: "Máximo 2 imágenes permitidas" },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []
    const bucketName = "question-images"

    // Verificar si el bucket existe, si no, crearlo
    const { data: buckets } = await supabaseService.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)
    
    if (!bucketExists) {
      // Crear bucket con políticas públicas
      const { error: createError } = await supabaseService.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
      })
      
      if (createError) {
        console.error("Error creating bucket:", createError)
      }
    }

    // Subir cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validar tipo de archivo
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes (JPEG, PNG, WebP, GIF)` },
          { status: 400 }
        )
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El archivo excede el tamaño máximo de 5MB" },
          { status: 400 }
        )
      }

      // Generar nombre único
      const MIME_TO_EXT: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      }

      const fileExt = MIME_TO_EXT[file.type]
      if (!fileExt) {
        return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 415 })
      }

      const timestamp = Date.now()
      const fileName = `${session.user.id}/${timestamp}_${i}.${fileExt}`

      // Convertir File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Subir a Supabase Storage
      const { data, error: uploadError } = await supabaseService.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        return NextResponse.json(
          { error: `Error al subir imagen: ${uploadError.message}` },
          { status: 500 }
        )
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabaseService.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} imagen(es) subida(s) correctamente`
    })

  } catch (error) {
    console.error("Error in upload API:", error)
    return NextResponse.json(
      { error: "Error al procesar las imágenes" },
      { status: 500 }
    )
  }
}

// DELETE /api/questions/upload - Eliminar una imagen
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json(
        { error: "URL de imagen requerida" },
        { status: 400 }
      )
    }

    // Extraer el path del URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const bucketName = "question-images" // hardcoded — never derived from user input
    const filePath = pathParts.slice(3).join("/")

    // Verificar que el usuario sea el dueño del archivo
    if (!filePath.startsWith(session.user.id)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta imagen" },
        { status: 403 }
      )
    }

    const { error } = await supabaseService.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error("Error deleting image:", error)
      return NextResponse.json(
        { error: "Error al eliminar la imagen" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error in delete API:", error)
    return NextResponse.json(
      { error: "Error al eliminar la imagen" },
      { status: 500 }
    )
  }
}
