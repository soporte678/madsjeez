import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Política de Reembolsos | MADSJEEZ",
  description: "Política de reembolsos y devoluciones de MADSJEEZ Marketplace",
  ...canonicalMeta("/legal/reembolsos"),
};

export default function ReembolsosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <h1 className="text-3xl font-bold mb-6">Política de Reembolsos</h1>
              
              <p className="text-gray-500 mb-8">Última actualización: 25 de abril de 2026</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="font-medium text-blue-800 mb-2">Resumen</p>
                <p className="text-blue-700">
                  En MADSJEEZ queremos que compres con confianza. Ofrecemos devoluciones gratuitas 
                  dentro de los 10 días de recibido el producto, siempre que cumpla con nuestras 
                  condiciones establecidas.
                </p>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">1. Plazo para Devoluciones</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>10 días corridos</strong> desde la recepción del producto</li>
                <li>El plazo comienza a correr desde que el producto es marcado como entregado</li>
                <li>Para productos con defecto de fábrica: 30 días</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">2. Condiciones del Producto</h2>
              <p>Para ser elegible a devolución, el producto debe:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Estar en las mismas condiciones que fue recibido</li>
                <li>Incluir todos los accesorios y empaques originales</li>
                <li>No mostrar signos de uso o desgaste</li>
                <li>Tener las etiquetas y sellos intactos (cuando aplique)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">3. Productos Excluidos</h2>
              <p>No aplican devoluciones para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Productos personalizados o hechos a medida</li>
                <li>Productos perecederos (alimentos, plantas)</li>
                <li>Productos de higiene personal abiertos</li>
                <li>Software o contenido digital descargado</li>
                <li>Productos marcados como "sin devolución"</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">4. Proceso de Devolución</h2>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Iniciar solicitud:</strong> Accede a "Mis Compras" y selecciona 
                  "Solicitar devolución" en el pedido correspondiente.
                </li>
                <li>
                  <strong>Motivo:</strong> Selecciona el motivo de la devolución y proporciona 
                  fotos si es necesario.
                </li>
                <li>
                  <strong>Aprobación:</strong> El vendedor tiene 48 horas para responder. 
                  Si no responde, se aprueba automáticamente.
                </li>
                <li>
                  <strong>Envío:</strong> Una vez aprobada, recibirás una etiqueta de envío 
                  prepaga para devolver el producto.
                </li>
                <li>
                  <strong>Reembolso:</strong> Después de recibir y verificar el producto, 
                  procesaremos tu reembolso en 3-5 días hábiles.
                </li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">5. Tipos de Reembolso</h2>
              <table className="w-full border-collapse border border-gray-300 my-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Método</th>
                    <th className="border border-gray-300 p-2 text-left">Plazo</th>
                    <th className="border border-gray-300 p-2 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">Mismo método de pago</td>
                    <td className="border border-gray-300 p-2">3-5 días hábiles</td>
                    <td className="border border-gray-300 p-2">Método predeterminado</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Crédito en cuenta</td>
                    <td className="border border-gray-300 p-2">Inmediato</td>
                    <td className="border border-gray-300 p-2">Para futuras compras</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">Transferencia bancaria</td>
                    <td className="border border-gray-300 p-2">5-7 días hábiles</td>
                    <td className="border border-gray-300 p-2">Requiere datos bancarios</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold mt-8 mb-4">6. Costos de Devolución</h2>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-medium text-green-800">✓ Envío Gratis</p>
                  <p className="text-green-700 text-sm">
                    Si el producto tiene "Envío gratis" o el motivo es "Producto defectuoso/diferente", 
                    el envío de devolución es gratuito.
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-yellow-800">⚠ Costo a cargo del comprador</p>
                  <p className="text-yellow-700 text-sm">
                    Si el motivo es "Arrepentimiento" o "No me gustó", el costo de envío 
                    será descontado del reembolso (aproximadamente $2.500 - $5.000 según zona).
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">7. Protección al Comprador</h2>
              <p>MADSJEEZ ofrece protección adicional cuando:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>El producto nunca llegó</li>
                <li>El producto es significativamente diferente a la descripción</li>
                <li>El producto llegó dañado</li>
                <li>El vendedor no cumple con la política de devoluciones</li>
              </ul>
              <p>En estos casos, contacta a nuestro equipo de soporte para asistencia prioritaria.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">8. Reembolsos Parciales</h2>
              <p>En ciertos casos, se puede ofrecer un reembolso parcial:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Producto con daño menor que no afecta su funcionalidad</li>
                <li>Faltante de accesorios no esenciales</li>
                <li>Retraso en el envío (compensación)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">9. Cancelaciones</h2>
              <p>Puedes cancelar un pedido:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Antes del envío:</strong> Reembolso completo inmediato</li>
                <li><strong>Después del envío:</strong> Debes esperar a recibirlo y solicitar devolución</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">10. Disputas</h2>
              <p>Si no llegas a un acuerdo con el vendedor:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Abre una disputa desde tu panel de compras</li>
                <li>Proporciona evidencia (fotos, videos, descripción)</li>
                <li>Nuestro equipo revisará el caso en 48-72 horas</li>
                <li>Se emitirá una resolución vinculante</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">11. Contacto</h2>
              <p>Para consultas sobre devoluciones:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: devoluciones@madsjeez.com</li>
                <li>Teléfono: 0800-123-MADS (6237)</li>
                <li>Chat en vivo: Disponible 24/7</li>
              </ul>

              <div className="mt-8 flex gap-4">
                <Link href="/ayuda">
                  <Button variant="outline">Centro de Ayuda</Button>
                </Link>
                <Link href="/contact">
                  <Button className="bg-[#3483FA]">Contactar Soporte</Button>
                </Link>
              </div>

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
