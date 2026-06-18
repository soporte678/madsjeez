"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Lock,
  Bell,
  CreditCard,
  MapPin,
  Camera,
  Save,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function SettingsContent() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
    avatar_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_messages: true,
    email_promotions: false,
    push_orders: true,
    push_messages: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/settings");
      return;
    }

    setUser(session.user);
    fetchProfile(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    const supabase = createClient();
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!user) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Error al actualizar perfil");
    } else {
      toast.success("Perfil actualizado correctamente");
    }
    setSaving(false);
  };

  const updatePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwordData.new_password,
    });

    if (error) {
      toast.error("Error al cambiar contraseña: " + error.message);
    } else {
      toast.success("Contraseña actualizada correctamente");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
    setSaving(false);
  };

  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG, WebP o GIF");
      return;
    }

    const fileExtRaw = file.name.split(".").pop()?.toLowerCase() ?? "";
    const fileExtDot = `.${fileExtRaw}`;
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(fileExtDot)) {
      toast.error("Solo se permiten imágenes JPG, PNG, WebP o GIF");
      return;
    }

    const supabase = createClient();
    const fileExt = fileExtRaw;
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error("Error al subir imagen");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (!updateError) {
      setFormData({ ...formData, avatar_url: publicUrl });
      toast.success("Avatar actualizado");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Configuración</h1>

          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        {formData.avatar_url ? (
                          <img
                            src={formData.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="text-2xl">
                            {formData.full_name?.[0] || user.email[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#3483FA] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2968C8]">
                        <Camera className="h-4 w-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Foto de perfil</h2>
                      <p className="text-sm text-gray-500">
                        JPG, PNG o GIF. Máximo 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email} disabled />
                      <p className="text-sm text-gray-500 mt-1">
                        El email no se puede cambiar
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+54 11 1234-5678"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Biografía</Label>
                      <textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Cuéntanos sobre ti..."
                        rows={4}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <Button
                      onClick={updateProfile}
                      disabled={saving}
                      className="bg-[#3483FA]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Cambiar contraseña</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current_password">Contraseña actual</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="new_password">Nueva contraseña</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      onClick={updatePassword}
                      disabled={saving}
                      className="bg-[#3483FA]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        "Cambiar contraseña"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Preferencias de notificaciones</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Email</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Pedidos</p>
                            <p className="text-sm text-gray-500">
                              Recibe actualizaciones sobre tus pedidos
                            </p>
                          </div>
                          <Switch
                            checked={notifications.email_orders}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                email_orders: checked,
                              })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Mensajes</p>
                            <p className="text-sm text-gray-500">
                              Notificaciones de nuevos mensajes
                            </p>
                          </div>
                          <Switch
                            checked={notifications.email_messages}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                email_messages: checked,
                              })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Promociones</p>
                            <p className="text-sm text-gray-500">
                              Ofertas y novedades del marketplace
                            </p>
                          </div>
                          <Switch
                            checked={notifications.email_promotions}
                            onCheckedChange={(checked) =>
                              setNotifications({
                                ...notifications,
                                email_promotions: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando configuración...</p>
            </div>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
