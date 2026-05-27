/**
 * =============================================================================
 * JARVIS TOOL DESCRIPTIONS FOR LLM
 * =============================================================================
 *
 * Descripciones detalladas de cada herramienta disponible para el LLM.
 * Estas descripciones se inyectan en el system prompt para que el modelo
 * sepa que herramientas tiene a disposicion, cuando usarlas, y que
 * parametros necesitan.
 *
 * Cada operacion incluye:
 *   - description: que hace la operacion
 *   - params: parametros requeridos y opcionales
 *   - whenToUse: guia para el LLM sobre cuando usarla
 *   - examples: ejemplos de uso tipicos
 *
 * @module lib/jarvis/prompts/tool-descriptions
 */

import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Esquema de parametro para una herramienta. */
interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

/** Descripcion de una operacion individual. */
interface OperationDescription {
  description: string;
  params: ToolParameter[];
  whenToUse: string;
  examples: string[];
  returns: string;
  isDestructive: boolean;
}

/** Descripcion de un servicio MCP completo. */
interface ServiceDescription {
  description: string;
  category: string;
  operations: Record<string, OperationDescription>;
}

/** Esquema de herramienta en formato OpenAI-compatible para el LLM. */
export interface ToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// ─── GitHub Operations ───────────────────────────────────────────────────────

