"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Brain,
  Github,
  TrainFront,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Play,
  Square,
  RotateCw,
  Activity,
  Terminal,
  Clock,
  Shield,
  ChevronRight,
  Loader2,
  Server,
  Eye,
  Pencil,
  ScrollText,
  Bot,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/* ================================================================ */
/*  TIPOS                                                           */
/* ================================================================ */

type ServiceName = "github" | "railway" | "supabase";
type OperationType = "read" | "write";
type TaskStatus = "completed" | "running" | "failed" | "pending";

interface HealthStatus {
  github: boolean;
  railway: boolean;
  supabase: boolean;
}

interface OperationsMap {
  github: { read: string[]; write: string[] };
  railway: { read: string[]; write: string[] };
  supabase: { read: string[]; write: string[] };
}

interface AuditLog {
  timestamp: string;
  service: ServiceName;
  operation: string;
  type: OperationType;
  status: "success" | "failure";
  executionTimeMs: number;
}

interface GovernanceRule {
  id: string;
  description: string;
}

interface AutonomousTask {
  id: string;
  name: string;
  interval: string;
  lastRun: string;
  status: TaskStatus;
}

interface MCPInfo {
  enabled: boolean;
  services: Record<
    ServiceName,
    { healthy: boolean; configured: boolean; operationsCount: number }
  >;
}

/* ================================================================ */
/*  DATOS MOCK                                                      */
/* ================================================================ */

const mockHealth: HealthStatus = {
  github: true,
  railway: false,
  supabase: true,
};

const mockOperations: OperationsMap = {
  github: {
    read: [
      "getRepositoryInfo",
      "listCommits",
      "getFileContent",
      "listDirectory",
      "getIssues",
      "getPullRequests",
      "getWorkflowRuns",
      "getRepositoryBranches",
    ],
    write: [
      "createCommit",
      "createPullRequest",
      "mergePullRequest",
      "createIssue",
      "closeIssue",
      "triggerWorkflow",
    ],
  },
  railway: {
    read: [
      "getProjects",
      "getProject",
      "getServices",
      "getDeployments",
      "getDeploymentLogs",
      "getEnvironmentVariables",
      "getServiceMetrics",
      "getService",
    ],
    write: [
      "deployService",
      "redeployService",
      "setEnvironmentVariable",
      "scaleService",
      "rollbackDeployment",
    ],
  },
  supabase: {
    read: [
      "executeQuery",
      "listTables",
      "getTableSchema",
      "getTableStats",
      "getSlowQueries",
      "getActiveConnections",
      "getDatabaseSize",
      "getRowCount",
      "listUsers",
      "getUserById",
      "listBuckets",
      "listFiles",
    ],
    write: [
      "createTable",
      "alterTable",
      "createIndex",
      "vacuumTable",
      "analyzeTable",
      "deleteUser",
    ],
  },
};

const mockRecentLogs: AuditLog[] = [
  {
    timestamp: "2026-05-27T10:30:00Z",
    service: "github",
    operation: "listCommits",
    type: "read",
    status: "success",
    executionTimeMs: 245,
  },
  {
    timestamp: "2026-05-27T10:25:00Z",
    service: "supabase",
    operation: "getDatabaseSize",
    type: "read",
    status: "success",
    executionTimeMs: 89,
  },
  {
    timestamp: "2026-05-27T10:20:00Z",
    service: "github",
    operation: "getIssues",
    type: "read",
    status: "success",
    executionTimeMs: 312,
  },
  {
    timestamp: "2026-05-27T10:15:00Z",
    service: "railway",
    operation: "getProjects",
    type: "read",
    status: "failure",
    executionTimeMs: 5000,
  },
  {
    timestamp: "2026-05-27T10:10:00Z",
    service: "supabase",
    operation: "listTables",
    type: "read",
    status: "success",
    executionTimeMs: 156,
  },
  {
    timestamp: "2026-05-27T10:05:00Z",
    service: "github",
    operation: "getFileContent",
    type: "read",
    status: "success",
    executionTimeMs: 178,
  },
  {
    timestamp: "2026-05-27T10:00:00Z",
    service: "supabase",
    operation: "getTableStats",
    type: "read",
    status: "success",
    executionTimeMs: 203,
  },
];

