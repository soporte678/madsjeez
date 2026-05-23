"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  X,
  Upload,
  Package,
  DollarSign,
  Truck,
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface UserSubscription {
  tier: {
    max_images_per_product: number;
    commission_rate: number;
  } | null;
}

export default function SellPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState<"new" | "used" | "refurbished">("new");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [freeShipping, setFreeShipping] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/sell");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCategories();
      fetchUserSubscription(session.user.id);
    }
  }, [session]);

  const fetchUserSubscription = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("subscriptions")
        .select(`
          tier:subscription_tiers(max_images_per_product, commission_rate)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (data?.tier) {
        setSubscription({ tier: data.tier as any });
      } else {
        setSubscription({
          tier: {
            max_images_per_product: 5,
            commission_rate: 10,
          },
        });
      }
    } catch (error) {
      setSubscription({
        tier: {
          max_images_per_product: 5,
          commission_rate: 10,
        },
      });
    }
  };

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = subscription?.tier?.max_images_per_product || 5;
    const remainingSlots = maxImages - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`Solo puedes subir hasta ${maxImages} imágenes con tu plan`);
    }

    const newImages = [...images, ...filesToAdd];
    setImages(newImages);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateCommission = () => {
    const priceNum = parseFloat(price) || 0;
    const rate = subscription?.tier?.commission_rate || 10;
    return (priceNum * rate) / 100;
  };

  const calculateEarnings = () => {
    const priceNum = parseFloat(price) || 0;
    return priceNum - calculateCommission();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          seller_id: session!.user.id,
          category_id: categoryId || null,
          title,
          slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description,
          condition,
          price: parseFloat(price),
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          currency: "ARS",
          stock: parseInt(stock),
          sales: 0,
          views: 0,
          is_active: true,
          is_boosted: false,
          free_shipping: freeShipping,
          shipping_methods: [],
          attributes,
        })
        .select()
        .single();

      if (productError) throw productError;

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${product.id}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        await supabase.from("product_images").insert({
          product_id: product.id,
          url: publicUrl,
          thumbnail_url: publicUrl,
          alt: title,
          sort_order: i,
          is_primary: i === 0,
        });
      }

      toast.success("¡Publicación creada exitosamente!");
      router.push(`/product/${product.id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al crear la publicación");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-[#3483FA] mb-4" />
              <h2 className="text-xl font-semibold mb-2">Inicia sesión para vender</h2>
              <p className="text-gray-500 mb-4">
                Necesitas una cuenta para publicar productos
              </p>
              <Link href="/auth/login?redirect=/sell">
                <Button className="bg-[#3483FA]">Iniciar sesión</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,#eef3fb_0%,#e9eef7_45%,#edf2f9_100%)]">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-[#0f172a] via-[#162033] to-[#1e3a5f] p-7 text-white shadow-[0_25px_70px_rgba(15,23,42,0.24)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/85">
                  <Sparkles className="h-3.5 w-3.5 text-[#7dd3fc]" />
                  Publicar en MADSJEEZ
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Publicá con una ficha clara, confiable y lista para convertir.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Cargá tu producto con fotos, datos comerciales y condiciones de venta. La experiencia está pensada para
                  que tu publicación se vea profesional desde el primer minuto.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-slate-950/10">
                  <ImagePlus className="h-5 w-5 text-[#93c5fd]" />
                  <p className="mt-3 text-sm font-bold text-white">Fotos protagonistas</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Primera imagen destacada y carga rápida para vender mejor.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-slate-950/10">
                  <ShieldCheck className="h-5 w-5 text-[#86efac]" />
                  <p className="mt-3 text-sm font-bold text-white">Ficha confiable</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Datos claros, precio bien presentado y condiciones visibles.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-slate-950/10">
                  <CheckCircle2 className="h-5 w-5 text-[#fcd34d]" />
                  <p className="mt-3 text-sm font-bold text-white">Lista para publicar</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Una estructura más sólida para lanzar sin fricción.</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white">
                <CardTitle className="flex items-center gap-3 text-[28px] text-slate-950">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] text-[#93c5fd] shadow-lg shadow-slate-900/20">
                    <Camera className="h-5 w-5" />
                  </span>
                  Fotos del producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Subí hasta {subscription?.tier?.max_images_per_product || 5} fotos. La primera será la principal y le va a dar
                  la primera impresión a tu publicación.
                </p>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2 bg-[#3483FA]">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}

                  {images.length < (subscription?.tier?.max_images_per_product || 5) && (
                    <label className="group aspect-square rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3483FA] hover:bg-blue-50 hover:shadow-md">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition-colors group-hover:text-[#3483FA]">
                        <Upload className="h-7 w-7" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Agregar foto</span>
                      <span className="mt-1 px-3 text-center text-[11px] leading-5 text-slate-500">Mostrá bien el producto y mejorá la confianza</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white">
                <CardTitle className="flex items-center gap-3 text-[28px] text-slate-950">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] text-[#86efac] shadow-lg shadow-slate-900/20">
                    <Package className="h-5 w-5" />
                  </span>
                  Datos del producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título * </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: iPhone 14 Pro 128GB - Negro"
                    maxLength={60}
                    required
                  />
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {title.length}/60 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condición *</Label>
                  <Select
                    value={condition}
                    onValueChange={(value: "new" | "used" | "refurbished") => setCondition(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la condición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="used">Usado</SelectItem>
                      <SelectItem value="refurbished">Reacondicionado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tu producto con detalle..."
                    rows={6}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white">
                <CardTitle className="flex items-center gap-3 text-[28px] text-slate-950">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] text-[#fca5a5] shadow-lg shadow-slate-900/20">
                    <DollarSign className="h-5 w-5" />
                  </span>
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Precio de venta *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="pl-7"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="originalPrice">Precio original (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock">Stock disponible *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <Separator />

                {price && (
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-bold text-slate-900">Resumen de tu publicación</p>
                    </div>
                    <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Precio de venta:</span>
                      <span>${parseFloat(price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Comisión ({subscription?.tier?.commission_rate || 10}%):</span>
                      <span className="text-red-500">-${calculateCommission().toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Vas a recibir:</span>
                      <span className="text-green-600">${calculateEarnings().toLocaleString()}</span>
                    </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white">
                <CardTitle className="flex items-center gap-3 text-[28px] text-slate-950">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] text-[#7dd3fc] shadow-lg shadow-slate-900/20">
                    <Truck className="h-5 w-5" />
                  </span>
                  Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="free-shipping"
                      checked={freeShipping}
                      onCheckedChange={setFreeShipping}
                    />
                    <Label htmlFor="free-shipping" className="cursor-pointer">
                      Ofrecer envío gratis
                    </Label>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
                    Recomendado
                  </Badge>
                </div>
                {freeShipping && (
                  <p className="mt-3 text-sm text-slate-500">
                    El costo del envío será descontado de tus ganancias.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-20 rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Último paso: revisar y publicar</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Tu ficha ya tiene estructura comercial, ahora solo falta lanzarla.</p>
                </div>
                <div className="flex gap-4 sm:min-w-[420px]">
              <Button
                type="submit"
                className="flex-1 h-12 bg-[#3483FA] hover:bg-[#2968C8] text-lg font-black"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Publicando...
                  </>
                ) : (
                  "Publicar producto"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8"
                onClick={() => router.push("/")}
              >
                Cancelar
              </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
