"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  ShoppingBag,
  MessageSquare,
  Package,
  Star,
  TrendingUp,
  Check,
  Trash2,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type: "order" | "message" | "review" | "promotion" | "system";
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const notificationIcons = {
  order: ShoppingBag,
  message: MessageSquare,
  review: Star,
  promotion: TrendingUp,
  system: Bell,
};

const notificationColors = {
  order: "bg-blue-100 text-blue-600",
  message: "bg-green-100 text-green-600",
  review: "bg-yellow-100 text-yellow-600",
  promotion: "bg-purple-100 text-purple-600",
  system: "bg-gray-100 text-gray-600",
};

function NotificationsContent() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/notifications");
      return;
    }
    setUser(session.user);
    fetchNotifications(session.user.id);
  };

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Todas las notificaciones marcadas como leídas");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }
  };

  const deleteAllRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("is_read", true);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success("Notificaciones leídas eliminadas");
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    return d.toLocaleDateString("es-AR");
  };

  if (!user) {
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
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Notificaciones</h1>
              {unreadCount > 0 && (
                <Badge className="bg-[#3483FA]">{unreadCount} nuevas</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
              <Link href="/settings/notifications">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                No leídas ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  return (
                    <Card
                      key={notification.id}
                      className={notification.is_read ? "opacity-70" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              notificationColors[notification.type]
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDate(notification.created_at)}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteNotification(notification.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>

                            {notification.link && (
                              <Link href={notification.link}>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto mt-2 text-[#3483FA]"
                                >
                                  Ver detalle
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      No hay notificaciones
                    </h2>
                    <p className="text-gray-500">
                      Te notificaremos cuando tengas nuevas actividades
                    </p>
                  </CardContent>
                </Card>
              )}

              {notifications.some((n) => n.is_read) && (
                <div className="text-center">
                  <Button variant="outline" onClick={deleteAllRead}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar notificaciones leídas
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  return (
                    <Card key={notification.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              notificationColors[notification.type]
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="flex-1">
                            <p className="font-semibold">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.content}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como leída
                              </Button>
                              {notification.link && (
                                <Link href={notification.link}>
                                  <Button variant="outline" size="sm">
                                    Ver
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      ¡Todo al día!
                    </h2>
                    <p className="text-gray-500">
                      No tienes notificaciones pendientes
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function NotificationsPage() {
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
      <NotificationsContent />
    </Suspense>
  );
}