const GITHUB_OPERATIONS: Record<string, OperationDescription> = {
  getRepositoryInfo: {
    description: "Obtiene informacion general de un repositorio GitHub: estrellas, forks, lenguaje principal, descripcion, fecha de ultima actualizacion, branch default, etc.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'. Ejemplo: 'madsjeez/marketplace'", required: true },
    ],
    whenToUse: "Cuando necesites conocer el estado general de un repositorio, verificar su existencia, o checkear metadata basica antes de otras operaciones.",
    examples: [
      "Usuario quiere saber info del repo principal",
      "Verificar si un repositorio existe antes de listar commits",
      "Checkear el lenguaje principal y actividad reciente de un repo",
    ],
    returns: "Objeto con metadata del repositorio (nombre, descripcion, estrellas, forks, lenguaje, fecha de ultima actualizacion, branch default).",
    isDestructive: false,
  },
  listCommits: {
    description: "Lista los commits de un repositorio, opcionalmente filtrados por branch. Devuelve SHA, mensaje, autor y fecha de cada commit.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "branch", type: "string", description: "Nombre de la branch. Si no se especifica, usa la branch default.", required: false },
      { name: "limit", type: "number", description: "Cantidad maxima de commits a retornar (1-100, default: 30)", required: false, defaultValue: 30 },
    ],
    whenToUse: "Para ver el historial de cambios, encontrar cuando se introdujo un bug, revisar que se deployo recientemente, o hacer code review.",
    examples: [
      "Revisar los ultimos commits del main",
      "Ver que cambios se hicieron en una branch de feature",
      "Encontrar un commit especifico por su mensaje",
    ],
    returns: "Array de commits con sha, message, author, date y url.",
    isDestructive: false,
  },
  getFileContent: {
    description: "Lee el contenido de un archivo especifico de un repositorio. Soporta archivos de texto y binarios (devuelve base64 decodeado).",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "path", type: "string", description: "Ruta del archivo dentro del repo. Ejemplo: 'src/lib/config.ts'", required: true },
      { name: "branch", type: "string", description: "Branch desde donde leer. Default: branch default del repo.", required: false },
    ],
    whenToUse: "Para leer codigo fuente, verificar configuraciones, revisar archivos de documentacion, o analizar la implementacion de una funcion.",
    examples: [
      "Leer el package.json para ver dependencias",
      "Ver el codigo de una funcion especifica",
      "Revisar un archivo de configuracion",
    ],
    returns: "String con el contenido del archivo.",
    isDestructive: false,
  },
  listDirectory: {
    description: "Lista el contenido de un directorio en un repositorio. Devuelve archivos, subdirectorios, symlinks y submodulos con sus metadatos.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "path", type: "string", description: "Ruta del directorio. Usar '/' para raiz. Default: '/'", required: false, defaultValue: "/" },
      { name: "branch", type: "string", description: "Branch a listar. Default: branch default.", required: false },
    ],
    whenToUse: "Para explorar la estructura de un proyecto, encontrar archivos especificos, o navegar el arbol de directorios de un repo.",
    examples: [
      "Ver la estructura de carpetas del proyecto",
      "Encontrar donde esta definido un componente",
      "Listar los archivos de configuracion",
    ],
    returns: "Array de entradas de directorio con name, type, path, sha y size.",
    isDestructive: false,
  },
  getIssues: {
    description: "Obtiene los issues de un repositorio, filtrables por estado (open/closed/all) y labels.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "state", type: "string", description: "Estado: 'open', 'closed', o 'all'. Default: 'open'", required: false, defaultValue: "open" },
      { name: "labels", type: "string[]", description: "Filtrar por labels especificos. Ejemplo: ['bug', 'critical']", required: false },
    ],
    whenToUse: "Para ver bugs reportados, feature requests, tareas pendientes, o hacer seguimiento de issues especificos.",
    examples: [
      "Ver los bugs abiertos del proyecto",
      "Buscar issues con label 'urgent'",
      "Contar cuantos issues abiertos hay",
    ],
    returns: "Array de issues con number, title, state, labels, author, createdAt y url.",
    isDestructive: false,
  },
  getPullRequests: {
    description: "Lista los pull requests de un repositorio, filtrables por estado (open/closed/all).",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "state", type: "string", description: "Estado: 'open', 'closed', o 'all'. Default: 'open'", required: false, defaultValue: "open" },
    ],
    whenToUse: "Para revisar PRs pendientes de merge, ver el estado de integraciones, o hacer code review.",
    examples: [
      "Ver los PRs abiertos que necesitan review",
      "Buscar un PR especifico por estado",
      "Contar cuantos PRs hay abiertos",
    ],
    returns: "Array de PRs con number, title, state, author, head, base, createdAt y url.",
    isDestructive: false,
  },
  getWorkflowRuns: {
    description: "Obtiene las ejecuciones recientes de GitHub Actions workflows, filtrables por workflow especifico.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "workflowId", type: "string", description: "ID o filename del workflow. Ejemplo: 'ci.yml'. Si no se especifica, devuelve todas las runs.", required: false },
    ],
    whenToUse: "Para verificar si los CI/CD pasaron, debuggear fallos de build, o monitorear el estado de los workflows.",
    examples: [
      "Checkear si el ultimo build paso",
      "Ver las ejecuciones del workflow de deploy",
      "Debuggear por que fallo un CI",
    ],
    returns: "Array de workflow runs con id, name, status, conclusion, branch, createdAt y url.",
    isDestructive: false,
  },
  getRepositoryBranches: {
    description: "Lista todas las branches de un repositorio.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
    ],
    whenToUse: "Para ver las branches disponibles, encontrar una branch de feature, o verificar que exista una branch antes de crear un PR.",
    examples: [
      "Listar todas las branches del proyecto",
      "Verificar si existe una branch especifica",
    ],
    returns: "Array de nombres de branches.",
    isDestructive: false,
  },
  createCommit: {
    description: "Crea o actualiza un archivo en un repositorio via commit. Si el archivo existe, lo actualiza. Si no existe, lo crea.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "path", type: "string", description: "Ruta del archivo a crear/actualizar", required: true },
      { name: "content", type: "string", description: "Contenido del archivo (texto plano)", required: true },
      { name: "message", type: "string", description: "Mensaje del commit", required: true },
      { name: "branch", type: "string", description: "Branch donde crear el commit", required: true },
    ],
    whenToUse: "Para crear o modificar archivos en el repo: fix rapidos, actualizar configs, agregar documentacion. REQUIERE CONFIRMACION del usuario.",
    examples: [
      "Crear un archivo de configuracion nuevo",
      "Actualizar el README con informacion nueva",
      "Hacer un fix rapido en un archivo",
    ],
    returns: "Objeto con datos del commit creado.",
    isDestructive: true,
  },
  createPullRequest: {
    description: "Crea un nuevo pull request para integrar cambios de una branch a otra.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "title", type: "string", description: "Titulo del PR", required: true },
      { name: "body", type: "string", description: "Descripcion del PR (soporta markdown)", required: true },
      { name: "head", type: "string", description: "Branch fuente (la que tiene los cambios)", required: true },
      { name: "base", type: "string", description: "Branch destino (usualmente 'main' o 'master')", required: true },
    ],
    whenToUse: "Para proponer cambios de codigo, nuevas features, fixes, o actualizaciones. Siempre crear un PR en lugar de commitear directamente a main. REQUIERE CONFIRMACION.",
    examples: [
      "Crear un PR para una nueva feature",
      "Proponer un fix via PR",
      "Integrar una branch de hotfix",
    ],
    returns: "Objeto con datos del PR creado (numero, url, estado).",
    isDestructive: true,
  },
  mergePullRequest: {
    description: "Mergea un pull request usando metodo squash. CIERRA el PR e integra los cambios.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "prNumber", type: "number", description: "Numero del PR a mergear", required: true },
    ],
    whenToUse: "Para integrar cambios aprobados a la branch principal. Solo mergear si el PR fue revisado y aprobado. REQUIERE CONFIRMACION EXPLICITA.",
    examples: [
      "Mergear un PR aprobado a main",
      "Integrar un hotfix despues de verificar que pasa CI",
    ],
    returns: "Objeto con resultado del merge (sha del commit, mensaje).",
    isDestructive: true,
  },
  createIssue: {
    description: "Crea un nuevo issue en el repositorio para reportar un bug, solicitar una feature, o documentar una tarea.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "title", type: "string", description: "Titulo del issue", required: true },
      { name: "body", type: "string", description: "Descripcion detallada", required: true },
      { name: "labels", type: "string[]", description: "Labels a aplicar. Ejemplo: ['bug', 'critical']", required: false },
    ],
    whenToUse: "Para reportar bugs encontrados, solicitar nuevas features, o crear tareas de seguimiento. REQUIERE CONFIRMACION.",
    examples: [
      "Reportar un bug encontrado en produccion",
      "Crear una tarea para implementar una feature",
    ],
    returns: "Objeto con datos del issue creado (numero, url).",
    isDestructive: true,
  },
  closeIssue: {
    description: "Cierra un issue existente.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "issueNumber", type: "number", description: "Numero del issue a cerrar", required: true },
    ],
    whenToUse: "Para cerrar issues resueltos, duplicados, o invalidos. REQUIERE CONFIRMACION.",
    examples: [
      "Cerrar un bug que ya fue fixeado",
      "Cerrar un issue duplicado",
    ],
    returns: "Objeto con datos del issue actualizado.",
    isDestructive: true,
  },
  triggerWorkflow: {
    description: "Dispara manualmente una ejecucion de un GitHub Actions workflow.",
    params: [
      { name: "repo", type: "string", description: "Repositorio en formato 'owner/name'", required: true },
      { name: "workflowId", type: "string", description: "ID o filename del workflow. Ejemplo: 'deploy.yml'", required: true },
      { name: "branch", type: "string", description: "Branch sobre la que ejecutar. Default: 'main'", required: false, defaultValue: "main" },
    ],
    whenToUse: "Para hacer deploy manual, re-ejecutar un CI que fallo, o disparar workflows de mantenimiento. REQUIERE CONFIRMACION.",
    examples: [
      "Disparar el workflow de deploy a produccion",
      "Re-ejecutar el CI de una branch",
    ],
    returns: "Objeto con confirmacion del disparo.",
    isDestructive: true,
  },
};

