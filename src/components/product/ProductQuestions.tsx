"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useQuestions } from "@/hooks/useQuestions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  CheckCircle2,
  HelpCircle,
  Loader2,
  ImagePlus,
  X,
  Download,
  Paperclip
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ProductQuestionsProps {
  productId: string
  sellerId: string
}

export function ProductQuestions({ productId, sellerId }: ProductQuestionsProps) {
  const { data: session } = useSession()
  const { 
    questions, 
    isLoading, 
    askQuestion, 
    answerQuestion, 
    deleteQuestion,
    refresh 
  } = useQuestions({ 
    productId, 
    status: "all",
    limit: 10 
  })

  const [newQuestion, setNewQuestion] = useState("")
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAnswerInput, setShowAnswerInput] = useState<string | null>(null)
  
  // Estados para manejo de imágenes
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSeller = session?.user?.id === sellerId

  // Función para manejar selección de imágenes
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = selectedImages.length + newFiles.length

    if (totalImages > 2) {
      alert("Máximo 2 imágenes permitidas")
      return
    }

    // Validar tamaño (5MB máximo)
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo excede el tamaño máximo de 5MB")
        return
      }
    }

    setSelectedImages(prev => [...prev, ...newFiles])
    
    // Crear previews
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // Función para remover imagen
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Función para subir imágenes
  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []

    setUploadingImages(true)
    const formData = new FormData()
    selectedImages.forEach(file => {
      formData.append("images", file)
    })

    try {
      const res = await fetch("/api/questions/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al subir imágenes")
      }

      const data = await res.json()
      return data.urls || []
    } catch (error: any) {
      throw new Error(error.message || "Error al subir imágenes")
    } finally {
      setUploadingImages(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return
    
    setIsSubmitting(true)
    try {
      // Subir imágenes primero si hay seleccionadas
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages()
      }
      
      await askQuestion(productId, newQuestion, imageUrls)
      setNewQuestion("")
      setSelectedImages([])
      setImagePreviews([])
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnswer = async (questionId: string) => {
    const answer = answerText[questionId]
    if (!answer?.trim()) return

    setIsSubmitting(true)
    try {
      await answerQuestion(questionId, answer)
      setAnswerText(prev => ({ ...prev, [questionId]: "" }))
      setShowAnswerInput(null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm("¿Eliminar esta pregunta?")) return
    
    try {
      await deleteQuestion(questionId)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        Preguntas y Respuestas
        {questions.length > 0 && (
          <span className="text-sm font-normal text-gray-500">({questions.length})</span>
        )}
      </h3>

      {/* Formulario para hacer pregunta */}
      {session?.user && !isSeller && (
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback>{session.user.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Escribe tu pregunta sobre este producto..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={1000}
              />
              
              {/* Preview de imágenes seleccionadas */}
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {newQuestion.length}/1000 caracteres
                  </span>
                  
                  {/* Botón para adjuntar imágenes */}
                  {imagePreviews.length < 2 && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Adjuntar foto
                      </button>
                    </>
                  )}
                  
                  {uploadingImages && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Subiendo...
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleAskQuestion}
                  disabled={!newQuestion.trim() || isSubmitting || uploadingImages}
                  size="sm"
                >
                  {isSubmitting || uploadingImages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Preguntar
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-400 mt-1">
                Máximo 2 imágenes (5MB cada una). Solo visibles para el vendedor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aún no hay preguntas</p>
            <p className="text-sm">Sé el primero en preguntar sobre este producto</p>
          </div>
        ) : (
          questions.map((q: any) => (
            <div key={q.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              {/* Pregunta */}
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={q.buyer.image || undefined} />
                  <AvatarFallback>{q.buyer.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800">{q.question}</p>
                    
                    {/* Indicador de imágenes adjuntas - SOLO para vendedor */}
                    {isSeller && q.images && q.images.length > 0 && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700">
                            {q.images.length} imagen{q.images.length > 1 ? 'es' : ''} adjunta{q.images.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-orange-500">(Solo visible para vos)</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {q.images.map((imgUrl: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={imgUrl}
                                alt={`Adjunto ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border border-orange-200"
                              />
                              <a
                                href={imgUrl}
                                download={`pregunta_${q.id}_imagen_${idx + 1}`}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded"
                                title="Descargar imagen"
                              >
                                <Download className="w-5 h-5 text-white" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{q.buyer.name || "Usuario"}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(q.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </span>
                      
                      {q.isBuyer && q.status === "pending" && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Respuesta */}
                  {q.answer ? (
                    <div className="flex gap-3 mt-3 ml-4">
                      <div className="flex-1">
                        <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                          <p className="text-gray-800">{q.answer}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>Respondido por el vendedor</span>
                            {q.answeredAt && (
                              <>
                                <span>•</span>
                                <span>
                                  {formatDistanceToNow(new Date(q.answeredAt), {
                                    addSuffix: true,
                                    locale: es
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : isSeller ? (
                    /* Formulario de respuesta para vendedor */
                    <div className="mt-3 ml-4">
                      {showAnswerInput === q.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={answerText[q.id] || ""}
                            onChange={(e) => 
                              setAnswerText(prev => ({ 
                                ...prev, 
                                [q.id]: e.target.value 
                              }))
                            }
                            className="min-h-[80px] resize-none"
                            maxLength={1000}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAnswer(q.id)}
                              disabled={!answerText[q.id]?.trim() || isSubmitting}
                            >
                              {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Responder"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAnswerInput(null)
                                setAnswerText(prev => ({ ...prev, [q.id]: "" }))
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAnswerInput(q.id)}
                        >
                          Responder
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 ml-4 text-sm text-gray-500 italic">
                      Pendiente de respuesta del vendedor
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ver más */}
      {questions.length >= 10 && (
        <div className="text-center mt-4">
          <Button variant="link" onClick={refresh}>
            Ver todas las preguntas
          </Button>
        </div>
      )}
    </div>
  )
}
