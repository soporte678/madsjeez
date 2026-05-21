# Listo para producción — requisitos de documentación

Cualquier **funcionalidad o endpoint** que se considere **lista para producción** debe cumplir, como mínimo, lo siguiente. Así se mantiene alineado el portal de referencia (`/docs/api`) con el comportamiento real del código.

## Checklist obligatorio

1. **Índice maestro**  
   Añadir o actualizar la fila en [índice maestro](./indice-maestro.md) con método(es) HTTP y ruta exacta bajo `/api/...`.

2. **Recurso temático**  
   Documentar el contrato en el archivo bajo `docs/api/recursos/` que corresponda al dominio (o crear uno nuevo si abre un dominio claro). Debe incluir, cuando aplique:
   - método, ruta, descripción breve, tipo de autenticación;
   - cuerpo JSON de entrada (campos obligatorios/opcionales);
   - respuestas de éxito y códigos de error relevantes;
   - dependencias externas (terceros, colas, Supabase).

3. **Variables de entorno**  
   Toda variable nueva debe aparecer en **`.env.example`** con comentario de propósito, valores de ejemplo seguros y enlace a documentación oficial del proveedor si existe.

4. **Errores**  
   Si el handler introduce códigos propios (`code` en JSON) o patrones HTTP nuevos, añadir una nota en [Errores y códigos HTTP](./errores.md) o en el recurso enlazado.

5. **README del árbol API**  
   Si el recurso es nuevo, enlazarlo desde la tabla de [README](./README.md) de `docs/api/`.

6. **Checklist de deploy** (si afecta operación en hosting)  
   Añadir variables o pasos de verificación en [DEPLOY_CHECKLIST.md](../DEPLOY_CHECKLIST.md) cuando el deploy sin esos pasos falle o deje la feature inoperativa.

## Alcance

- **Sí aplica** a rutas públicas o con sesión, jobs disparados por la app, e integraciones facturables o visibles al usuario (checkout, pagos, envíos, etc.).
- **Puede documentarse de forma mínima** a endpoints internos o de solo desarrollo, pero igual deben figurar en el índice maestro si están en `src/app/api/**/route.ts` y se exponen en algún entorno.

## Referencia: integración Zipnova

Ejemplo de recurso que cumple este paquete: [Zipnova Envíos](./recursos/zipnova-envios.md).