// ─── Railway Operations ──────────────────────────────────────────────────────

const RAILWAY_OPERATIONS: Record<string, OperationDescription> = {
  getProjects: {
    description: "Lista todos los proyectos de Railway accesibles con el token actual.",
    params: [],
    whenToUse: "Para ver todos los proyectos disponibles, encontrar el ID de un proyecto, o verificar que Railway esta configurado correctamente.",
    examples: [
      "Listar todos los proyectos de Railway",
      "Verificar que el token de Railway funciona",
    ],
    returns: "Array de proyectos con id, name, description, createdAt y updatedAt.",
    isDestructive: false,
  },
  getProject: {
    description: "Obtiene la informacion detallada de un proyecto especifico de Railway.",
    params: [
      { name: "projectId", type: "string", description: "ID del proyecto de Railway", required: true },
    ],
    whenToUse: "Para obtener detalles de un proyecto especifico, verificar su existencia, o antes de listar sus servicios.",
    examples: [
      "Ver detalles del proyecto de produccion",
      "Confirmar que un projectId es valido",
    ],
    returns: "Objeto con id, name, description, createdAt y updatedAt del proyecto.",
    isDestructive: false,
  },
  getServices: {
    description: "Lista todos los servicios (contenedores/aplicaciones) dentro de un proyecto de Railway.",
    params: [
      { name: "projectId", type: "string", description: "ID del proyecto de Railway", required: true },
    ],
    whenToUse: "Para ver los servicios desplegados en un proyecto, monitorear el estado de la infraestructura, o encontrar un serviceId.",
    examples: [
      "Ver los servicios del proyecto principal",
      "Encontrar el ID de un servicio especifico",
    ],
    returns: "Array de servicios con id, name, projectId, source y fechas.",
    isDestructive: false,
  },
  getService: {
    description: "Obtiene informacion detallada de un servicio especifico de Railway.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio de Railway", required: true },
    ],
    whenToUse: "Para ver detalles de un servicio especifico, verificar su configuracion, o diagnosticar problemas.",
    examples: [
      "Ver detalles del servicio de la API",
      "Checkear la configuracion de un servicio",
    ],
    returns: "Objeto con id, name, projectId, source y fechas del servicio.",
    isDestructive: false,
  },
  getDeployments: {
    description: "Lista el historial de deployments de un servicio, ordenado por fecha.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio de Railway", required: true },
    ],
    whenToUse: "Para ver el historial de deploys, encontrar un deployment especifico, o verificar que el ultimo deploy fue exitoso.",
    examples: [
      "Ver los ultimos deployments del servicio",
      "Checkear si el ultimo deploy fue exitoso",
      "Encontrar un deployment para hacer rollback",
    ],
    returns: "Array de deployments con id, serviceId, status, commitMessage, createdAt y updatedAt.",
    isDestructive: false,
  },
  getDeploymentLogs: {
    description: "Obtiene los logs de un deployment especifico. Util para debuggear errores.",
    params: [
      { name: "deploymentId", type: "string", description: "ID del deployment", required: true },
    ],
    whenToUse: "Para debuggear por que fallo un deploy, investigar errores en produccion, o auditar la ejecucion de un servicio.",
    examples: [
      "Ver los logs de un deploy que fallo",
      "Investigar un error en produccion",
      "Auditar la ejecucion de un servicio",
    ],
    returns: "Array de lineas de log con timestamp, severity y message.",
    isDestructive: false,
  },
  getEnvironmentVariables: {
    description: "Obtiene las variables de entorno de un servicio. Los valores sensibles se muestran truncados por seguridad.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio de Railway", required: true },
    ],
    whenToUse: "Para verificar que las variables de entorno estan configuradas correctamente, o diagnosticar problemas de configuracion. NUNCA muestres los valores completos de variables sensibles.",
    examples: [
      "Verificar que DATABASE_URL esta configurada",
      "Checkear las variables de entorno de un servicio",
    ],
    returns: "Record de clave-valor de variables de entorno.",
    isDestructive: false,
  },
  getServiceMetrics: {
    description: "Obtiene las metricas actuales de un servicio: CPU, memoria, disco, y red.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio de Railway", required: true },
    ],
    whenToUse: "Para monitorear el rendimiento de un servicio, detectar problemas de recursos, o verificar que todo funciona dentro de parametros normales.",
    examples: [
      "Ver el uso de CPU y memoria del servicio",
      "Monitorear el rendimiento de la API",
      "Detectar si un servicio necesita mas recursos",
    ],
    returns: "Objeto con serviceId, cpuPercent, memoryMb, diskMb, networkRxMb, networkTxMb y timestamp.",
    isDestructive: false,
  },
  deployService: {
    description: "Dispara un nuevo deployment de un servicio. Esto construye y despliega la ultima version del codigo.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio a deployar", required: true },
    ],
    whenToUse: "Para deployar cambios a produccion o staging. Solo deployar si el codigo fue revisado y los tests pasaron. REQUIERE CONFIRMACION.",
    examples: [
      "Deployar el servicio de la API a produccion",
      "Hacer un deploy de emergencia",
    ],
    returns: "Objeto con id y status del nuevo deployment.",
    isDestructive: true,
  },
  redeployService: {
    description: "Fuerza un redeploy de un servicio. Util si el deploy anterior fallo o si hay un problema que un redeploy puede resolver.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio a redeployar", required: true },
    ],
    whenToUse: "Para reintentar un deploy fallido, o cuando se necesita reiniciar el servicio. REQUIERE CONFIRMACION.",
    examples: [
      "Redeployar despues de un deploy fallido",
      "Reiniciar un servicio que se quedo colgado",
    ],
    returns: "Objeto con id y status del redeployment.",
    isDestructive: true,
  },
  setEnvironmentVariable: {
    description: "Crea o actualiza una variable de entorno de un servicio.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio", required: true },
      { name: "key", type: "string", description: "Nombre de la variable", required: true },
      { name: "value", type: "string", description: "Valor de la variable", required: true },
    ],
    whenToUse: "Para configurar variables de entorno nuevas, rotar credenciales, o actualizar configuraciones. REQUIERE CONFIRMACION y NUNCA muestres el valor en la respuesta.",
    examples: [
      "Configurar una nueva API key",
      "Actualizar la URL de un servicio externo",
    ],
    returns: "Objeto con name y value (truncado) de la variable.",
    isDestructive: true,
  },
  scaleService: {
    description: "Escala un servicio a un numero especifico de replicas. 0 replicas = servicio pausado.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio", required: true },
      { name: "replicas", type: "number", description: "Numero de replicas (0 para pausar)", required: true },
    ],
    whenToUse: "Para escalar horizontalmente ante aumento de trafico, o pausar un servicio para mantenimiento. REQUIERE CONFIRMACION.",
    examples: [
      "Escalar a 3 replicas por aumento de trafico",
      "Pausar un servicio temporalmente (0 replicas)",
      "Volver a 1 replica despues de un pico",
    ],
    returns: "Objeto con id del servicio actualizado.",
    isDestructive: true,
  },
  rollbackDeployment: {
    description: "Hace rollback de un servicio a un deployment anterior. Util si el deploy actual introdujo bugs.",
    params: [
      { name: "serviceId", type: "string", description: "ID del servicio", required: true },
      { name: "deploymentId", type: "string", description: "ID del deployment al que volver", required: true },
    ],
    whenToUse: "Para revertir un deploy problematico rapidamente. Solo hacer rollback si se confirmo que el deploy actual tiene problemas. REQUIERE CONFIRMACION EXPLICITA.",
    examples: [
      "Hacer rollback despues de un deploy con bugs",
      "Volver a la version estable anterior",
    ],
    returns: "Objeto con id y status del deployment de rollback.",
    isDestructive: true,
  },
};

