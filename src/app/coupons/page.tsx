"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ticket,
  Copy,
  Check,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  applies_to: "all" | "category" | "product" | "seller";
  target_id: string | null;
  created_at: string;
}

function CouponsContent() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    applies_to: "all",
    target_id: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      toast.error("No tienes permisos");
      router.push("/");
      return;
    }

    setIsAdmin(true);
    fetchCoupons();
  };

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCoupons(data);
    setLoading(false);
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("coupons").insert({
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      usage_count: 0,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: true,
      applies_to: formData.applies_to,
      target_id: formData.target_id || null,
    });

    if (error) {
      toast.error("Error al crear cupón: " + error.message);
    } else {
      toast.success("Cupón creado exitosamente");
      setShowForm(false);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_purchase: "",
        max_discount: "",
        usage_limit: "",
        start_date: "",
        end_date: "",
        applies_to: "all",
        target_id: "",
      });
      fetchCoupons();
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar cupón");
    } else {
      toast.success(currentStatus ? "Cupón desactivado" : "Cupón activado");
      fetchCoupons();
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón?")) return;

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar cupón");
    } else {
      toast.success("Cupón eliminado");
      fetchCoupons();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ id: user.id, email: user.email }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="h-6 w-6" />
                Cupones de Descuento
              </h1>
              <p className="text-gray-600">Gestiona los cupones de tu marketplace</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#3483FA]">
              {showForm ? (
                "Cancelar"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo cupón
                </>
              )}
            </Button>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Crear nuevo cupón</h2>
                <form onSubmit={createCoupon} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Código del cupón *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="EJ: DESCUENTO20"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateRandomCode}
                        >
                          Generar
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Tipo de descuento *</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, discount_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <div className="flex items-center">
                              <Percent className="h-4 w-4 mr-2" />
                              Porcentaje
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Monto fijo
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Valor del descuento *</Label>
                      <Input
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_value: e.target.value,
                          })
                        }
                        placeholder={
                          formData.discount_type === "percentage"
                            ? "Ej: 20"
                            : "Ej: 5000"
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Compra mínima</Label>
                      <Input
                        type="number"
                        value={formData.min_purchase}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_purchase: e.target.value,
                          })
                        }
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <Label>Descuento máximo</Label>
                      <Input
                        type="number"
                        value={formData.max_discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_discount: e.target.value,
                          })
                        }
                        placeholder="Para porcentajes"
                      />
                    </div>

                    <div>
                      <Label>Límite de usos</Label>
                      <Input
                        type="number"
                        value={formData.usage_limit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usage_limit: e.target.value,
                          })
                        }
                        placeholder="Ilimitado si vacío"
                      />
                    </div>

                    <div>
                      <Label>Fecha inicio</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Fecha fin</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-[#3483FA]">
                      Crear cupón
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Coupons List */}
          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : coupons.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => {
                const expired = isExpired(coupon.end_date);
                const usagePercent = coupon.usage_limit
                  ? (coupon.usage_count / coupon.usage_limit) * 100
                  : 0;

                return (
                  <Card
                    key={coupon.id}
                    className={
                      !coupon.is_active || expired ? "opacity-60" : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-[#3483FA] rounded-lg flex items-center justify-center">
                            <Ticket className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{coupon.code}</p>
                            <p className="text-sm text-gray-500">
                              {coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `$${coupon.discount_value.toLocaleString()} OFF`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(coupon.code)}
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {coupon.min_purchase && (
                          <p className="text-gray-600">
                            Compra mínima: ${coupon.min_purchase.toLocaleString()}
                          </p>
                        )}

                        {coupon.max_discount && (
                          <p className="text-gray-600">
                            Descuento máx: ${coupon.max_discount.toLocaleString()}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {coupon.end_date
                              ? `Vence: ${new Date(
                                  coupon.end_date
                                ).toLocaleDateString("es-AR")}`
                              : "Sin fecha de vencimiento"}
                          </span>
                        </div>

                        {coupon.usage_limit && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Usos</span>
                              <span>
                                {coupon.usage_count} / {coupon.usage_limit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#3483FA] h-2 rounded-full"
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Badge
                          variant={coupon.is_active ? "default" : "secondary"}
                          className={
                            expired
                              ? "bg-red-100 text-red-800"
                              : coupon.is_active
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {expired
                            ? "Expirado"
                            : coupon.is_active
                            ? "Activo"
                            : "Inactivo"}
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleCouponStatus(coupon.id, coupon.is_active)
                          }
                        >
                          {coupon.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Ticket className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No hay cupones</h2>
                <p className="text-gray-500">Crea tu primer cupón de descuento</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header user={null} />
          <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <CouponsContent />
    </Suspense>
  );
}
