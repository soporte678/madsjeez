import { spawn } from "child_process";
import { config } from "../config.js";

export async function openApp(exe: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("cmd", ["/c", "start", "", exe, ...args], {
      detached: true,
      stdio: "ignore",
      shell: false,
    });
    child.on("error", reject);
    child.unref();
    resolve();
  });
}

export async function openUrl(url: string): Promise<void> {
  return openApp(url);
}

export async function openFolder(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn("explorer", [path], { detached: true, stdio: "ignore" }).on("error", reject);
    resolve();
  });
}

export async function openCursor(): Promise<void> {
  const p = process.env.CURSOR_PATH?.trim() || "cursor";
  await openApp(p, [config.repoRoot]);
}

export async function openClaude(): Promise<void> {
  const p = process.env.CLAUDE_PATH?.trim() || "claude";
  await openApp(p, []);
}

export async function openWindsurf(): Promise<void> {
  const p = process.env.WINDSURF_PATH?.trim() || "windsurf";
  await openApp(p, [config.repoRoot]);
}

export async function openTerminalInRepo(): Promise<void> {
  const cmd = `start wt -d "${config.repoRoot}"`;
  spawn("cmd", ["/c", cmd], { detached: true, stdio: "ignore" }).unref();
}
