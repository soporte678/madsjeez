# Prompt: Auditoría QA del Sistema Flash

```text
Actuá como Senior QA Engineer, Tech Lead y Auditor de Código.

Necesito que analices todo el proyecto del sistema de logística "Flash" y detectes errores, bugs, problemas de lógica, fallas de seguridad, inconsistencias de datos y oportunidades de mejora.

Contexto del sistema:
Flash es una logística rápida tipo MercadoLibre Flex. Permite que el cliente elija "Envío Flash" en el checkout, genera etiquetas con QR, conecta al chofer con Google Maps, permite confirmar entregas, sacar hasta 5 fotos, registrar quién recibe el paquete y manejar hasta 3 visitas antes de devolver al remitente.

Quiero que revises especialmente:

1. Flujo de compra y checkout
- Que Envío Flash pueda seleccionarse correctamente.
- Que todos los datos obligatorios se validen antes de comprar.
- Que no se pueda avanzar con datos incompletos.
- Que WhatsApp, DNI, dirección, localidad, provincia y código postal se validen correctamente.

2. Generación de etiqueta y QR
- Que la etiqueta tenga todos los datos necesarios.
- Que el QR sea único.
- Que el QR apunte al pedido correcto.
- Que no exponga datos sensibles innecesarios.
- Que no pueda ser manipulado fácilmente.

3. Panel del chofer
- Que el chofer pueda escanear QR.
- Que pueda abrir Google Maps correctamente.
- Que pueda confirmar llegada.
- Que se respete la espera mínima de 10 minutos.
- Que pueda confirmar entrega.
- Que pueda cargar hasta 5 fotos, no más.
- Que no pueda confirmar entrega sin completar datos obligatorios.

4. Confirmación de entrega
Validar que funcionen correctamente estas opciones:
- Titular del pedido
- Otro titular autorizado
- Familiar
- Vecino
- Cliente no se encuentra en domicilio

Revisar que familiar y vecino pidan nombre completo y DNI.
Revisar que "cliente no se encuentra" solo se pueda usar después de 10 minutos.

5. Reglas de visitas
- Máximo 3 visitas.
- Registrar fecha, hora, ubicación GPS, chofer y estado.
- Después de 3 visitas fallidas, cambiar automáticamente a "Devuelto al remitente".
- Evitar visitas duplicadas o estados imposibles.

6. Estados del pedido
Detectar estados inconsistentes, saltos inválidos o problemas de transición, por ejemplo:
- Entregado → En camino
- Devuelto al remitente → Entregado
- Cliente no encontrado sin visita registrada
- Entrega confirmada sin receptor válido

7. Seguridad
Revisar:
- Autenticación y permisos.
- Que un chofer no pueda ver pedidos que no tiene asignados.
- Que un cliente no pueda modificar datos después de generar la etiqueta sin control.
- Protección de DNI, teléfono y dirección.
- Validación del QR en backend.
- Prevención de manipulación de estados.
- Validación de archivos/fotos.
- Riesgos de inyección, XSS, CSRF o exposición de datos.

8. Base de datos
Revisar:
- Relaciones entre tablas.
- Campos obligatorios.
- Índices necesarios.
- Integridad referencial.
- Estados duplicados.
- Pedidos huérfanos.
- Entregas sin pedido.
- Fotos sin intento de entrega.
- Choferes sin permisos correctos.

9. API / Backend
Analizar endpoints y detectar:
- Falta de validaciones.
- Errores de permisos.
- Respuestas inconsistentes.
- Falta de manejo de errores.
- Estados HTTP incorrectos.
- Falta de logs.
- Problemas de concurrencia.
- Posibles race conditions.

10. Frontend / UX
Revisar:
- Formularios incompletos.
- Validaciones solo del lado cliente.
- Mensajes de error poco claros.
- Flujos confusos para choferes.
- Botones que permitan acciones inválidas.
- Problemas responsive en móvil.

Quiero que entregues el análisis en este formato:

## Resumen general
Estado del proyecto y nivel de riesgo.

## Bugs críticos
Errores que impiden operar o comprometen seguridad.

## Bugs importantes
Errores que afectan el flujo principal.

## Bugs menores
Problemas visuales, UX o detalles de bajo impacto.

## Problemas de seguridad
Listado separado con severidad y recomendación.

## Problemas de lógica de negocio
Reglas que no se cumplen o están mal implementadas.

## Problemas de base de datos
Campos, relaciones, índices o integridad.

## Problemas de API
Endpoints con fallas o inconsistencias.

## Problemas de frontend
Errores de validación, navegación o experiencia.

## Recomendaciones técnicas
Qué conviene corregir primero.

## Checklist de corrección
Lista accionable de tareas ordenadas por prioridad.

Para cada bug encontrado, usá este formato:

- ID:
- Severidad: Crítico / Alto / Medio / Bajo
- Archivo o módulo:
- Descripción:
- Pasos para reproducir:
- Resultado actual:
- Resultado esperado:
- Causa probable:
- Solución recomendada:
- Impacto si no se corrige:

No hagas cambios todavía. Primero analizá y reportá todos los errores, bugs y riesgos encontrados.
```
