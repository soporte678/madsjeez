/**
 * JARVIS Autonomous System – Public API
 *
 * Barrel file that re-exports the autonomous engine, scheduler, and all
 * related types so consumers can simply write:
 *
 *   import { runAutonomousTask, getScheduler } from "@/lib/jarvis/autonomous";
 *
 * @module lib/jarvis/autonomous
 */

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export {
  runAutonomousTask,
  getAutonomousTasks,
  AUTONOMOUS_TASKS,
} from "./engine";

export type {
  AutonomousTask,
  TaskResult,
  TaskPriority,
} from "./engine";

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export {
  getScheduler,
  AutonomousScheduler,
  destroyScheduler,
} from "./scheduler";

export type {
  ScheduledTask,
  TaskRunRecord,
} from "./scheduler";