// ─── Supabase Operations ─────────────────────────────────────────────────────

const SUPABASE_OPERATIONS: Record<string, OperationDescription> = {
  executeQuery: {
    description: "Ejecuta una query SQL de solo lectura (SELECT o EXPLAIN) contra la base de datos PostgreSQL. NO permite INSERT, UPDATE, DELETE, DROP, ni TRUNCATE.",
    params: [
      { name: "query", type: "string", description: "Query SQL (solo SELECT o EXPLAIN). Ejemplo: 'SELECT * FROM orders LIMIT 10'", required: true },
      { name: "params", type: "unknown[]", description: "Parametros de la query (para prepared statements).", required: false },
    ],
    whenToUse: "Para consultar datos del marketplace, generar reportes, analizar ventas, verificar stock, contar registros, o cualquier analisis de datos. Es la herramienta mas usada para queries de negocio.",
    examples: [
      "SELECT COUNT(*) FROM orders WHERE createdAt > NOW() - INTERVAL '7 days'",
      "SELECT title, stock FROM products WHERE stock < 5 ORDER BY stock ASC",
      "EXPLAIN ANALYZE SELECT * FROM orders WHERE buyerId = 'xxx'",
    ],
    returns: "Array de filas, cada una es un objeto con las columnas seleccionadas.",
    isDestructive: false,
  },
  listTables: {
    description: "Lista todas las tablas del schema public de la base de datos (excluye tablas del sistema).",
    params: [],
    whenToUse: "Para explorar la estructura de la base de datos, descubrir que tablas existen, o antes de hacer queries sobre tablas desconocidas.",
    examples: [
      "Ver todas las tablas de la base de datos",
      "Encontrar el nombre de una tabla especifica",
    ],
    returns: "Array de nombres de tablas.",
    isDestructive: false,
  },
  getTableSchema: {
    description: "Obtiene el esquema completo de una tabla: columnas, tipos de datos, constraints, primary keys, y foreign keys.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
    ],
    whenToUse: "Para entender la estructura de una tabla antes de hacer queries, verificar los tipos de datos, o diagnosticar problemas de schema.",
    examples: [
      "Ver el schema de la tabla orders",
      "Entender las columnas de products",
      "Verificar las foreign keys de order_items",
    ],
    returns: "Array de columnas con columnName, dataType, isNullable, columnDefault, isPrimaryKey y foreignKey.",
    isDestructive: false,
  },
  getTableStats: {
    description: "Obtiene estadisticas de una tabla: cantidad de filas, tamaño total, tamaño de indices, y fechas de ultimo vacuum/analyze.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
    ],
    whenToUse: "Para analizar el rendimiento de una tabla, verificar su tamaño, o decidir si necesita mantenimiento (vacuum/analyze).",
    examples: [
      "Ver cuantas filas tiene la tabla orders",
      "Checkear el tamaño de product_views",
      "Ver si una tabla necesita vacuum",
    ],
    returns: "Objeto con tableName, rowCount, totalSize, indexSize, toastSize, lastVacuum y lastAnalyze.",
    isDestructive: false,
  },
  getSlowQueries: {
    description: "Obtiene las 20 queries mas lentas segun pg_stat_statements, ordenadas por tiempo promedio de ejecucion.",
    params: [],
    whenToUse: "Para identificar queries lentas que necesitan optimizacion, diagnosticar problemas de rendimiento de la base de datos, o monitorear la salud del PostgreSQL.",
    examples: [
      "Ver las queries mas lentas de la base de datos",
      "Identificar que queries necesitan indices",
    ],
    returns: "Array de queries con query, meanTimeMs, calls y rows.",
    isDestructive: false,
  },
  getActiveConnections: {
    description: "Cuenta la cantidad de conexiones activas a la base de datos en este momento.",
    params: [],
    whenToUse: "Para monitorear la carga de la base de datos, detectar posibles problemas de conexion, o verificar que no se esta acercando al limite de conexiones.",
    examples: [
      "Ver cuantas conexiones activas hay",
      "Monitorear la carga de la base de datos",
    ],
    returns: "Numero de conexiones activas.",
    isDestructive: false,
  },
  getDatabaseSize: {
    description: "Obtiene el tamaño total de la base de datos en formato legible.",
    params: [],
    whenToUse: "Para monitorear el crecimiento de la base de datos, planificar capacidad, o verificar que no se exceden limites de almacenamiento.",
    examples: [
      "Ver el tamaño total de la base de datos",
      "Monitorear el crecimiento del storage",
    ],
    returns: "String con el tamaño (ejemplo: '1.2 GB').",
    isDestructive: false,
  },
  getRowCount: {
    description: "Cuenta las filas de una tabla especifica.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
    ],
    whenToUse: "Para obtener el conteo exacto de registros de una tabla, verificar si tiene datos, o comparar cantidades.",
    examples: [
      "Contar cuantos usuarios hay",
      "Ver cuantas ordenes existen",
    ],
    returns: "Numero de filas.",
    isDestructive: false,
  },
  listUsers: {
    description: "Lista los usuarios de Supabase Auth con paginacion. Devuelve info basica sin exponer datos sensibles.",
    params: [
      { name: "limit", type: "number", description: "Cantidad maxima de usuarios (1-100). Default: 50", required: false, defaultValue: 50 },
    ],
    whenToUse: "Para auditar usuarios registrados, verificar la existencia de un usuario, o analizar el crecimiento de usuarios. NUNCA expongas emails completos ni datos personales.",
    examples: [
      "Ver los ultimos usuarios registrados",
      "Contar cuantos usuarios hay en el sistema",
    ],
    returns: "Array de usuarios con id, email (truncado), createdAt, lastSignInAt, confirmedAt y role.",
    isDestructive: false,
  },
  getUserById: {
    description: "Obtiene la informacion de un usuario especifico por su UUID.",
    params: [
      { name: "userId", type: "string", description: "UUID del usuario de Supabase Auth", required: true },
    ],
    whenToUse: "Para verificar los detalles de un usuario especifico, diagnosticar problemas de autenticacion, o auditar una cuenta. NUNCA expongas datos personales completos.",
    examples: [
      "Ver los detalles de un usuario especifico",
      "Diagnosticar un problema de login",
    ],
    returns: "Objeto con id, email (truncado), createdAt, lastSignInAt, confirmedAt y role.",
    isDestructive: false,
  },
  listBuckets: {
    description: "Lista todos los buckets de Supabase Storage.",
    params: [],
    whenToUse: "Para ver los buckets disponibles, encontrar donde se almacenan archivos, o verificar la configuracion de storage.",
    examples: [
      "Ver los buckets de storage disponibles",
    ],
    returns: "Array de buckets con id, name, public, createdAt, updatedAt, fileCount y size.",
    isDestructive: false,
  },
  listFiles: {
    description: "Lista los archivos dentro de un bucket de Supabase Storage, opcionalmente filtrados por path.",
    params: [
      { name: "bucket", type: "string", description: "Nombre del bucket", required: true },
      { name: "path", type: "string", description: "Carpeta dentro del bucket. Default: raiz", required: false },
    ],
    whenToUse: "Para ver los archivos almacenados, encontrar un archivo especifico, o auditar el contenido de un bucket.",
    examples: [
      "Ver los archivos del bucket de imagenes",
      "Listar las fotos de productos",
    ],
    returns: "Array de paths de archivos.",
    isDestructive: false,
  },
  createTable: {
    description: "Crea una nueva tabla en la base de datos con las columnas especificadas.",
    params: [
      { name: "name", type: "string", description: "Nombre de la nueva tabla", required: true },
      { name: "columns", type: "ColumnDef[]", description: "Definicion de columnas: name, type, nullable, default, primary, unique, references", required: true },
    ],
    whenToUse: "Para crear tablas nuevas como parte de una migracion o feature nueva. REQUIERE CONFIRMACION EXPLICITA y debe pasar por review.",
    examples: [
      "Crear una tabla para un nuevo modulo",
    ],
    returns: "Confirmacion de creacion.",
    isDestructive: true,
  },
  alterTable: {
    description: "Modifica la estructura de una tabla existente: agregar/eliminar/renombrar columnas, cambiar tipos, modificar defaults.",
    params: [
      { name: "name", type: "string", description: "Nombre de la tabla a modificar", required: true },
      { name: "changes", type: "AlterChange[]", description: "Array de cambios a aplicar", required: true },
    ],
    whenToUse: "Para migraciones de schema que no pueden hacerse via SQL directo. REQUIERE CONFIRMACION EXPLICITA y backup previo.",
    examples: [
      "Agregar una columna nueva a una tabla",
      "Renombrar una columna existente",
    ],
    returns: "Confirmacion de modificacion.",
    isDestructive: true,
  },
  createIndex: {
    description: "Crea un indice en una columna de una tabla para mejorar el rendimiento de queries.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
      { name: "columnName", type: "string", description: "Columna a indexar", required: true },
      { name: "indexName", type: "string", description: "Nombre opcional del indice. Default: idx_tabla_columna", required: false },
    ],
    whenToUse: "Para optimizar queries lentas identificadas en getSlowQueries, o cuando se sabe que una columna se usa frecuentemente en WHERE clauses. REQUIERE CONFIRMACION.",
    examples: [
      "Crear un indice en la columna createdAt de orders",
      "Optimizar busquedas por buyerId",
    ],
    returns: "Confirmacion de creacion del indice.",
    isDestructive: true,
  },
  vacuumTable: {
    description: "Ejecuta VACUUM ANALYZE en una tabla para reclamar espacio y actualizar estadisticas del query planner.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
    ],
    whenToUse: "Para mantenimiento periodico de tablas grandes despues de muchos deletes/updates, o cuando las queries se vuelven lentas por estadisticas desactualizadas.",
    examples: [
      "Hacer vacuum de la tabla orders despues de una limpieza",
      "Mantenimiento de product_views",
    ],
    returns: "Confirmacion de vacuum completado.",
    isDestructive: false,
  },
  analyzeTable: {
    description: "Ejecuta ANALYZE en una tabla para actualizar las estadisticas del query planner.",
    params: [
      { name: "tableName", type: "string", description: "Nombre de la tabla", required: true },
    ],
    whenToUse: "Para actualizar estadisticas despues de cambios masivos de datos (bulk inserts/updates), o cuando el query planner elige planes suboptimos.",
    examples: [
      "Actualizar estadisticas de products despues de una carga masiva",
    ],
    returns: "Confirmacion de analyze completado.",
    isDestructive: false,
  },
  deleteUser: {
    description: "Elimina permanentemente un usuario de Supabase Auth. ESTA ACCION NO SE PUEDE DESHACER.",
    params: [
      { name: "userId", type: "string", description: "UUID del usuario a eliminar", required: true },
    ],
    whenToUse: "Solo cuando un usuario solicita explicitamente la eliminacion de su cuenta, o por orden administrativa con documentacion. REQUIERE DOBLE CONFIRMACION.",
    examples: [
      "Eliminar una cuenta de usuario a pedido de ellos",
    ],
    returns: "Confirmacion de eliminacion.",
    isDestructive: true,
  },
};

