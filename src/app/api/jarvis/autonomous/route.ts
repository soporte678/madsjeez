/**
 * API Route – /api/jarvis/autonomous
 *
 * HTTP interface for controlling and monitoring the JARVIS Autonomous Engine.
 *
 * Methods
 * -------
 * GET  – Returns current scheduler status, task definitions, and recent history.
 * POST – Control actions: start, stop, restart, or manually trigger a task.
 *
 * Actions (POST body)
 * -------------------
 * { action: "start" }                – Start the recurring scheduler.
 * { action: "stop" }                 – Stop all recurring intervals.
 * { action: "restart" }              – Full reset + start.
 * { action: "run", taskId: "..." }   – Execute a single task immediately.
 *
 * @module app/api/jarvis/autonomous/route
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getScheduler,
  destroyScheduler,
} from "@/lib/jarvis/autonomous/scheduler";
import {
  runAutonomousTask,
  getAutonomousTasks,
} from "@/lib/jarvis/autonomous/engine";

// ============================================================================
// In-memory scheduler state (replace with Redis in multi-instance deploys)
// ============================================================================

let schedulerStarted = false;

// ============================================================================
// GET /api/jarvis/autonomous
// ============================================================================

/**
 * Returns a comprehensive status payload:
 * - Whether the scheduler loop is active
 * - Per-task runtime state (next run, last run, recent history)
 * - Static task definitions (cron, priority, approval requirement)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const scheduler = getScheduler();
    const tasks = scheduler.getStatus();
    const definitions = getAutonomousTasks();

    // Merge runtime state with static definitions for a rich response
    const enrichedTasks = tasks.map((t) => {
      const def = definitions.find((d) => d.id === t.id);
      return {
        id: t.id,
        name: t.name,
        priority: def?.priority ?? "MEDIUM",
        requiresApproval: def?.requiresApproval ?? false,
        cronExpression: def?.cronExpression ?? "0 * * * *",
        intervalMs: t.intervalMs,
        running: t.running,
        nextRun: t.nextRun.toISOString(),
        lastRun: t.lastRun?.toISOString() ?? null,
        totalExecutions: t.history.length,
        successRate: calculateSuccessRate(t.history),
        history: t.history.slice(-10).map((h) => ({
          timestamp: h.timestamp.toISOString(),
          success: h.success,
          actionTaken: h.actionTaken,
          duration: h.duration,
        })),
      };
    });

    const uptime = schedulerStarted
      ? "Scheduler is active"
      : "Scheduler is stopped";

    return NextResponse.json({
      ok: true,
      running: schedulerStarted,
      uptime,
      taskCount: tasks.length,
      tasks: enrichedTasks,
      definitions,
      meta: {
        fetchedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] GET /autonomous failed:", message);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch autonomous status", detail: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/jarvis/autonomous
// ============================================================================

/**
 * Handles control actions for the autonomous scheduler.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      action: string;
      taskId?: string;
    };
    const { action, taskId } = body;

    const scheduler = getScheduler();

    switch (action) {
      // ---------------------------------------------------------------
      // START
      // ---------------------------------------------------------------
      case "start": {
        if (schedulerStarted) {
          return NextResponse.json(
            {
              ok: true,
              status: "already_running",
              message: "Scheduler was already running.",
              running: true,
            },
            { status: 200 }
          );
        }

        scheduler.start();
        schedulerStarted = true;

        return NextResponse.json({
          ok: true,
          status: "started",
          message: `Scheduler started with ${scheduler.getStatus().length} tasks.`,
          running: true,
        });
      }

      // ---------------------------------------------------------------
      // STOP
      // ---------------------------------------------------------------
      case "stop": {
        scheduler.stop();
        schedulerStarted = false;

        return NextResponse.json({
          ok: true,
          status: "stopped",
          message: "All recurring tasks have been halted.",
          running: false,
        });
      }

      // ---------------------------------------------------------------
      // RESTART
      // ---------------------------------------------------------------
      case "restart": {
        scheduler.restart();
        schedulerStarted = true;

        return NextResponse.json({
          ok: true,
          status: "restarted",
          message: "Scheduler restarted with fresh state.",
          running: true,
        });
      }

      // ---------------------------------------------------------------
      // RUN (manual single-task execution)
      // ---------------------------------------------------------------
      case "run": {
        if (!taskId) {
          return NextResponse.json(
            {
              ok: false,
              error: "Missing required field: taskId",
              hint: "Provide { action: 'run', taskId: 'inventory-check' }",
            },
            { status: 400 }
          );
        }

        // Validate task exists
        const definitions = getAutonomousTasks();
        const taskDef = definitions.find((d) => d.id === taskId);
        if (!taskDef) {
          return NextResponse.json(
            {
              ok: false,
              error: `Unknown task: "${taskId}"`,
              availableTasks: definitions.map((d) => d.id),
            },
            { status: 404 }
          );
        }

        const result = await scheduler.runTaskNow(taskId);

        return NextResponse.json({
          ok: result.success,
          status: result.success ? "completed" : "failed",
          task: {
            id: taskId,
            name: taskDef.name,
            requiresApproval: taskDef.requiresApproval,
          },
          result: {
            actionTaken: result.actionTaken,
            details: result.details,
            requiresHumanApproval: result.requiresHumanApproval ?? false,
            proposedChangesCount: result.proposedChanges?.length ?? 0,
          },
          executedAt: new Date().toISOString(),
        });
      }

      // ---------------------------------------------------------------
      // DESTROY (test / emergency cleanup)
      // ---------------------------------------------------------------
      case "destroy": {
        destroyScheduler();
        schedulerStarted = false;

        return NextResponse.json({
          ok: true,
          status: "destroyed",
          message: "Scheduler instance destroyed. Next call will create a fresh instance.",
          running: false,
        });
      }

      // ---------------------------------------------------------------
      // UNKNOWN ACTION
      // ---------------------------------------------------------------
      default: {
        return NextResponse.json(
          {
            ok: false,
            error: `Invalid action: "${action}"`,
            supportedActions: ["start", "stop", "restart", "run", "destroy"],
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] POST /autonomous failed:", message);
    return NextResponse.json(
      { ok: false, error: "Request processing failed", detail: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculates the success-rate percentage from a task's execution history.
 */
function calculateSuccessRate(history: Array<{ success: boolean }>): number {
  if (history.length === 0) return 0;
  const successes = history.filter((h) => h.success).length;
  return Math.round((successes / history.length) * 100);
}
