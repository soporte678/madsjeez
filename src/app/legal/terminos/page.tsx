import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Términos y Condiciones | MADSJEEZ",
  description: "Términos y condiciones de uso de la plataforma MADSJEEZ Marketplace",
  ...canonicalMeta("/legal/terminos"),
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>
              
              <p className="text-gray-500 mb-8">Última actualización: 25 de abril de 2026</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma MADSJEEZ ("la Plataforma"), usted acepta estar sujeto a estos 
                Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá 
                utilizar nuestros servicios.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">2. Definiciones</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Usuario"</strong>: Cualquier persona que acceda o utilice la Plataforma.</li>
                <li><strong>"Vendedor"</strong>: Usuario que publica productos para su venta.</li>
                <li><strong>"Comprador"</strong>: Usuario que adquiere productos a través de la Plataforma.</li>
                <li><strong>"Producto"</strong>: Bien ofrecido para venta en la Plataforma.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">3. Registro de Cuenta</h2>
              <p>Para utilizar ciertos servicios, debe crear una cuenta proporcionando información veraz, 
                completa y actualizada. Usted es responsable de mantener la confidencialidad de sus 
                credenciales y de todas las actividades que ocurran bajo su cuenta.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">4. Publicaciones de Productos</h2>
              <p>Los vendedores garantizan que:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Son propietarios legales de los productos o están autorizados para venderlos.</li>
                <li>La información proporcionada es precisa y veraz.</li>
                <li>Los productos cumplen con todas las leyes aplicables.</li>
                <li>No publicarán productos prohibidos o ilegales.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">5. Comisiones y Pagos</h2>
              <p>MADSJEEZ cobra comisiones por las ventas realizadas a través de la Plataforma. 
                Las tasas de comisión varían según el plan de suscripción:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Plan Gratis: 10% de comisión</li>
                <li>Plan Plata: 5% de comisión</li>
                <li>Plan Gold: 3% de comisión</li>
                <li>Plan Platinum: 1% de comisión</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">6. Envíos y Entregas</h2>
              <p>Los vendedores son responsables de:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Empacar adecuadamente los productos.</li>
                <li>Enviar los productos dentro del plazo establecido.</li>
                <li>Proporcionar información de seguimiento cuando aplique.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">7. Prohibiciones</h2>
              <p>Está estrictamente prohibido:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vender productos ilegales, falsificados o robados.</li>
                <li>Publicar información falsa o engañosa.</li>
                <li>Realizar transacciones fuera de la Plataforma.</li>
                <li>Acosar o discriminar a otros usuarios.</li>
                <li>Utilizar la Plataforma para actividades fraudulentas.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">8. Sistema de Reputación</h2>
              <p>MADSJEEZ utiliza un sistema de reputación basado en:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Calificaciones de compradores.</li>
                <li>Tiempo de envío.</li>
                <li>Reclamos y cancelaciones.</li>
              </ul>
              <p>Una mala reputación puede resultar en limitaciones o suspensión de la cuenta.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">9. Propiedad Intelectual</h2>
              <p>Los usuarios mantienen los derechos de propiedad intelectual de sus contenidos, 
                pero otorgan a MADSJEEZ una licencia para usar dichos contenidos en relación 
                con los servicios de la Plataforma.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">10. Limitación de Responsabilidad</h2>
              <p>MADSJEEZ actúa como intermediario y no es responsable por:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>La calidad de los productos vendidos.</li>
                <li>Incumplimientos entre compradores y vendedores.</li>
                <li>Pérdidas indirectas o consecuenciales.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">11. Modificaciones</h2>
              <p>MADSJEEZ se reserva el derecho de modificar estos términos en cualquier momento. 
                Los cambios entrarán en vigor al ser publicados. El uso continuado de la Plataforma 
                constituye aceptación de los términos modificados.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">12. Terminación</h2>
              <p>MADSJEEZ puede suspender o terminar cuentas que violen estos términos. 
                Los usuarios pueden cerrar su cuenta en cualquier momento.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">13. Ley Aplicable</h2>
              <p>Estos términos se rigen por las leyes de la República Argentina. 
                Cualquier disputa será resuelta ante los tribunales competentes de la Ciudad Autónoma de Buenos Aires.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">14. Contacto</h2>
              <p>Para consultas sobre estos términos, contacte a:</p>
              <p>Email: legal@madsjeez.com</p>
              <p>Dirección: [Dirección de la empresa]</p>

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