// ─── Autonomous Task Operations ──────────────────────────────────────────────

const AUTONOMOUS_TASK_OPERATIONS: Record<string, OperationDescription> = {
  runInventoryCheck: {
    description: "Ejecuta la tarea de control de inventario: detecta productos con stock bajo o agotado y genera notificaciones.",
    params: [],
    whenToUse: "Cuando el usuario pide revisar el stock, encontrar productos agotados, o verificar productos con stock critico.",
    examples: [
      "Revisar productos con stock bajo",
      "Ver que productos se agotaron",
      "Checkear el inventario",
    ],
    returns: "Reporte con productos de stock bajo y agotados.",
    isDestructive: false,
  },
  runPriceOptimization: {
    description: "Ejecuta la tarea de optimizacion de precios: analiza productos sin ventas recientes y sugiere ajustes de precio.",
    params: [],
    whenToUse: "Cuando el usuario pide analizar precios, encontrar productos estancados, o sugerir ajustes de precio.",
    examples: [
      "Analizar precios de productos sin ventas",
      "Sugerir ajustes de precio",
    ],
    returns: "Lista de sugerencias de precio que requieren aprobacion humana.",
    isDestructive: false,
  },
  runTrendingDetection: {
    description: "Ejecuta la tarea de deteccion de tendencias: identifica productos con aumento significativo de vistas.",
    params: [],
    whenToUse: "Para descubrir que productos estan trending, identificar oportunidades de marketing, o analizar comportamiento de usuarios.",
    examples: [
      "Que productos estan en tendencia",
      "Ver que esta buscando la gente",
    ],
    returns: "Lista de productos trending con metricas de crecimiento.",
    isDestructive: false,
  },
  runAutoReply: {
    description: "Ejecuta la tarea de respuestas automaticas: responde preguntas pendientes de compradores usando templates.",
    params: [],
    whenToUse: "Para procesar preguntas pendientes de compradores automaticamente.",
    examples: [
      "Responder preguntas pendientes",
      "Procesar consultas de compradores",
    ],
    returns: "Reporte de preguntas respondidas.",
    isDestructive: false,
  },
  runShippingMonitor: {
    description: "Ejecuta la tarea de monitoreo de envios: detecta envios retrasados y notifica.",
    params: [],
    whenToUse: "Para verificar el estado de envios, detectar retrasos, o hacer seguimiento de entregas.",
    examples: [
      "Verificar envios retrasados",
      "Checkear estado de entregas",
    ],
    returns: "Reporte de envios retrasados con notificaciones generadas.",
    isDestructive: false,
  },
  runDemandPrediction: {
    description: "Ejecuta la tarea de prediccion de demanda: predice demanda futura basada en historial de ventas.",
    params: [],
    whenToUse: "Para planificar inventario, anticipar picos de demanda, o prepararse para temporadas altas.",
    examples: [
      "Predecir la demanda de la proxima semana",
      "Ver que productos se van a vender mas",
    ],
    returns: "Predicciones de demanda por producto y dia.",
    isDestructive: false,
  },
  runCompetitorMonitor: {
    description: "Ejecuta la tarea de monitoreo de competencia: analiza precios y estrategias en MercadoLibre.",
    params: [],
    whenToUse: "Para analizar la competencia, comparar precios, o identificar oportunidades de diferenciacion.",
    examples: [
      "Ver que hace la competencia",
      "Analizar precios de competidores",
    ],
    returns: "Reporte de competencia con datos de ML.",
    isDestructive: false,
  },
  runMarketingTrigger: {
    description: "Ejecuta la tarea de disparadores de marketing: propone campañas basadas en comportamiento de usuarios.",
    params: [],
    whenToUse: "Para generar propuestas de campañas de retargeting y marketing.",
    examples: [
      "Generar propuestas de marketing",
      "Ver oportunidades de retargeting",
    ],
    returns: "Propuestas de campañas que requieren aprobacion humana.",
    isDestructive: false,
  },
};

