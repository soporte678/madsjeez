import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Cookies | MADSJEEZ",
  description: "Política de cookies y tecnologías de seguimiento de MADSJEEZ Marketplace",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <h1 className="text-3xl font-bold mb-6">Política de Cookies</h1>
              
              <p className="text-gray-500 mb-8">Última actualización: 25 de abril de 2026</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">1. ¿Qué son las Cookies?</h2>
              <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                cuando visita un sitio web. Permiten que el sitio recuerde sus acciones y 
                preferencias durante un período de tiempo.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">2. Tipos de Cookies que Utilizamos</h2>

              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Cookies Esenciales</h3>
              <p>Necesarias para el funcionamiento básico de la plataforma:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Autenticación de usuario</li>
                <li>Seguridad de la sesión</li>
                <li>Funcionalidades básicas del carrito</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Cookies de Preferencias</h3>
              <p>Permiten recordar sus configuraciones:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Idioma preferido</li>
                <li>Configuración de visualización</li>
                <li>Ubicación para envíos</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">2.3 Cookies Analíticas</h3>
              <p>Nos ayudan a entender cómo interactúan los usuarios:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Páginas más visitadas</li>
                <li>Tiempo de navegación</li>
                <li>Fuentes de tráfico</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">2.4 Cookies de Marketing</h3>
              <p>Utilizadas para publicidad personalizada:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mostrar anuncios relevantes</li>
                <li>Medir efectividad de campañas</li>
                <li>Remarketing</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">3. Cookies de Terceros</h2>
              <p>Utilizamos servicios de terceros que pueden establecer cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google Analytics (análisis)</li>
                <li>Facebook Pixel (marketing)</li>
                <li>MercadoPago (pagos)</li>
                <li>Proveedores de publicidad</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">4. Gestión de Cookies</h2>
              <p>Puede controlar las cookies de las siguientes maneras:</p>

              <h3 className="text-lg font-medium mt-4 mb-2">4.1 Configuración del Navegador</h3>
              <p>La mayoría de navegadores permiten:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ver cookies instaladas</li>
                <li>Eliminar cookies específicas</li>
                <li>Bloquear cookies de terceros</li>
                <li>Bloquear todas las cookies</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">4.2 Nuestra Herramienta de Preferencias</h3>
              <p>Puede modificar sus preferencias de cookies en cualquier momento a través 
                del panel de configuración de su cuenta.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">5. Duración de las Cookies</h2>
              <table className="w-full border-collapse border border-gray-300 my-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Tipo</th>
                    <th className="border border-gray-300 p-2 text-left">Duración</th>
                    <th className="border border-gray-300 p-2 text-left">Propósito</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Sesión</td>
                    <td className="border border-gray-300 p-2">Hasta cerrar navegador</td>
                    <td className="border border-gray-300 p-2">Mantener sesión activa</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Persistentes</td>
                    <td className="border border-gray-300 p-2">30 días - 1 año</td>
                    <td className="border border-gray-300 p-2">Recordar preferencias</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Analíticas</td>
                    <td className="border border-gray-300 p-2">2 años</td>
                    <td className="border border-gray-300 p-2">Análisis de uso</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold mt-8 mb-4">6. Impacto de Deshabilitar Cookies</h2>
              <p>Si deshabilita ciertas cookies, algunas funcionalidades pueden no estar disponibles:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inicio de sesión automático</li>
                <li>Carrito de compras persistente</li>
                <li>Recomendaciones personalizadas</li>
                <li>Recordar preferencias de búsqueda</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">7. Actualizaciones</h2>
              <p>Podemos actualizar esta política para reflejar cambios en:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tecnologías utilizadas</li>
                <li>Servicios de terceros</li>
                <li>Requisitos legales</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">8. Contacto</h2>
              <p>Para consultas sobre nuestra política de cookies:</p>
              <p>Email: cookies@madsjeez.com</p>

              <hr className="my-8" />
              
              <p className="text-sm text-gray-500">
                © 2026 MADSJEEZ. Todos los derechos reservados.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
