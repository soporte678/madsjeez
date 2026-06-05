"use client"

import { useRef, useState } from "react"
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
  Paperclip,
  Lock,
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = selectedImages.length + newFiles.length

    if (totalImages > 2) {
      alert("Maximo 2 imagenes permitidas")
      return
    }

    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo excede el tamano maximo de 5MB")
        return
      }
    }

    setSelectedImages(prev => [...prev, ...newFiles])
    
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

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
        throw new Error(err.error || "Error al subir imagenes")
      }

      const data = await res.json()
      return data.urls || []
    } catch (error: any) {
      throw new Error(error.message || "Error al subir imagenes")
    } finally {
      setUploadingImages(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return
    
    setIsSubmitting(true)
    try {
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
    if (!confirm("Eliminar esta pregunta?")) return
    
    try {
      await deleteQuestion(questionId)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur-sm dark:border-slate-600/60 dark:bg-slate-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <MessageCircle className="h-5 w-5 text-[#3483fa] dark:text-[#60a5fa]" />
        Preguntas y Respuestas
        {questions.length > 0 && (
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">({questions.length})</span>
        )}
        </h3>
        <div className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
          Flujo real conectado
        </div>
      </div>

      {session?.user && !isSeller && (
        <div className="mb-6 rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-600/60 dark:bg-slate-800/80">
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
                className="min-h-[96px] resize-none rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#3483fa] dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
                maxLength={1000}
              />
              
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
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
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {newQuestion.length}/1000 caracteres
                  </span>

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
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#3483fa] hover:text-[#2968c8] dark:text-[#60a5fa] dark:hover:text-[#93c5fd]"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Adjuntar foto
                      </button>
                    </>
                  )}

                  {uploadingImages && (
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Subiendo...
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleAskQuestion}
                  disabled={!newQuestion.trim() || isSubmitting || uploadingImages}
                  size="sm"
                  className="rounded-xl bg-[#3483fa] px-4 font-semibold text-white shadow-sm hover:bg-[#2968c8] disabled:opacity-60 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb]"
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
              
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Máximo 2 imágenes (5MB cada una). Solo visibles para el vendedor.
              </p>
            </div>
          </div>
        </div>
      )}

      {!session?.user && (
        <div className="mb-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-950/60">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white dark:bg-slate-100 dark:text-slate-900">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Inicia sesion para hacer una pregunta</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                El flujo ya esta conectado al backend real de preguntas. Cuando ingreses vas a poder consultar al vendedor y seguir la respuesta desde tu panel.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 py-10 text-center text-slate-600 dark:border-slate-600 dark:text-slate-300">
            <HelpCircle className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Aún no hay preguntas</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Sé el primero en preguntar sobre este producto</p>
          </div>
        ) : (
          questions.map((q: any) => (
            <div key={q.id} className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 last:pb-4 dark:border-slate-800 dark:bg-slate-950/55">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={q.buyer.image || undefined} />
                  <AvatarFallback>{q.buyer.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm leading-7 text-slate-800 dark:text-slate-100">{q.question}</p>
                    
                    {isSeller && q.images && q.images.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-500/30 dark:bg-orange-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            {q.images.length} imagen{q.images.length > 1 ? 'es' : ''} adjunta{q.images.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-orange-500 dark:text-orange-200/80">(Solo visible para vos)</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {q.images.map((imgUrl: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={imgUrl}
                                alt={`Adjunto ${idx + 1}`}
                                className="h-20 w-20 rounded-xl border border-orange-200 object-cover dark:border-orange-500/30"
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
                    
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                            className="flex items-center gap-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {q.answer ? (
                    <div className="flex gap-3 mt-3 ml-4">
                      <div className="flex-1">
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                          <p className="text-sm leading-7 text-slate-800 dark:text-slate-100">{q.answer}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                            className="min-h-[80px] resize-none rounded-2xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#3483fa] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                            maxLength={1000}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAnswer(q.id)}
                              disabled={!answerText[q.id]?.trim() || isSubmitting}
                              className="rounded-xl bg-[#3483fa] text-white hover:bg-[#2968c8] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb]"
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
                              className="rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                          className="rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          Responder
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 ml-4 text-sm italic text-slate-500 dark:text-slate-400">
                      Pendiente de respuesta del vendedor
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {questions.length >= 10 && (
        <div className="text-center mt-4">
          <Button variant="link" onClick={refresh} className="font-semibold text-[#3483fa] dark:text-[#93c5fd]">
            Ver todas las preguntas
          </Button>
        </div>
      )}
    </div>
  )
}