// ─── Master Registry ─────────────────────────────────────────────────────────

/**
 * Registro maestro de todas las descripciones de herramientas.
 * Organizado por servicio/categoria.
 */
export const TOOL_DESCRIPTIONS = {
  mcp_github: {
    description: "Operaciones de GitHub para gestionar repositorios de codigo fuente. Incluye lectura de commits, archivos, issues, PRs, y operaciones de escritura como commits, PRs, merges, issues, y workflows.",
    category: "Infraestructura / Codigo",
    operations: GITHUB_OPERATIONS,
  },
  mcp_railway: {
    description: "Operaciones de Railway para gestionar la infraestructura cloud: proyectos, servicios, deployments, logs, metricas, y operaciones de escalado, deploy, rollback.",
    category: "Infraestructura / Cloud",
    operations: RAILWAY_OPERATIONS,
  },
  mcp_supabase: {
    description: "Operaciones de Supabase para la base de datos PostgreSQL, autenticacion, y storage. Incluye queries SQL, gestion de tablas, indices, usuarios auth, y buckets.",
    category: "Base de Datos / Storage",
    operations: SUPABASE_OPERATIONS,
  },
  autonomous_task: {
    description: "Tareas autonomas programadas del motor de JARVIS. Se ejecutan manualmente bajo demanda para analisis y monitoreo del marketplace.",
    category: "Automatizacion / Negocio",
    operations: AUTONOMOUS_TASK_OPERATIONS,
  },
} as const;

