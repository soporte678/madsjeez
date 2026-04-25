"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Package,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  last_message_at: string;
  buyer_unread_count: number;
  seller_unread_count: number;
  buyer_name: string;
  seller_name: string;
  product_title: string | null;
  last_message: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/messages");
      return;
    }
    setUser(session.user);
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        buyer:profiles!buyer_id(full_name),
        seller:profiles!seller_id(full_name),
        product:products(title),
        last_msg:messages(content, created_at)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (data) {
      const mappedConversations = data.map((c: any) => ({
        ...c,
        buyer_name: c.buyer?.full_name || "Comprador",
        seller_name: c.seller?.full_name || "Vendedor",
        product_title: c.product?.title || null,
        last_message: c.last_msg?.[0]?.content || null,
      }));
      setConversations(mappedConversations);
    }
    setLoading(false);
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Fetch messages
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(full_name)
      `)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (data) {
      const mappedMessages = data.map((m: any) => ({
        ...m,
        sender_name: m.sender?.full_name || "Usuario",
      }));
      setMessages(mappedMessages);

      // Mark as read
      const unreadField = conversation.buyer_id === user.id
        ? "buyer_unread_count"
        : "seller_unread_count";

      await supabase
        .from("conversations")
        .update({ [unreadField]: 0 })
        .eq("id", conversation.id);

      fetchConversations();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast.error("Error al enviar mensaje");
      return;
    }

    // Update conversation
    const otherUnreadField = selectedConversation.buyer_id === user.id
      ? "seller_unread_count"
      : "buyer_unread_count";

    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        [otherUnreadField]: supabase.rpc("increment", { x: 1 }),
      })
      .eq("id", selectedConversation.id);

    setNewMessage("");
    selectConversation(selectedConversation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return d.toLocaleDateString("es-AR");
    }
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
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)]">
          <Card className="h-full overflow-hidden">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={`w-full md:w-80 border-r ${selectedConversation ? "hidden md:block" : ""}`}>
                <div className="p-4 border-b">
                  <h1 className="text-xl font-bold">Mensajes</h1>
                </div>

                <div className="overflow-y-auto h-[calc(100%-65px)]">
                  {loading ? (
                    <div className="p-4 text-center">Cargando...</div>
                  ) : conversations.length > 0 ? (
                    conversations.map((conv) => {
                      const isBuyer = conv.buyer_id === user.id;
                      const otherName = isBuyer ? conv.seller_name : conv.buyer_name;
                      const unreadCount = isBuyer ? conv.buyer_unread_count : conv.seller_unread_count;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-gray-50 border-b transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{otherName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{otherName}</span>
                                {unreadCount > 0 && (
                                  <Badge className="bg-[#3483FA]">{unreadCount}</Badge>
                                )}
                              </div>
                              {conv.product_title && (
                                <p className="text-xs text-gray-500 truncate">
                                  {conv.product_title}
                                </p>
                              )}
                              {conv.last_message && (
                                <p className="text-sm text-gray-600 truncate">
                                  {conv.last_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No tienes mensajes</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(selectedConversation.buyer_id === user.id
                          ? selectedConversation.seller_name
                          : selectedConversation.buyer_name)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversation.buyer_id === user.id
                          ? selectedConversation.seller_name
                          : selectedConversation.buyer_name}
                      </p>
                      {selectedConversation.product_title && (
                        <p className="text-xs text-gray-500">
                          Sobre: {selectedConversation.product_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => {
                      const isMine = msg.sender_id === user.id;
                      const showDate = index === 0 ||
                        formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                isMine
                                  ? "bg-[#3483FA] text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-900 rounded-bl-none"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <span className={`text-xs ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1"
                      />
                      <Button type="submit" className="bg-[#3483FA]">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Selecciona una conversación</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header user={null} />
        <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <MessagesPage />
    </Suspense>
  );
}
