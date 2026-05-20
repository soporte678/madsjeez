import { COMPANY } from "@/lib/company";

export default function AvisoLegalPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Aviso Legal</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          <strong>Última actualización:</strong> mayo de 2026
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Información de la Empresa</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p><strong>Razón Social:</strong> {COMPANY.legalName}</p>
          <p><strong>Responsable / Fundador:</strong> {COMPANY.founder.name} — {COMPANY.founder.role}</p>
          <p><strong>CUIT:</strong> {COMPANY.cuitFormatted}</p>
          <p><strong>Domicilio:</strong> {COMPANY.address.full}</p>
          <p><strong>Email:</strong>{" "}
            <a href={`mailto:${COMPANY.emailLegal}`} className="text-blue-600 hover:underline">
              {COMPANY.emailLegal}
            </a>
            {" · "}
            <a href={`mailto:${COMPANY.email}`} className="text-blue-600 hover:underline">
              {COMPANY.email}
            </a>
          </p>
          <p><strong>Teléfono / WhatsApp:</strong>{" "}
            <a href={COMPANY.whatsappUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {COMPANY.phoneDisplay}
            </a>
          </p>
          <p>
            <a href="/quienes-somos" className="text-blue-600 hover:underline">
              Quiénes somos
            </a>
          </p>
        </div>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Objeto de la Plataforma</h2>
        <p className="mb-4">
          MadsJeez es una plataforma de marketplace que conecta compradores y vendedores. 
          No somos propietarios de los productos ofrecidos ni participamos directamente en las 
          transacciones entre usuarios, actuando únicamente como intermediarios tecnológicos.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Condiciones de Uso</h2>
        <p className="mb-4">El uso de esta plataforma implica la aceptación de:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Los <a href="/legal/terminos" className="text-blue-600 hover:underline">Términos y Condiciones de Uso</a></li>
          <li>La <a href="/legal/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</a></li>
          <li>Las leyes aplicables de la República Argentina</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Propiedad Intelectual</h2>
        
        <h3 className="text-lg font-medium mt-4 mb-2">4.1 Derechos de MadsJeez:</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>El nombre "MadsJeez", el logo y la identidad visual son marcas registradas</li>
          <li>El código fuente, diseño y estructura de la plataforma están protegidos por derechos de autor</li>
          <li>Queda prohibida la reproducción total o parcial sin autorización expresa</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">4.2 Contenido de Usuarios:</h3>
        <p className="mb-4">
          Los usuarios mantienen los derechos sobre el contenido que publican. Al publicar en MadsJeez, 
          otorgan una licencia no exclusiva, gratuita y transferible para:
        </p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Mostrar el contenido en la plataforma</li>
          <li>Promocionar los productos dentro y fuera de la plataforma</li>
          <li>Usar el contenido para mejorar nuestros servicios</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Responsabilidad</h2>
        
        <h3 className="text-lg font-medium mt-4 mb-2">5.1 Limitación de Responsabilidad:</h3>
        <p className="mb-4">MadsJeez no se hace responsable por:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>La calidad, seguridad o legalidad de los productos vendidos</li>
          <li>La veracidad de la información proporcionada por los usuarios</li>
          <li>Incumplimientos de contrato entre compradores y vendedores</li>
          <li>Daños indirectos, incidentales o consecuentes</li>
          <li>Pérdida de beneficios o datos</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">5.2 Responsabilidad de Usuarios:</h3>
        <p className="mb-4">Los usuarios son responsables de:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>La veracidad de la información proporcionada</li>
          <li>El cumplimiento de sus obligaciones fiscales</li>
          <li>La calidad y seguridad de los productos vendidos</li>
          <li>Cualquier daño causado a terceros</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Sistema de Calificación</h2>
        <p className="mb-4">
          MadsJeez implementa un sistema de reputación basado en la experiencia de los usuarios. 
          Las calificaciones y comentarios expresan opiniones personales y no constituyen hechos 
          verificados por MadsJeez.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Procedimiento de Reclamaciones</h2>
        <p className="mb-4">En caso de disputas entre usuarios:</p>
        
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>Las partes deberán intentar resolver la disputa directamente</li>
          <li>Si no se llega a un acuerdo, MadsJeez puede intervenir como mediador</li>
          <li>MadsJeez se reserva el derecho de tomar decisiones finales sobre disputas</li>
          <li>Las decisiones de MadsJeez son vinculantes para el uso de la plataforma</li>
        </ol>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Suspensión y Terminación</h2>
        <p className="mb-4">MadsJeez puede suspender o terminar cuentas que:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Violen estos términos o las políticas de la plataforma</li>
          <li>Engañen a otros usuarios</li>
          <li>Vendan productos prohibidos o ilegales</li>
          <li>Tengan comportamientos fraudulentos</li>
          <li>Acumulen múltiples reclamos válidos</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Legislación Aplicable</h2>
        <p className="mb-4">Este aviso legal se rige por:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Ley 25.326 de Protección de Datos Personales</li>
          <li>Ley 24.240 de Defensa del Consumidor</li>
          <li>Ley 22.802 de Lealtad Comercial</li>
          <li>Código Civil y Comercial de la Nación</li>
          <li>Normas aplicables de defensa de la competencia</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">10. Jurisdicción</h2>
        <p className="mb-4">
          Cualquier disputa relacionada con este aviso legal será sometida a los tribunales 
          ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando expresamente a cualquier 
          otro fuero que pudiera corresponder.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">11. Modificaciones</h2>
        <p className="mb-4">
          MadsJeez se reserva el derecho de modificar este aviso legal en cualquier momento. 
          Las modificaciones entrarán en vigor desde su publicación en la plataforma.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">12. Contacto Legal</h2>
        <p className="mb-4">
          Para consultas legales o notificaciones:<br />
          <strong>Departamento Legal</strong><br />
          Email: <a href="mailto:legal@madsjeez.com.ar" className="text-blue-600 hover:underline">legal@madsjeez.com.ar</a><br />
          Dirección: [Dirección postal]<br />
          Horario de atención: Lunes a Viernes de 9:00 a 18:00 hs.
        </p>

        <hr className="my-8" />
        
        <p className="text-sm text-gray-500">
          © 2025 MadsJeez S.A. Todos los derechos reservados. 
          El uso no autorizado de esta plataforma puede dar lugar a acciones legales.
        </p>
      </div>
    </div>
  )
}