const mockGovernanceRules: GovernanceRule[] = [
  { id: "RULE-0", description: "JARVIS nunca ejecuta codigo arbitrario sin sandbox" },
  { id: "RULE-1", description: "Todas las operaciones de escritura requieren aprobacion" },
  { id: "RULE-2", description: "Los tokens de API nunca se exponen en logs" },
  { id: "RULE-3", description: "Rate limiting en todas las operaciones" },
  { id: "RULE-4", description: "Sanitizacion de datos personales" },
  { id: "RULE-5", description: "Timeout maximo de 30 segundos" },
  { id: "RULE-6", description: "Solo operaciones read-only por defecto" },
  { id: "RULE-7", description: "Backup antes de cualquier modificacion" },
  { id: "RULE-8", description: "Logs de auditoria inmutables" },
  { id: "RULE-9", description: "Acceso solo para usuarios autenticados" },
  { id: "RULE-10", description: "Las credenciales nunca se almacenan en codigo" },
  { id: "RULE-11", description: "Verificacion de integridad en cada operacion" },
  { id: "RULE-12", description: "Kill switch inmediato disponible" },
];

const mockAutonomousTasks: AutonomousTask[] = [
  {
    id: "inventory-sync",
    name: "Sincronizacion de Inventario",
    interval: "15m",
    lastRun: "2026-05-27T10:15:00Z",
    status: "completed",
  },
  {
    id: "price-optimizer",
    name: "Optimizador de Precios",
    interval: "1h",
    lastRun: "2026-05-27T10:00:00Z",
    status: "completed",
  },
  {
    id: "auto-reply",
    name: "Respuestas Automaticas",
    interval: "5m",
    lastRun: "2026-05-27T10:28:00Z",
    status: "completed",
  },
  {
    id: "trending",
    name: "Deteccion de Tendencias",
    interval: "30m",
    lastRun: "2026-05-27T10:00:00Z",
    status: "completed",
  },
  {
    id: "review-analyzer",
    name: "Analisis de Reviews",
    interval: "2h",
    lastRun: "2026-05-27T09:00:00Z",
    status: "completed",
  },
  {
    id: "stock-alert",
    name: "Alertas de Stock Bajo",
    interval: "10m",
    lastRun: "2026-05-27T10:20:00Z",
    status: "completed",
  },
  {
    id: "competitor-monitor",
    name: "Monitoreo de Competencia",
    interval: "6h",
    lastRun: "2026-05-27T06:00:00Z",
    status: "completed",
  },
  {
    id: "report-generator",
    name: "Generador de Reportes",
    interval: "24h",
    lastRun: "2026-05-27T00:00:00Z",
    status: "completed",
  },
];

/* ================================================================ */
/*  HELPERS                                                         */
/* ================================================================ */

const serviceConfig: Record<
  ServiceName,
  { label: string; icon: React.ReactNode; envVars: string[] }