// ─── Zod Schemas for Validation ──────────────────────────────────────────────

/** Schema para validar parametros de operaciones MCP. */
export const GitHubParamsSchema = z.object({
  repo: z.string().regex(/^[\w-]+\/[\w-]+$/, "Formato requerido: 'owner/name'"),
  branch: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  path: z.string().optional(),
  state: z.enum(["open", "closed", "all"]).optional(),
  labels: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
  content: z.string().optional(),
  message: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  head: z.string().optional(),
  base: z.string().optional(),
  prNumber: z.number().optional(),
  issueNumber: z.number().optional(),
});

/** Schema para validar parametros de operaciones Railway. */
export const RailwayParamsSchema = z.object({
  projectId: z.string().optional(),
  serviceId: z.string().optional(),
  deploymentId: z.string().optional(),
  key: z.string().optional(),
  value: z.string().optional(),
  replicas: z.number().min(0).optional(),
});

/** Schema para validar parametros de operaciones Supabase. */
export const SupabaseParamsSchema = z.object({
  query: z.string().optional(),
  params: z.array(z.unknown()).optional(),
  tableName: z.string().optional(),
  name: z.string().optional(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean().optional(),
    default: z.string().optional(),
    primary: z.boolean().optional(),
    unique: z.boolean().optional(),
    references: z.object({
      table: z.string(),
      column: z.string(),
    }).optional(),
  })).optional(),
  changes: z.array(z.unknown()).optional(),
  columnName: z.string().optional(),
  indexName: z.string().optional(),
  userId: z.string().uuid().optional(),
  limit: z.number().optional(),
  bucket: z.string().optional(),
  path: z.string().optional(),
});

