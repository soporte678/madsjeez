/** Comandos shell permitidos (allowlist parcial). */
export const ALLOWED_SHELL_PREFIXES = [
  "npm run lint",
  "npm test",
  "npx tsc --noEmit",
  "git status",
  "git diff",
];

export function isShellCommandAllowed(cmd: string): boolean {
  const t = cmd.trim();
  return ALLOWED_SHELL_PREFIXES.some((p) => t.startsWith(p));
}

export const BLOCKED_PATTERNS = [
  /format\s+[a-z]:/i,
  /rm\s+-rf/i,
  /del\s+\/f/i,
  /drop\s+database/i,
  /railway\s+delete/i,
];

export function isCommandBlocked(cmd: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(cmd));
}