> = {
  github: {
    label: "GitHub",
    icon: <Github size={20} />,
    envVars: ["GITHUB_TOKEN"],
  },
  railway: {
    label: "Railway",
    icon: <TrainFront size={20} />,
    envVars: ["RAILWAY_API_TOKEN"],
  },
  supabase: {
    label: "Supabase",
    icon: <Database size={20} />,
    envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

/* ================================================================ */
/*  COMPONENTE PRINCIPAL                                            */
/* ================================================================ */

export default function JarvisControlCenterPage() {
  /* -- Estados globales ------------------------------------------- */
  const [jarvisEnabled, setJarvisEnabled] = useState<boolean>(true);
  const [health, setHealth] = useState<HealthStatus>(mockHealth);
  const [logs, setLogs] = useState<AuditLog[]>(mockRecentLogs);
  const [schedulerRunning, setSchedulerRunning] = useState<boolean>(true);
  const [tasks, setTasks] = useState<AutonomousTask[]>(mockAutonomousTasks);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  /* -- Estados de fetch ------------------------------------------- */
  const [mcpInfo, setMcpInfo] = useState<MCPInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  /* -- Estados del Operation Runner ------------------------------- */
  const [runnerService, setRunnerService] = useState<ServiceName>("github");
  const [runnerOperation, setRunnerOperation] = useState<string>("");
  const [runnerParams, setRunnerParams] = useState<string>("{}");
  const [runnerResult, setRunnerResult] = useState<string | null>(null);
  const [runnerLoading, setRunnerLoading] = useState(false);

  /* -- Tab de operaciones ----------------------------------------- */
  const [opsTab, setOpsTab] = useState<ServiceName>("github");

  /* ============================================================== */
  /*  FETCH: MCP Info                                               */
  /* ============================================================== */
  const fetchMCPInfo = useCallback(async () => {
    try {
      setInfoLoading(true);
      setInfoError(null);
      const res = await fetch("/api/jarvis/mcp");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MCPInfo = await res.json();
      setMcpInfo(data);
      setJarvisEnabled(data.enabled);
      setHealth({
        github: data.services.github?.healthy ?? mockHealth.github,
        railway: data.services.railway?.healthy ?? mockHealth.railway,
        supabase: data.services.supabase?.healthy ?? mockHealth.supabase,
      });
    } catch {
      setInfoError("No se pudo conectar con JARVIS MCP. Mostrando datos locales.");
      setMcpInfo(null);
    } finally {
      setInfoLoading(false);
    }
  }, []);

  /* ============================================================== */
  /*  FETCH: Audit Logs                                             */
  /* ============================================================== */
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/jarvis/mcp/audit");
      if (!res.ok) throw new Error("Error fetching logs");
      const data: AuditLog[] = await res.json();
      setLogs(data.slice(0, 20));
    } catch {
      /* fallback a mock */
    }
  }, []);

  /* ============================================================== */
  /*  FETCH: Autonomous Status                                      */
  /* ============================================================== */
  const fetchAutonomousStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/jarvis/autonomous");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setSchedulerRunning(data.schedulerRunning ?? true);
      if (data.tasks) setTasks(data.tasks);
    } catch {
      /* fallback a mock */
    }
  }, []);

  /* -- Carga inicial ---------------------------------------------- */
  useEffect(() => {
    fetchMCPInfo();
    fetchLogs();
    fetchAutonomousStatus();
  }, [fetchMCPInfo, fetchLogs, fetchAutonomousStatus]);

  /* ============================================================== */
  /*  HANDLERS                                                      */
  /* ============================================================== */

  const toggleJarvis = async () => {
    const newState = !jarvisEnabled;
    setJarvisEnabled(newState);
    try {
      await fetch("/api/jarvis/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newState ? "enable" : "disable" }),
      });
    } catch {
      /* silent fail - UI ya actualizo */
    }
  };

  const runOperation = async () => {
    if (!runnerOperation) return;

    const operationDef = mockOperations[runnerService];
    const isWrite = operationDef.write.includes(runnerOperation);

    if (isWrite) {
      const confirmed = window.confirm(
        `ATENCION: Vas a ejecutar una operacion de ESCRITURA "${runnerOperation}" en ${serviceConfig[runnerService].label}. Continuar?`
      );
      if (!confirmed) return;
    }

    let parsedParams: Record<string, unknown> = {};
    try {
      parsedParams = JSON.parse(runnerParams || "{}");
    } catch {
      setRunnerResult(JSON.stringify({ error: "JSON de params invalido" }, null, 2));
      return;
    }

    setRunnerLoading(true);
    setRunnerResult(null);
    try {
      const res = await fetch("/api/jarvis/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: runnerService,
          operation: runnerOperation,
          params: parsedParams,
        }),
      });
      const data = await res.json();
      setRunnerResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setRunnerResult(
        JSON.stringify(
          { error: "Fallo la ejecucion", message: String(err) },
          null,
          2
        )
      );
    } finally {
      setRunnerLoading(false);
    }
  };

  const controlScheduler = async (action: "start" | "stop" | "restart") => {
    setLoading((prev) => ({ ...prev, [action]: true }));
    try {
      await fetch("/api/jarvis/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "start") setSchedulerRunning(true);
      if (action === "stop") setSchedulerRunning(false);
      if (action === "restart") {
        setSchedulerRunning(false);
        setTimeout(() => setSchedulerRunning(true), 500);
      }
      await fetchAutonomousStatus();
    } catch {
      /* silent fail */
    } finally {
      setLoading((prev) => ({ ...prev, [action]: false }));
    }
  };

  /* -- Opciones de operacion segun servicio ----------------------- */
  const operationOptions = useMemo(() => {
    const ops = mockOperations[runnerService];
    return [
      ...ops.read.map((op) => ({ value: op, label: op, type: "read" as OperationType })),
      ...ops.write.map((op) => ({ value: op, label: op, type: "write" as OperationType })),
    ];
  }, [runnerService]);

  /* ============================================================== */
  /*  RENDER                                                        */
  /* ============================================================== */

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* ========================================================= */}
      {/*  1. HEADER SECTION                                         */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">
              JARVIS Control Center
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bot size={14} />
              <span>Multi-Context Protocol Dashboard</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                jarvisEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className={jarvisEnabled ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
              {jarvisEnabled ? "Online" : "Offline"}
            </span>
          </div>
          <button
            onClick={toggleJarvis}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              jarvisEnabled ? "bg-emerald-500" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                jarvisEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {infoError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertTriangle size={16} />
          {infoError}
        </div>
      )}

      {/* ========================================================= */}
      {/*  2. SERVICES HEALTH CARDS                                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(serviceConfig) as ServiceName[]).map((svc) => {
          const cfg = serviceConfig[svc];
          const isHealthy = health[svc];
          const ops = mockOperations[svc];
          const totalOps = ops.read.length + ops.write.length;
          const isConfigured = svc === "railway" ? false : true;

          return (
            <Card key={svc} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isHealthy
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {cfg.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{cfg.label}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isHealthy ? (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        ) : (
                          <XCircle size={13} className="text-red-500" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isHealthy ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {isHealthy ? "Healthy" : "Unhealthy"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={isHealthy ? "success" : "destructive"} size="sm">
                    {totalOps} ops
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye size={12} />
                      Read
                    </span>
                    <span className="font-medium text-foreground">{ops.read.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Pencil size={12} />
                      Write
                    </span>
                    <span className="font-medium text-foreground">{ops.write.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Server size={12} />
                      Configurado
                    </span>
                    <span
                      className={`font-medium ${
                        isConfigured ? "text-emerald-600" : "text-amber-500"
                      }`}
                    >
                      {isConfigured ? "Si" : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/*  3. OPERATIONS EXPLORER  +  4. QUICK OPERATION RUNNER      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* -- Operations Explorer -- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal size={18} className="text-primary" />
              Explorador de Operaciones
            </CardTitle>
            <CardDescription>Operaciones disponibles por servicio MCP</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={opsTab} onValueChange={(v) => setOpsTab(v as ServiceName)}>
              <TabsList className="w-full">
                <TabsTrigger value="github" className="flex-1 gap-1">
                  <Github size={14} />
                  GitHub
                </TabsTrigger>
                <TabsTrigger value="railway" className="flex-1 gap-1">
                  <TrainFront size={14} />
                  Railway
                </TabsTrigger>
                <TabsTrigger value="supabase" className="flex-1 gap-1">
                  <Database size={14} />
                  Supabase
                </TabsTrigger>
              </TabsList>

              {(Object.keys(mockOperations) as ServiceName[]).map((svc) => (
                <TabsContent key={svc} value={svc} className="mt-4 space-y-4">
                  {/* Read operations */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Eye size={12} />
                      Read Operations ({mockOperations[svc].read.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {mockOperations[svc].read.map((op) => (
                        <div
                          key={op}
                          className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-sm font-mono text-foreground">{op}</span>
                          <Badge variant="secondary" size="sm">
                            read
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Write operations */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Lock size={12} />
                      Write Operations ({mockOperations[svc].write.length})
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {mockOperations[svc].write.map((op) => (
                        <div
                          key={op}
                          className="flex items-center justify-between py-1.5 px-3 rounded-md bg-amber-50/50 hover:bg-amber-50 transition-colors border border-amber-100/60"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                            <span className="text-sm font-mono text-foreground">{op}</span>
                          </div>
                          <Badge variant="warning" size="sm">
                            write
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* -- Quick Operation Runner -- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Ejecutar Operacion
            </CardTitle>
            <CardDescription>Selecciona servicio, operacion y parametros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Servicio</label>
              <Select
                value={runnerService}
                onValueChange={(v) => {
                  setRunnerService(v as ServiceName);
                  setRunnerOperation("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">
                    <div className="flex items-center gap-2">
                      <Github size={14} />
                      GitHub
                    </div>
                  </SelectItem>
                  <SelectItem value="railway">
                    <div className="flex items-center gap-2">
                      <TrainFront size={14} />
                      Railway
                    </div>
                  </SelectItem>
                  <SelectItem value="supabase">
                    <div className="flex items-center gap-2">
                      <Database size={14} />
                      Supabase
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operation selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Operacion</label>
              <Select value={runnerOperation} onValueChange={setRunnerOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una operacion..." />
                </SelectTrigger>
                <SelectContent>
                  {operationOptions.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <div className="flex items-center gap-2">
                        {op.type === "write" && <Lock size={12} className="text-amber-500" />}
                        <span className="font-mono text-xs">{op.label}</span>
                        <Badge variant={op.type === "read" ? "secondary" : "warning"} size="sm">
                          {op.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Params textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Parametros (JSON)
              </label>
              <textarea
                value={runnerParams}
                onChange={(e) => setRunnerParams(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                placeholder='{"owner": "user", "repo": "my-repo"}'
                spellCheck={false}
              />
            </div>

            {/* Execute button */}
            <Button
              onClick={runOperation}
              disabled={!runnerOperation || runnerLoading}
              className="w-full gap-2"
            >
              {runnerLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {runnerLoading ? "Ejecutando..." : "Ejecutar"}
            </Button>

            {/* Result */}
            {runnerResult && (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Resultado
                </label>
                <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto border border-border">
                  <code>{runnerResult}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/*  5. RECENT ACTIVITY LOG                                    */}
      {/* ========================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText size={18} className="text-primary" />
            Registro de Actividad Reciente
          </CardTitle>
          <CardDescription>Ultimas operaciones MCP ejecutadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 pr-4">Hora</th>
                  <th className="py-3 pr-4">Servicio</th>
                  <th className="py-3 pr-4">Operacion</th>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        {log.service === "github" && <Github size={13} className="text-muted-foreground" />}
                        {log.service === "railway" && (
                          <TrainFront size={13} className="text-muted-foreground" />
                        )}
                        {log.service === "supabase" && (
                          <Database size={13} className="text-muted-foreground" />
                        )}
                        <span className="capitalize font-medium">{log.service}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{log.operation}</td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant={log.type === "read" ? "secondary" : "warning"}
                        size="sm"
                      >
                        {log.type === "read" ? (
                          <Eye size={10} className="mr-1" />
                        ) : (
                          <Lock size={10} className="mr-1" />
                        )}
                        {log.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        {log.status === "success" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <XCircle size={14} className="text-red-500" />
                        )}
                        <span
                          className={
                            log.status === "success" ? "text-emerald-600" : "text-red-500"
                          }
                        >
                          {log.status === "success" ? "Success" : "Failure"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      <span
                        className={
                          log.executionTimeMs > 1000 ? "text-amber-600 font-medium" : ""
                        }
                      >
                        {log.executionTimeMs >= 1000
                          ? `${(log.executionTimeMs / 1000).toFixed(1)}s`
                          : `${log.executionTimeMs}ms`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/*  6. GOVERNANCE STATUS  +  7. AUTONOMOUS ENGINE             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* -- Governance Status -- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              Gobernanza
            </CardTitle>
            <CardDescription>Reglas inviolables de JARVIS MCP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {mockGovernanceRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-primary font-mono">{rule.id}</span>
                    <p className="text-sm text-foreground mt-0.5 leading-snug">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <Shield size={14} />
              Todas las {mockGovernanceRules.length} reglas estan activas y vigentes
            </div>
          </CardContent>
        </Card>

        {/* -- Autonomous Engine Status -- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                Motor Autonomo
              </CardTitle>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    schedulerRunning ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-xs font-medium">
                  {schedulerRunning ? "Running" : "Stopped"}
                </span>
              </div>
            </div>
            <CardDescription>Control del scheduler y tareas autonomas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Control buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={schedulerRunning ? "outline" : "default"}
                onClick={() => controlScheduler("start")}
                disabled={schedulerRunning || loading["start"]}
                className="gap-1.5 flex-1"
              >
                {loading["start"] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                Start
              </Button>
              <Button
                size="sm"
                variant={!schedulerRunning ? "outline" : "default"}
                onClick={() => controlScheduler("stop")}
                disabled={!schedulerRunning || loading["stop"]}
                className="gap-1.5 flex-1"
              >
                {loading["stop"] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Square size={14} />
                )}
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => controlScheduler("restart")}
                disabled={loading["restart"]}
                className="gap-1.5 flex-1"
              >
                {loading["restart"] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCw size={14} />
                )}
                Restart
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      task.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : task.status === "running"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 size={16} />
                    ) : task.status === "running" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{task.name}</span>
                      <Badge variant="secondary" size="sm">
                        <Clock size={10} className="mr-1" />
                        {task.interval}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Ult: {timeAgo(task.lastRun)}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          task.status === "completed"
                            ? "text-emerald-600"
                            : task.status === "running"
                            ? "text-blue-600"
                            : "text-red-500"
                        }`}
                      >
                        {task.status === "completed"
                          ? "Completado"
                          : task.status === "running"
                          ? "Ejecutando"
                          : "Fallido"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
