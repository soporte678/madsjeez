export default function TerminosPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Uso</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          <strong>Última actualización:</strong> 24 de abril de 2025
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Aceptación de los Términos</h2>
        <p className="mb-4">
          Al acceder y utilizar MadsJeez ("la Plataforma"), usted acepta estar sujeto a estos Términos y Condiciones 
          de Uso ("Términos"). Si no está de acuerdo con alguna parte de estos términos, no podrá acceder ni utilizar 
          nuestros servicios.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Definiciones</h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>"MadsJeez"</strong>: Plataforma de marketplace operada por MadsJeez S.A.</li>
          <li><strong>"Usuario"</strong>: Cualquier persona que acceda o utilice la Plataforma.</li>
          <li><strong>"Vendedor"</strong>: Usuario que publica productos para su venta.</li>
          <li><strong>"Comprador"</strong>: Usuario que adquiere productos a través de la Plataforma.</li>
          <li><strong>"Producto"</strong>: Bien ofrecido en la Plataforma.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Registro de Cuenta</h2>
        <p className="mb-4">
          Para utilizar ciertos servicios, debe crear una cuenta proporcionando información veraz, completa y actualizada. 
          Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran 
          bajo su cuenta.
        </p>
        <p className="mb-4">
          MadsJeez se reserva el derecho de suspender o terminar cuentas que proporcionen información falsa o que 
          violen estos Términos.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Publicación de Productos (Vendedores)</h2>
        <p className="mb-4">Los vendedores se comprometen a:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Ofrecer únicamente productos legales y que posean derecho para vender</li>
          <li>Describir los productos con precisión y veracidad</li>
          <li>Cumplir con los plazos de envío comprometidos</li>
          <li>Responder consultas de compradores en un plazo máximo de 48 horas</li>
          <li>Mantener stock actualizado de los productos publicados</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Sistema de Suscripciones</h2>
        <p className="mb-4">MadsJeez ofrece planes de suscripción con las siguientes características:</p>
        
        <table className="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Plan</th>
              <th className="border border-gray-300 px-4 py-2">Precio</th>
              <th className="border border-gray-300 px-4 py-2">Comisión</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Gratis</td>
              <td className="border border-gray-300 px-4 py-2">$0</td>
              <td className="border border-gray-300 px-4 py-2">15%</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Plata</td>
              <td className="border border-gray-300 px-4 py-2">$9.999/mes</td>
              <td className="border border-gray-300 px-4 py-2">12%</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Gold</td>
              <td className="border border-gray-300 px-4 py-2">$19.999/mes</td>
              <td className="border border-gray-300 px-4 py-2">8%</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Platinum</td>
              <td className="border border-gray-300 px-4 py-2">$49.999/mes</td>
              <td className="border border-gray-300 px-4 py-2">5%</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Sistema de Reputación</h2>
        <p className="mb-4">Los vendedores acumulan reputación basada en:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Verde Oscuro:</strong> Excelente (0% reclamos)</li>
          <li><strong>Verde:</strong> Muy buena (menos 2% reclamos)</li>
          <li><strong>Amarillo:</strong> Buena (2-5% reclamos)</li>
          <li><strong>Naranja:</strong> Regular (5-10% reclamos)</li>
          <li><strong>Rojo:</strong> Mala (mas 10% reclamos)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Programa de Impulso</h2>
        <p className="mb-4">
          El costo del impulso varía según la reputación del vendedor. Vendedores con mejor reputación 
          pagan menos por impulsar sus productos.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Pagos y Facturación</h2>
        <p className="mb-4">
          Los pagos se procesan a través de Stripe. Las suscripciones se renuevan automáticamente 
          mensualmente hasta su cancelación. No se realizan reembolsos por períodos parciales.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Propiedad Intelectual</h2>
        <p className="mb-4">
          Los usuarios mantienen los derechos de propiedad intelectual sobre el contenido que publican. 
          Al publicar en MadsJeez, otorga una licencia no exclusiva para mostrar dicho contenido en la Plataforma.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">10. Limitación de Responsabilidad</h2>
        <p className="mb-4">
          MadsJeez actúa como intermediario entre compradores y vendedores. No somos responsables por:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>La calidad o autenticidad de los productos vendidos</li>
          <li>Incumplimientos de los vendedores</li>
          <li>Pérdidas directas o indirectas derivadas del uso de la Plataforma</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">11. Modificaciones</h2>
        <p className="mb-4">
          MadsJeez se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios 
          entrarán en vigor inmediatamente después de su publicación. El uso continuado de la Plataforma 
          constituye aceptación de los términos modificados.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">12. Ley Aplicable</h2>
        <p className="mb-4">
          Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa será 
          resuelta por los tribunales competentes de la Ciudad Autónoma de Buenos Aires.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">13. Contacto</h2>
        <p className="mb-4">
          Para consultas sobre estos Términos, contáctenos en: 
          <a href="mailto:legal@madsjeez.com.ar" className="text-blue-600 hover:underline">legal@madsjeez.com.ar</a>
        </p>
      </div>
    </div>
  )
}
