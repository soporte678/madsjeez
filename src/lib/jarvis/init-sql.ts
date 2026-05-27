/**
 * JARVIS SQL Initialization
 * Queries SQL para crear las tablas necesarias
 * Se ejecutan via Supabase MCP executeQuery
 * 
 * @module init-sql
 */

export const JARVIS_INIT_SQL = {
  // Tabla de configuracion
  createConfigTable: `
    CREATE TABLE IF NOT EXISTS jarvis_config (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      description TEXT,
      is_encrypted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_jarvis_config_key ON jarvis_config(key);
    CREATE INDEX IF NOT EXISTS idx_jarvis_config_category ON jarvis_config(category);
  `,

  // Tabla de memoria de conversaciones
  createMemoryTable: `
    CREATE TABLE IF NOT EXISTS jarvis_conversation_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
      content TEXT NOT NULL,
      tool_calls JSONB,
      tool_results JSONB,
      session_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_user ON jarvis_conversation_memory(user_id);
    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_session ON jarvis_conversation_memory(session_id);
    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_created ON jarvis_conversation_memory(created_at);
  `,

  // Tabla de logs de auditoria
  createAuditTable: `
    CREATE TABLE IF NOT EXISTS jarvis_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(50) NOT NULL,
      service VARCHAR(50),
      operation VARCHAR(100),
      target VARCHAR(200),
      status VARCHAR(20) NOT NULL,
      details JSONB,
      user_id VARCHAR(100),
      ip_address INET,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_created ON jarvis_audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_service ON jarvis_audit_log(service);
    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_status ON jarvis_audit_log(status);
  `,

  // Tabla de tareas autonomas
  createTasksTable: `
    CREATE TABLE IF NOT EXISTS jarvis_autonomous_tasks (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      interval_ms INTEGER NOT NULL DEFAULT 300000,
      is_enabled BOOLEAN NOT NULL DEFAULT true,
      last_run_at TIMESTAMPTZ,
      last_status VARCHAR(20),
      last_result JSONB,
      error_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_jarvis_tasks_enabled ON jarvis_autonomous_tasks(is_enabled);
  `,

  // Verificar si tabla existe
  checkTableExists: `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `,

  // Contar registros en tabla
  countRecords: `
    SELECT COUNT(*) as count FROM $1;
  `,
} as const;

/** Configuracion por defecto para insertar */
export const DEFAULT_CONFIG_ROWS = [
  // General
  { key: "JARVIS_ENABLED", value: "true", category: "general", description: "Master switch para activar JARVIS" },
  { key: "JARVIS_VERSION", value: "2.0.0", category: "general", description: "Version actual de JARVIS" },
  { key: "JARVIS_NAME", value: "JARVIS", category: "general", description: "Nombre del asistente" },
  { key: "JARVIS_LANGUAGE", value: "es-AR", category: "general", description: "Idioma por defecto" },
  { key: "JARVIS_PERSONALITY", value: "profesional-amigable", category: "general", description: "Estilo de personalidad" },
  
  // LLM
  { key: "LLM_PROVIDER", value: "ollama", category: "llm", description: "Proveedor de LLM: ollama, openai" },
  { key: "LLM_MODEL", value: "closer-ventas-14b", category: "llm", description: "Modelo de lenguaje" },
  { key: "LLM_TEMPERATURE", value: "0.7", category: "llm", description: "Temperatura del modelo" },
  { key: "LLM_MAX_TOKENS", value: "2048", category: "llm", description: "Maximo de tokens por respuesta" },
  { key: "LLM_TIMEOUT_MS", value: "30000", category: "llm", description: "Timeout del LLM en ms" },
  
  // Security
  { key: "RATE_LIMIT_REQUESTS", value: "30", category: "security", description: "Max requests por minuto" },
  { key: "RATE_LIMIT_WINDOW_MS", value: "60000", category: "security", description: "Ventana de rate limit" },
  
  // Autonomous
  { key: "AUTONOMOUS_ENABLED", value: "true", category: "autonomous", description: "Motor autonomo activo" },
  { key: "AUTONOMOUS_INTERVAL_MS", value: "300000", category: "autonomous", description: "Intervalo base: 5 minutos" },
  { key: "TASK_INVENTORY_SYNC", value: "true", category: "autonomous", description: "Sincronizacion de inventario" },
  { key: "TASK_PRICE_OPTIMIZER", value: "true", category: "autonomous", description: "Optimizador de precios" },
  { key: "TASK_AUTO_REPLY", value: "true", category: "autonomous", description: "Respuestas automaticas" },
  { key: "TASK_TRENDING", value: "true", category: "autonomous", description: "Deteccion de tendencias" },
  { key: "TASK_REVIEW_ANALYZER", value: "true", category: "autonomous", description: "Analisis de reviews" },
  { key: "TASK_STOCK_ALERT", value: "true", category: "autonomous", description: "Alertas de stock bajo" },
  { key: "TASK_COMPETITOR_MONITOR", value: "true", category: "autonomous", description: "Monitoreo de competencia" },
  { key: "TASK_REPORT_GENERATOR", value: "true", category: "autonomous", description: "Generador de reportes" },
  
  // MCP
  { key: "MCP_GITHUB_ENABLED", value: "true", category: "mcp", description: "MCP GitHub activo" },
  { key: "MCP_RAILWAY_ENABLED", value: "true", category: "mcp", description: "MCP Railway activo" },
  { key: "MCP_SUPABASE_ENABLED", value: "true", category: "mcp", description: "MCP Supabase activo" },
  
  // Voice
  { key: "VOICE_ENABLED", value: "true", category: "voice", description: "Comandos de voz activos" },
  { key: "VOICE_WAKE_WORD", value: "JARVIS", category: "voice", description: "Palabra de activacion" },
  { key: "VOICE_LANGUAGE", value: "es-AR", category: "voice", description: "Idioma de reconocimiento" },
  
  // Notifications
  { key: "NOTIFY_ON_ERROR", value: "true", category: "notifications", description: "Notificar errores" },
  { key: "NOTIFY_ON_TASK_COMPLETE", value: "true", category: "notifications", description: "Notificar tareas completadas" },
] as const;

/** Tareas autonomas por defecto */
export const DEFAULT_AUTONOMOUS_TASKS = [
  { id: "inventory-sync", name: "Sincronizacion de Inventario", description: "Sincroniza niveles de stock con provedores", interval_ms: 900000 },
  { id: "price-optimizer", name: "Optimizador de Precios", description: "Ajusta precios segun competencia y demanda", interval_ms: 3600000 },
  { id: "auto-reply", name: "Respuestas Automaticas", description: "Responde preguntas de clientes automaticamente", interval_ms: 300000 },
  { id: "trending", name: "Deteccion de Tendencias", description: "Analiza busquedas y ventas para detectar tendencias", interval_ms: 1800000 },
  { id: "review-analyzer", name: "Analisis de Reviews", description: "Analiza sentimiento de reviews y opiniones", interval_ms: 7200000 },
  { id: "stock-alert", name: "Alertas de Stock Bajo", description: "Notifica cuando productos tienen stock bajo", interval_ms: 600000 },
  { id: "competitor-monitor", name: "Monitoreo de Competencia", description: "Monitorea precios de competidores", interval_ms: 21600000 },
  { id: "report-generator", name: "Generador de Reportes", description: "Genera reportes diarios de ventas y metricas", interval_ms: 86400000 },
] as const;
