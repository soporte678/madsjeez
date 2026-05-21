import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  User,
  Shield,
  MessageCircle,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";

const helpCategories = [
  {
    icon: ShoppingBag,
    title: "Compras",
    description: "Cómo comprar, seguimiento de pedidos, cancelaciones",
    links: [
      { label: "Cómo hacer una compra", href: "/help/como-comprar" },
      { label: "Seguimiento de envíos", href: "/help/seguimiento" },
      { label: "Cancelar una compra", href: "/help/cancelar" },
    ],
  },
  {
    icon: Package,
    title: "Ventas",
    description: "Publicar productos, gestión de stock, envíos",
    links: [
      { label: "Cómo vender", href: "/help/como-vender" },
      { label: "Publicar un producto", href: "/help/publicar" },
      { label: "Gestionar mis ventas", href: "/help/gestion-ventas" },
    ],
  },
  {
    icon: Truck,
    title: "Envíos",
    description: "Métodos de envío, costos, tiempos de entrega",
    links: [
      { label: "Opciones de envío", href: "/help/opciones-envio" },
      { label: "Costos y plazos", href: "/help/costos-envio" },
      { label: "Problemas con envíos", href: "/help/problemas-envio" },
    ],
  },
  {
    icon: RotateCcw,
    title: "Devoluciones",
    description: "Política de devoluciones, reembolsos, garantía",
    links: [
      { label: "Cómo devolver un producto", href: "/legal/reembolsos" },
      { label: "Política de reembolsos", href: "/legal/reembolsos" },
      { label: "Garantía de productos", href: "/help/garantia" },
    ],
  },
  {
    icon: CreditCard,
    title: "Pagos",
    description: "Métodos de pago, facturación, seguridad",
    links: [
      { label: "Métodos de pago", href: "/help/metodos-pago" },
      { label: "Facturación", href: "/help/facturacion" },
      { label: "Seguridad de pagos", href: "/help/seguridad-pagos" },
    ],
  },
  {
    icon: User,
    title: "Cuenta",
    description: "Configuración de cuenta, verificación, seguridad",
    links: [
      { label: "Crear una cuenta", href: "/help/crear-cuenta" },
      { label: "Verificar mi cuenta", href: "/help/verificar" },
      { label: "Cambiar contraseña", href: "/help/cambiar-password" },
    ],
  },
];

const faqs = [
  {
    question: "¿Cómo puedo rastrear mi pedido?",
    answer:
      "Puedes rastrear tu pedido desde la sección 'Mis Compras' en tu cuenta. Allí encontrarás el número de seguimiento y el estado actual de tu envío.",
  },
  {
    question: "¿Cuánto tiempo tarda en llegar mi pedido?",
    answer:
      "El tiempo de entrega depende de tu ubicación y el método de envío seleccionado. Generalmente, los envíos tardan entre 2 y 7 días hábiles.",
  },
  {
    question: "¿Puedo cancelar una compra?",
    answer:
      "Sí, puedes cancelar una compra siempre que el vendedor no haya enviado el producto. Ve a 'Mis Compras' y selecciona la opción de cancelar.",
  },
  {
    question: "¿Qué hago si el producto llega dañado?",
    answer:
      "Si recibes un producto dañado, tienes 48 horas para reportarlo. Ve a 'Mis Compras', selecciona el pedido y abre un reclamo con fotos del daño.",
  },
  {
    question: "¿Cómo me convierto en vendedor?",
    answer:
      "Para vender en MADSJEEZ, crea una cuenta, verifica tu identidad y comienza a publicar productos desde la sección 'Vender'.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Hero */}
        <div className="bg-[#3483FA] text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">¿Cómo podemos ayudarte?</h1>
              <p className="text-blue-100 mb-6">
                Busca en nuestra base de conocimientos o contacta con nuestro equipo de soporte
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar ayuda..."
                  className="pl-12 h-12 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {helpCategories.map((category) => (
              <Card key={category.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <category.icon className="h-6 w-6 text-[#3483FA]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                      <ul className="space-y-2">
                        {category.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              className="text-sm text-[#3483FA] hover:underline flex items-center gap-1"
                            >
                              {link.label}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact */}
          <Card id="contacto" className="bg-gray-900 text-white scroll-mt-24">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">¿Necesitas más ayuda?</h2>
                  <p className="text-gray-400 mb-6">
                    Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-[#3483FA]" />
                      <span>0800-123-MADS (6237)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[#3483FA]" />
                      <span>soporte@madsjeez.com</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/help#contacto">
                    <Button className="w-full bg-[#3483FA] hover:bg-[#2968C8] h-12">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Chat en vivo
                    </Button>
                  </Link>
                  <Link href="mailto:soporte@madsjeez.com">
                    <Button variant="outline" className="w-full h-12 border-white text-white hover:bg-white/10">
                      Enviar mensaje
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
