export default function PrivacidadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          <strong>Última actualización:</strong> 24 de abril de 2025
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Introducción</h2>
        <p className="mb-4">
          MadsJeez S.A. ("MadsJeez", "nosotros", "nuestro") se compromete a proteger su privacidad. 
          Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos 
          su información personal cuando utiliza nuestra plataforma.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Información que Recopilamos</h2>
        
        <h3 className="text-lg font-medium mt-4 mb-2">2.1 Información proporcionada por usted:</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Nombre y apellido</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Dirección postal (para envíos)</li>
          <li>Información de pago (procesada por terceros)</li>
          <li>Documento de identidad (para vendedores verificados)</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">2.2 Información recopilada automáticamente:</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Dirección IP</li>
          <li>Tipo de navegador y dispositivo</li>
          <li>Páginas visitadas y tiempo de permanencia</li>
          <li>Cookies y tecnologías similares</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Uso de la Información</h2>
        <p className="mb-4">Utilizamos su información para:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Proporcionar y mantener nuestros servicios</li>
          <li>Procesar transacciones y envíos</li>
          <li>Comunicarnos sobre su cuenta y pedidos</li>
          <li>Mejorar nuestra plataforma y servicios</li>
          <li>Prevenir fraudes y actividades ilegales</li>
          <li>Cumplir con obligaciones legales</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Compartir Información</h2>
        <p className="mb-4">Podemos compartir su información con:</p>
        
        <table className="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Destinatario</th>
              <th className="border border-gray-300 px-4 py-2">Propósito</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Vendedores</td>
              <td className="border border-gray-300 px-4 py-2">Para completar compras y envíos</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Stripe</td>
              <td className="border border-gray-300 px-4 py-2">Procesamiento de pagos</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Proveedores de envío</td>
              <td className="border border-gray-300 px-4 py-2">Entrega de productos</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Autoridades</td>
              <td className="border border-gray-300 px-4 py-2">Cuando sea requerido por ley</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Seguridad de los Datos</h2>
        <p className="mb-4">
          Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Encriptación SSL/TLS para todas las transmisiones</li>
          <li>Almacenamiento encriptado en Supabase</li>
          <li>Autenticación de dos factores disponible</li>
          <li>Acceso restringido a información personal</li>
          <li>Monitoreo continuo de seguridad</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Sus Derechos</h2>
        <p className="mb-4">De acuerdo con la Ley de Protección de Datos Personales de Argentina, usted tiene derecho a:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Acceso:</strong> Conocer qué datos personales tenemos sobre usted</li>
          <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
          <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
          <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
          <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
        </ul>

        <p className="mb-4">
          Para ejercer estos derechos, envíe un correo a: 
          <a href="mailto:privacidad@madsjeez.com.ar" className="text-blue-600 hover:underline">privacidad@madsjeez.com.ar</a>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Cookies</h2>
        <p className="mb-4">Utilizamos cookies para:</p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Esenciales:</strong> Funcionamiento básico del sitio</li>
          <li><strong>Preferencias:</strong> Recordar sus configuraciones</li>
          <li><strong>Analíticas:</strong> Mejorar nuestros servicios</li>
          <li><strong>Marketing:</strong> Personalizar publicidad (con su consentimiento)</li>
        </ul>

        <p className="mb-4">
          Puede gestionar sus preferencias de cookies en cualquier momento desde la configuración de su navegador.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Retención de Datos</h2>
        <p className="mb-4">
          Conservamos su información personal durante el tiempo necesario para cumplir con los fines 
          descritos en esta política, o según lo requiera la ley. Los datos de transacciones se conservan 
          por 10 años para cumplir con obligaciones fiscales.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Transferencias Internacionales</h2>
        <p className="mb-4">
          Algunos de nuestros proveedores (como Stripe y Cloudinary) pueden procesar datos fuera de Argentina. 
          Solo trabajamos con proveedores que garantizan un nivel adecuado de protección de datos.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">10. Cambios a esta Política</h2>
        <p className="mb-4">
          Podemos actualizar esta Política de Privacidad periódicamente. Los cambios significativos 
          serán notificados por correo electrónico o mediante un aviso destacado en nuestra plataforma.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">11. Contacto</h2>
        <p className="mb-4">
          Para preguntas sobre esta Política de Privacidad:<br />
          <strong>Responsable de Protección de Datos:</strong><br />
          Email: <a href="mailto:privacidad@madsjeez.com.ar" className="text-blue-600 hover:underline">privacidad@madsjeez.com.ar</a><br />
          Dirección: [Dirección física de la empresa]
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">12. Registro Nacional de Bases de Datos</h2>
        <p className="mb-4">
          Nuestra base de datos está inscripta en el Registro Nacional de Bases de Datos de la 
          Agencia de Acceso a la Información Pública conforme a la Ley 25.326.
        </p>
      </div>
    </div>
  )
}