// ─── LLM Tool Schema Generation ──────────────────────────────────────────────

/**
 * Genera el formato de herramientas compatible con OpenAI function calling
 * a partir del registro de operaciones.
 *
 * Este formato es el que entienden los LLMs modernos (GPT-4, Claude, Gemini)
 * para decidir cuando llamar a una herramienta.
 *
 * @returns Array de ToolSchema con todas las herramientas disponibles
 *
 * @example
 * ```typescript
 * const tools = getToolsForLLM();
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages,
 *   tools,
 * });
 * ```
 */
export function getToolsForLLM(): ToolSchema[] {
  const tools: ToolSchema[] = [];

  // GitHub tools
  for (const [opName, op] of Object.entries(GITHUB_OPERATIONS)) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of op.params) {
      properties[param.name] = {
        type: param.type === "number" ? "number" : param.type === "string[]" ? "array" : "string",
        description: param.description,
        ...(param.type === "string[]" ? { items: { type: "string" } } : {}),
      };
      if (param.required) {
        required.push(param.name);
      }
    }

    tools.push({
      type: "function",
      function: {
        name: `github_${opName}`,
        description: `${op.description}. DESTRUCTIVA: ${op.isDestructive ? "SI - Requiere confirmacion" : "NO"}. USAR CUANDO: ${op.whenToUse}`,
        parameters: {
          type: "object",
          properties,
          required,
        },
      },
    });
  }

  // Railway tools
  for (const [opName, op] of Object.entries(RAILWAY_OPERATIONS)) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of op.params) {
      properties[param.name] = {
        type: param.type === "number" ? "number" : "string",
        description: param.description,
      };
      if (param.required) {
        required.push(param.name);
      }
    }

    tools.push({
      type: "function",
      function: {
        name: `railway_${opName}`,
        description: `${op.description}. DESTRUCTIVA: ${op.isDestructive ? "SI - Requiere confirmacion" : "NO"}. USAR CUANDO: ${op.whenToUse}`,
        parameters: {
          type: "object",
          properties,
          required,
        },
      },
    });
  }

  // Supabase tools
  for (const [opName, op] of Object.entries(SUPABASE_OPERATIONS)) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of op.params) {
      const isComplex = param.type.includes("[]") || param.type === "unknown[]";
      properties[param.name] = {
        type: isComplex ? "array" : param.type === "number" ? "number" : "string",
        description: param.description,
        ...(isComplex ? { items: { type: "object" } } : {}),
      };
      if (param.required) {
        required.push(param.name);
      }
    }

    tools.push({
      type: "function",
      function: {
        name: `supabase_${opName}`,
        description: `${op.description}. DESTRUCTIVA: ${op.isDestructive ? "SI - Requiere confirmacion" : "NO"}. USAR CUANDO: ${op.whenToUse}`,
        parameters: {
          type: "object",
          properties,
          required,
        },
      },
    });
  }

  return tools;
}

/**
 * Obtiene la descripcion de una operacion especifica.
 *
 * @param service - Nombre del servicio (github, railway, supabase)
 * @param operation - Nombre de la operacion
 * @returns La descripcion de la operacion o undefined si no existe
 */
export function getOperationDescription(
  service: string,
  operation: string
): OperationDescription | undefined {
  const serviceKey = `mcp_${service}` as keyof typeof TOOL_DESCRIPTIONS;
  const serviceDesc = TOOL_DESCRIPTIONS[serviceKey];
  if (!serviceDesc) return undefined;
  return serviceDesc.operations[operation];
}

/**
 * Verifica si una operacion es destructiva (requiere confirmacion).
 *
 * @param service - Nombre del servicio
 * @param operation - Nombre de la operacion
 * @returns true si la operacion es destructiva
 */
export function isOperationDestructive(service: string, operation: string): boolean {
  const desc = getOperationDescription(service, operation);
  return desc?.isDestructive ?? false;
}

/**
 * Obtiene las operaciones disponibles para un servicio.
 *
 * @param service - Nombre del servicio (github, railway, supabase)
 * @returns Lista de nombres de operaciones o array vacio
 */
export function getServiceOperations(service: string): string[] {
  const serviceKey = `mcp_${service}` as keyof typeof TOOL_DESCRIPTIONS;
  const serviceDesc = TOOL_DESCRIPTIONS[serviceKey];
  if (!serviceDesc) return [];
  return Object.keys(serviceDesc.operations);
}
