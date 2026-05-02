export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Términos y Condiciones - AppJeezPro</h1>
      <p className="text-gray-600 mb-4">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los términos</h2>
          <p>Al descargar, instalar o usar AppJeezPro, aceptas estos términos y condiciones. Si no estás de acuerdo, no uses la aplicación.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descripción del servicio</h2>
          <p>AppJeezPro es una aplicación que permite:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Gestión de inventario y productos</li>
            <li>Conexión con proveedores y clientes</li>
            <li>Procesamiento de pedidos</li>
            <li>Herramientas de análisis y reportes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Cuentas de usuario</h2>
          <p>Para usar AppJeezPro debes:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Tener al menos 18 años o autorización parental</li>
            <li>Proporcionar información veraz y actualizada</li>
            <li>Mantener la seguridad de tu contraseña</li>
            <li>Ser responsable de toda actividad en tu cuenta</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Conducta prohibida</h2>
          <p>No puedes usar AppJeezPro para:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Actividades ilegales o fraudulentas</li>
            <li>Distribuir malware o contenido dañino</li>
            <li>Acosar, discriminar o amenazar a otros usuarios</li>
            <li>Violar derechos de propiedad intelectual</li>
            <li>Interferir con el funcionamiento de la app</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Propiedad intelectual</h2>
          <p>AppJeezPro y su contenido son propiedad de MadsJeez. No puedes copiar, modificar, distribuir o crear trabajos derivados sin autorización expresa.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Limitación de responsabilidad</h2>
          <p>AppJeezPro se proporciona &quot;tal cual&quot; sin garantías de ningún tipo. No somos responsables por:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Pérdidas de datos o beneficios</li>
            <li>Interrupciones del servicio</li>
            <li>Daños indirectos o consecuentes</li>
            <li>Transacciones entre usuarios</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Modificaciones</h2>
          <p>Podemos modificar estos términos en cualquier momento. Los cambios entran en vigor al publicarse. El uso continuado de la app constituye aceptación de los nuevos términos.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Terminación</h2>
          <p>Podemos suspender o terminar tu cuenta si violas estos términos. Puedes eliminar tu cuenta en cualquier momento desde la configuración de la app.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Ley aplicable</h2>
          <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se resolverá en los tribunales de Buenos Aires.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
          <p>Para consultas sobre estos términos:</p>
          <p className="mt-2">📧 Email: legal@appjeezpro.com.ar</p>
          <p>📍 Dirección: Buenos Aires, Argentina</p>
        </section>
      </div>
    </div>
  )
}
