import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Privacidad | MADSJEEZ",
  description: "Política de privacidad y protección de datos de MADSJEEZ Marketplace",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
              
              <p className="text-gray-500 mb-8">Última actualización: 25 de abril de 2026</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">1. Introducción</h2>
              <p>En MADSJEEZ, valoramos su privacidad. Esta Política de Privacidad explica cómo 
                recopilamos, usamos, almacenamos y protegemos su información personal cuando 
                utiliza nuestra plataforma de marketplace.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">2. Información que Recopilamos</h2>
              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Información proporcionada por usted:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nombre completo y datos de contacto</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección de envío y facturación</li>
                <li>Documento de identidad (para vendedores verificados)</li>
                <li>Información bancaria para pagos</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Información recopilada automáticamente:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dirección IP y ubicación aproximada</li>
                <li>Tipo de dispositivo y navegador</li>
                <li>Historial de navegación en la plataforma</li>
                <li>Cookies y tecnologías similares</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">3. Uso de la Información</h2>
              <p>Utilizamos su información para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Procesar transacciones y pagos</li>
                <li>Comunicarnos sobre su cuenta y pedidos</li>
                <li>Prevenir fraudes y actividades ilícitas</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Enviar comunicaciones de marketing (con su consentimiento)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">4. Compartir Información</h2>
              <p>Podemos compartir su información con:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Otros usuarios:</strong> Información necesaria para completar transacciones</li>
                <li><strong>Proveedores de servicios:</strong> Procesamiento de pagos, envíos, análisis</li>
                <li><strong>Autoridades:</strong> Cuando sea requerido por ley</li>
                <li><strong>Afiliados:</strong> Empresas del grupo MADSJEEZ</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">5. Seguridad de Datos</h2>
              <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encriptación SSL/TLS para transmisiones de datos</li>
                <li>Almacenamiento encriptado en servidores seguros</li>
                <li>Acceso restringido a personal autorizado</li>
                <li>Monitoreo continuo de seguridad</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">6. Sus Derechos</h2>
              <p>De acuerdo con la Ley de Protección de Datos Personales (Ley 25.326), usted tiene derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar información inexacta</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Retirar su consentimiento</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">7. Retención de Datos</h2>
              <p>Conservamos su información durante el tiempo necesario para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cumplir con obligaciones legales y fiscales</li>
                <li>Resolver disputas</li>
                <li>Hacer cumplir nuestros términos</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">8. Transferencias Internacionales</h2>
              <p>Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de Argentina. 
                Garantizamos que dichas transferencias cumplen con estándares de protección de datos adecuados.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">9. Menores de Edad</h2>
              <p>Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos 
                intencionalmente información de menores. Si descubrimos que hemos recopilado 
                datos de un menor, los eliminaremos de inmediato.</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">10. Cambios a esta Política</h2>
              <p>Podemos actualizar esta política periódicamente. Los cambios significativos 
                serán notificados mediante:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Correo electrónico</li>
                <li>Notificación en la plataforma</li>
                <li>Aviso en nuestro sitio web</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">11. Contacto</h2>
              <p>Para ejercer sus derechos o realizar consultas sobre privacidad:</p>
              <p>Email: privacidad@madsjeez.com</p>
              <p>Dirección postal: [Dirección de la empresa]</p>
              <p>También puede contactar a la Dirección Nacional de Protección de Datos Personales.</p>

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
