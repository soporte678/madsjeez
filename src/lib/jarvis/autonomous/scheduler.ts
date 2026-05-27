/**
 * JARVIS Autonomous Scheduler
 *
 * Manages the lifecycle of all autonomous tasks:
 * - Parses cron-like expressions into millisecond intervals
 * - Starts / stops recurring execution loops
 * - Tracks execution history and next-run times
 * - Provides real-time status introspection
 * - Supports ad-hoc manual execution via `runTaskNow()`
 *
 * In production this can be swapped for node-cron, BullMQ, or a
 * distributed scheduler (Temporal / AWS EventBridge) without touching
 * the task implementations in engine.ts.
 *
 * @module lib/jarvis/autonomous/scheduler
 */

import {
  runAutonomousTask,
  getAutonomousTasks,
  type TaskResult,
} from "./engine";

// ============================================================================
// TYPES
// ============================================================================

/** Snapshot of a single task execution for historical display. */
interface TaskRunRecord {
  timestamp: Date;
  success: boolean;
  actionTaken: string;
  duration: number;
}

/** Runtime state tracked for every registered task. */
interface ScheduledTask {
  id: string;
  name: string;
  intervalMs: number;
  lastRun: Date | null;
  nextRun: Date;
  running: boolean;
  history: TaskRunRecord[];
}

// ============================================================================
// CRON PARSER
// ============================================================================

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Converts a small set of cron-like expressions into millisecond intervals.
// Supported patterns (cron-like):
//   - every 5 minutes:  */5 * * * *
//   - every 15 minutes: */15 * * * *
//   - every 30 minutes: */30 * * * *
//   - every hour:       0 * * * *
//   - every 4 hours:    0 */4 * * *
//   - every 6 hours:    0 */6 * * *
//   - every 12 hours:   0 */12 * * *
//   - every day:        0 0 * * *
// Any unsupported expression falls back to 1 hour so tasks still run.
function parseInterval(expression: string): number {
  switch (expression) {
    case "*/5 * * * *":
      return 5 * MS_PER_MINUTE;
    case "*/15 * * * *":
      return 15 * MS_PER_MINUTE;
    case "*/30 * * * *":
      return 30 * MS_PER_MINUTE;
    case "0 * * * *":
      return MS_PER_HOUR;
    case "0 */4 * * *":
      return 4 * MS_PER_HOUR;
    case "0 */6 * * *":
      return 6 * MS_PER_HOUR;
    case "0 */12 * * *":
      return 12 * MS_PER_HOUR;
    case "0 0 * * *":
      return MS_PER_DAY;
    default:
      console.warn(
        `[JARVIS Scheduler] Unsupported cron "${expression}" — defaulting to 1h.`
      );
      return MS_PER_HOUR;
  }
}

// ============================================================================
// SCHEDULER CLASS
// ============================================================================

const HISTORY_LIMIT = 100; // Max history entries per task

class AutonomousScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Reads the task registry from engine.ts and creates initial runtime
   * state for every task.  Must be called before `start()`.
   */
  initialize(): void {
    const definitions = getAutonomousTasks();

    for (const def of definitions) {
      const intervalMs = parseInterval(def.cronExpression);
      this.tasks.set(def.id, {
        id: def.id,
        name: def.name,
        intervalMs,
        lastRun: null,
        nextRun: new Date(Date.now() + intervalMs),
        running: false,
        history: [],
      });
    }

    console.log(
      `[JARVIS Scheduler] Initialized with ${this.tasks.size} task(s).`
    );
  }

  /**
   * Begins recurring execution of all registered tasks.  Each task fires
   * immediately on start and then repeats at its configured interval.
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[JARVIS Scheduler] Already running — ignoring start().");
      return;
    }
    this.isRunning = true;

    for (const [taskId, task] of this.tasks) {
      // Execute immediately so operators see instant feedback
      this.executeTask(taskId);

      // Then schedule the recurring loop
      const interval = setInterval(() => {
        this.executeTask(taskId);
      }, task.intervalMs);

      this.intervals.set(taskId, interval);
    }

    console.log(
      `[JARVIS Scheduler] Started ${this.tasks.size} task(s).`
    );
  }

  /**
   * Halts all recurring intervals.  Tasks that are currently mid-flight
   * are allowed to finish (we don't abort the Promise).
   */
  stop(): void {
    for (const [taskId, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[JARVIS Scheduler] Stopped interval for "${taskId}".`);
    }
    this.intervals.clear();
    this.isRunning = false;
    console.log("[JARVIS Scheduler] All intervals cleared — scheduler stopped.");
  }

  /**
   * Performs a full reset: stops all intervals, clears runtime state, and
   * re-initializes from the task registry.  Useful when tasks are added or
   * removed at runtime.
   */
  restart(): void {
    this.stop();
    this.tasks.clear();
    this.initialize();
    this.start();
  }

  // -------------------------------------------------------------------------
  // Status & introspection
  // -------------------------------------------------------------------------

  /**
   * Returns the current runtime state of every registered task.
   */
  getStatus(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Returns true if the scheduler loop is active.
   */
  running(): boolean {
    return this.isRunning;
  }

  // -------------------------------------------------------------------------
  // Manual execution
  // -------------------------------------------------------------------------

  /**
   * Executes a single task immediately, bypassing its normal schedule.
   * Useful for testing or operator-driven remediation.
   *
   * @param taskId - The task identifier.
   * @returns The {@link TaskResult} from the engine.
   */
  async runTaskNow(taskId: string): Promise<TaskResult> {
    return runAutonomousTask(taskId);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.error(`[JARVIS Scheduler] Unknown task "${taskId}".`);
      return;
    }

    // Prevent overlapping executions of the same task
    if (task.running) {
      console.warn(
        `[JARVIS Scheduler] "${task.name}" is still running — skipping this cycle.`
      );
      return;
    }

    task.running = true;
    task.lastRun = new Date();
    const startTime = Date.now();

    try {
      const result = await runAutonomousTask(taskId);
      const duration = Date.now() - startTime;

      task.history.push({
        timestamp: new Date(),
        success: result.success,
        actionTaken: result.actionTaken,
        duration,
      });

      // Rolling history window
      if (task.history.length > HISTORY_LIMIT) {
        task.history = task.history.slice(-HISTORY_LIMIT);
      }

      task.nextRun = new Date(Date.now() + task.intervalMs);

      const emoji = result.success ? "\u2713" : "\u2717";
      console.log(
        `[JARVIS] ${emoji} ${task.name}: ${result.actionTaken} (${duration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : String(error);

      task.history.push({
        timestamp: new Date(),
        success: false,
        actionTaken: `UNHANDLED ERROR: ${msg}`,
        duration,
      });

      console.error(`[JARVIS] \u2717 ${task.name} FAILED: ${msg}`);
    } finally {
      task.running = false;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let schedulerInstance: AutonomousScheduler | null = null;

/**
 * Returns the shared scheduler instance, creating it on first call.
 */
export function getScheduler(): AutonomousScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AutonomousScheduler();
    schedulerInstance.initialize();
  }
  return schedulerInstance;
}

/**
 * Destroys the current scheduler instance.  Primarily useful in tests
 * to ensure a clean state between test cases.
 */
export function destroyScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}

export { AutonomousScheduler };
export type { ScheduledTask, TaskRunRecord };
