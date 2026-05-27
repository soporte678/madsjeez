/**
 * Railway MCP Connector
 * Allows JARVIS to manage Railway deployments
 * All write operations require governance approval via the orchestrator
 *
 * @module railway-mcp
 * @requires governance/auditor for security logging
 */

import { logSecurityEvent } from "../governance/auditor";

// ─── Configuration ───────────────────────────────────────────────────────────

const RAILWAY_API_TOKEN = process.env.RAILWAY_API_TOKEN;
const RAILWAY_API_BASE = "https://backboard.railway.app/graphql/v2";

if (!RAILWAY_API_TOKEN) {
  console.warn(
    "[Railway MCP] RAILWAY_API_TOKEN environment variable is not set. " +
      "Railway operations will fail."
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Railway project metadata */
export interface RailwayProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Railway service (container / app) */
export interface RailwayService {
  id: string;
  name: string;
  projectId: string;
  source: {
    image: string | null;
    repo: string | null;
    template: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/** Deployment status info */
export interface RailwayDeployment {
  id: string;
  serviceId: string;
  status:
    | "PENDING"
    | "BUILDING"
    | "DEPLOYING"
    | "SUCCESS"
    | "FAILED"
    | "CRASHED"
    | "SKIPPED"
    | "REMOVED";
  commitMessage: string | null;
  createdAt: string;
  updatedAt: string;
  url: string | null;
}

/** Service metrics snapshot */
export interface ServiceMetrics {
  serviceId: string;
  cpuPercent: number;
  memoryMb: number;
  diskMb: number;
  networkRxMb: number;
  networkTxMb: number;
  timestamp: string;
}

// ─── GraphQL Helper ──────────────────────────────────────────────────────────

/**
 * Execute a GraphQL query against the Railway API.
 */
async function railwayQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(RAILWAY_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
      "User-Agent": "JARVIS-MCP/1.0",
    },
    body: JSON.stringify({ query, variables: variables || {} }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Railway API error (${response.status}): ${response.statusText} - ${errorBody}`
    );
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Railway GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error("Railway API returned no data");
  }

  return json.data;
}

/**
 * Log an operation event to the security audit system.
 */
function logOperation(
  operation: string,
  target: string,
  status: "success" | "failure",
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    service: "railway",
    operation,
    target,
    status,
    timestamp: new Date().toISOString(),
    details,
  }).catch((err) => {
    console.error(`[Railway MCP] Audit logging failed: ${err.message}`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ OPERATIONS — No approval required
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all projects accessible to the authenticated user.
 *
 * @returns Array of Railway projects
 */
export async function getProjects(): Promise<RailwayProject[]> {
  try {
    const data = await railwayQuery<{
      me: {
        projects: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              description: string | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
        };
      };
    }>(`
      query {
        me {
          projects {
            edges {
              node {
                id
                name
                description
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `);

    const projects = data.me.projects.edges.map((edge) => edge.node);
    logOperation("getProjects", "all", "success", { count: projects.length });
    return projects;
  } catch (error) {
    logOperation("getProjects", "all", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get a single project by ID.
 *
 * @param projectId - Railway project ID
 * @returns Project metadata
 */
export async function getProject(projectId: string): Promise<RailwayProject> {
  try {
    const data = await railwayQuery<{
      project: {
        id: string;
        name: string;
        description: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(
      `
      query GetProject($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `,
      { id: projectId }
    );

    logOperation("getProject", projectId, "success");
    return data.project;
  } catch (error) {
    logOperation("getProject", projectId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get all services within a project.
 *
 * @param projectId - Railway project ID
 * @returns Array of services
 */
export async function getServices(projectId: string): Promise<RailwayService[]> {
  try {
    const data = await railwayQuery<{
      project: {
        services: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              source: {
                image: string | null;
                repo: string | null;
                template: string | null;
              } | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
        };
      };
    }>(
      `
      query GetServices($id: String!) {
        project(id: $id) {
          services {
            edges {
              node {
                id
                name
                source {
                  image
                  repo
                  template
                }
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `,
      { id: projectId }
    );

    const services = data.project.services.edges.map((edge) => ({
      ...edge.node,
      projectId,
    }));

    logOperation("getServices", projectId, "success", { count: services.length });
    return services;
  } catch (error) {
    logOperation("getServices", projectId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get a single service by ID.
 *
 * @param serviceId - Railway service ID
 * @returns Service metadata
 */
export async function getService(serviceId: string): Promise<RailwayService> {
  try {
    const data = await railwayQuery<{
      service: {
        id: string;
        name: string;
        projectId: string;
        source: {
          image: string | null;
          repo: string | null;
          template: string | null;
        } | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(
      `
      query GetService($id: String!) {
        service(id: $id) {
          id
          name
          projectId
          source {
            image
            repo
            template
          }
          createdAt
          updatedAt
        }
      }
    `,
      { id: serviceId }
    );

    logOperation("getService", serviceId, "success");
    return data.service;
  } catch (error) {
    logOperation("getService", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get deployment history for a service.
 *
 * @param serviceId - Railway service ID
 * @returns Array of deployment records
 */
export async function getDeployments(serviceId: string): Promise<RailwayDeployment[]> {
  try {
    const data = await railwayQuery<{
      service: {
        deployments: {
          edges: Array<{
            node: {
              id: string;
              status: string;
              meta: {
                commitMessage?: string;
              } | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
        };
      };
    }>(
      `
      query GetDeployments($id: String!) {
        service(id: $id) {
          deployments {
            edges {
              node {
                id
                status
                meta {
                  commitMessage
                }
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `,
      { id: serviceId }
    );

    const deployments: RailwayDeployment[] =
      data.service.deployments.edges.map((edge) => ({
        id: edge.node.id,
        serviceId,
        status: edge.node.status as RailwayDeployment["status"],
        commitMessage: edge.node.meta?.commitMessage || null,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        url: null, // Railway does not expose direct URL via GraphQL
      }));

    logOperation("getDeployments", serviceId, "success", {
      count: deployments.length,
    });
    return deployments;
  } catch (error) {
    logOperation("getDeployments", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get logs for a specific deployment.
 *
 * @param deploymentId - Railway deployment ID
 * @returns Array of log lines
 */
export async function getDeploymentLogs(deploymentId: string): Promise<string[]> {
  try {
    const data = await railwayQuery<{
      deploymentLogs: Array<{
        message: string;
        timestamp: string;
        severity: string;
      }>;
    }>(
      `
      query GetDeploymentLogs($id: String!) {
        deploymentLogs(deploymentId: $id) {
          message
          timestamp
          severity
        }
      }
    `,
      { id: deploymentId }
    );

    const logs = data.deploymentLogs.map(
      (log) => `[${log.severity}] ${log.timestamp}: ${log.message}`
    );

    logOperation("getDeploymentLogs", deploymentId, "success", {
      lineCount: logs.length,
    });
    return logs;
  } catch (error) {
    logOperation("getDeploymentLogs", deploymentId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get environment variables for a service.
 *
 * @param serviceId - Railway service ID
 * @returns Record of environment variable key-value pairs
 */
export async function getEnvironmentVariables(
  serviceId: string
): Promise<Record<string, string>> {
  try {
    const data = await railwayQuery<{
      variables: {
        edges: Array<{
          node: {
            name: string;
            value: string;
          };
        }>;
      };
    }>(
      `
      query GetVariables($serviceId: String!) {
        variables(serviceId: $serviceId) {
          edges {
            node {
              name
              value
            }
          }
        }
      }
    `,
      { serviceId }
    );

    const envVars: Record<string, string> = {};
    for (const edge of data.variables.edges) {
      envVars[edge.node.name] = edge.node.value;
    }

    logOperation("getEnvironmentVariables", serviceId, "success", {
      count: Object.keys(envVars).length,
    });
    return envVars;
  } catch (error) {
    logOperation("getEnvironmentVariables", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get current metrics for a service.
 *
 * @param serviceId - Railway service ID
 * @returns Metrics snapshot
 */
export async function getServiceMetrics(serviceId: string): Promise<ServiceMetrics> {
  try {
    const data = await railwayQuery<{
      service: {
        id: string;
        instances: {
          edges: Array<{
            node: {
              cpuPercent: number;
              memoryMb: number;
              diskMb: number;
              networkRxMb: number;
              networkTxMb: number;
              createdAt: string;
            };
          }>;
        };
      };
    }>(
      `
      query GetServiceMetrics($id: String!) {
        service(id: $id) {
          id
          instances {
            edges {
              node {
                cpuPercent
                memoryMb
                diskMb
                networkRxMb
                networkTxMb
                createdAt
              }
            }
          }
        }
      }
    `,
      { id: serviceId }
    );

    const latest = data.service.instances.edges[0]?.node;
    if (!latest) {
      throw new Error(`No metrics available for service ${serviceId}`);
    }

    const metrics: ServiceMetrics = {
      serviceId: data.service.id,
      cpuPercent: latest.cpuPercent || 0,
      memoryMb: latest.memoryMb || 0,
      diskMb: latest.diskMb || 0,
      networkRxMb: latest.networkRxMb || 0,
      networkTxMb: latest.networkTxMb || 0,
      timestamp: latest.createdAt,
    };

    logOperation("getServiceMetrics", serviceId, "success", metrics);
    return metrics;
  } catch (error) {
    logOperation("getServiceMetrics", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE OPERATIONS — Require governance approval
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deploy a service (trigger a new deployment).
 *
 * @param serviceId - Railway service ID
 * @returns Deployment result
 */
export async function deployService(serviceId: string): Promise<unknown> {
  try {
    const data = await railwayQuery<{
      serviceInstanceDeploy: { id: string; status: string };
    }>(
      `
      mutation DeployService($id: String!) {
        serviceInstanceDeploy(serviceId: $id) {
          id
          status
        }
      }
    `,
      { id: serviceId }
    );

    logOperation("deployService", serviceId, "success", {
      deploymentId: data.serviceInstanceDeploy.id,
    });
    return data.serviceInstanceDeploy;
  } catch (error) {
    logOperation("deployService", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Redeploy a service (force a fresh deployment).
 *
 * @param serviceId - Railway service ID
 * @returns Deployment result
 */
export async function redeployService(serviceId: string): Promise<unknown> {
  try {
    const data = await railwayQuery<{
      serviceInstanceRedeploy: { id: string; status: string };
    }>(
      `
      mutation RedeployService($id: String!) {
        serviceInstanceRedeploy(serviceId: $id) {
          id
          status
        }
      }
    `,
      { id: serviceId }
    );

    logOperation("redeployService", serviceId, "success", {
      deploymentId: data.serviceInstanceRedeploy.id,
    });
    return data.serviceInstanceRedeploy;
  } catch (error) {
    logOperation("redeployService", serviceId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Set an environment variable for a service.
 *
 * @param serviceId - Railway service ID
 * @param key - Variable name
 * @param value - Variable value
 * @returns Update result
 */
export async function setEnvironmentVariable(
  serviceId: string,
  key: string,
  value: string
): Promise<unknown> {
  try {
    const data = await railwayQuery<{
      variableUpsert: { name: string; value: string };
    }>(
      `
      mutation SetVariable($input: VariableUpsertInput!) {
        variableUpsert(input: $input) {
          name
          value
        }
      }
    `,
      {
        input: {
          serviceId,
          environmentId: "", // Will use default environment
          name: key,
          value,
        },
      }
    );

    logOperation("setEnvironmentVariable", serviceId, "success", { key });
    return data.variableUpsert;
  } catch (error) {
    logOperation("setEnvironmentVariable", serviceId, "failure", {
      key,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Scale a service to a specific number of replicas.
 *
 * @param serviceId - Railway service ID
 * @param replicas - Number of replicas (0 to pause)
 * @returns Scale result
 */
export async function scaleService(
  serviceId: string,
  replicas: number
): Promise<unknown> {
  try {
    const data = await railwayQuery<{
      serviceInstanceUpdate: { id: string };
    }>(
      `
      mutation ScaleService($id: String!, $replicas: Int!) {
        serviceInstanceUpdate(serviceId: $id, numReplicas: $replicas) {
          id
        }
      }
    `,
      { id: serviceId, replicas }
    );

    logOperation("scaleService", serviceId, "success", { replicas });
    return data.serviceInstanceUpdate;
  } catch (error) {
    logOperation("scaleService", serviceId, "failure", {
      replicas,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Rollback a service to a previous deployment.
 *
 * @param serviceId - Railway service ID
 * @param deploymentId - Deployment ID to rollback to
 * @returns Rollback result
 */
export async function rollbackDeployment(
  serviceId: string,
  deploymentId: string
): Promise<unknown> {
  try {
    const data = await railwayQuery<{
      deploymentRollback: { id: string; status: string };
    }>(
      `
      mutation RollbackDeployment($id: String!) {
        deploymentRollback(deploymentId: $id) {
          id
          status
        }
      }
    `,
      { id: deploymentId }
    );

    logOperation("rollbackDeployment", serviceId, "success", { deploymentId });
    return data.deploymentRollback;
  } catch (error) {
    logOperation("rollbackDeployment", serviceId, "failure", {
      deploymentId,
      error: (error as Error).message,
    });
    throw error;
  }
}
