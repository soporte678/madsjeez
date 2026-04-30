export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad - AppJeezPro</h1>
      <p className="text-gray-600 mb-4">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Información que recopilamos</h2>
          <p>AppJeezPro recopila la siguiente información para proporcionar sus servicios:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Información de perfil: nombre, email, foto de perfil</li>
            <li>Datos de uso: interacciones dentro de la aplicación</li>
            <li>Información del dispositivo: modelo, sistema operativo</li>
            <li>Datos de ubicación (solo con permiso explícito)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tu información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Proporcionar y mejorar nuestros servicios</li>
            <li>Personalizar tu experiencia</li>
            <li>Enviar notificaciones importantes</li>
            <li>Prevenir fraudes y abusos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Compartir información</h2>
          <p>No vendemos tu información personal a terceros. Solo compartimos datos con:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Proveedores de servicios (hosting, análisis)</li>
            <li>Cuando es requerido por ley</li>
            <li>Con tu consentimiento explícito</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Acceder a tu información personal</li>
            <li>Solicitar corrección de datos incorrectos</li>
            <li>Solicitar eliminación de tu cuenta y datos</li>
            <li>Oponerte al procesamiento de tus datos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Seguridad</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado, alteración o destrucción.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Cambios a esta política</h2>
          <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la aplicación o email.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contacto</h2>
          <p>Para consultas sobre privacidad o ejercer tus derechos, contáctanos en:</p>
          <p className="mt-2">📧 Email: soporte@appjeezpro.com.ar</p>
        </section>
      </div>
    </div>
  )
}
