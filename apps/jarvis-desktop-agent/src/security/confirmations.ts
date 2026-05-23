import { randomBytes } from "crypto";

const pending = new Map<string, { action: string; expires: number }>();

export function createConfirmationToken(action: string): string {
  const token = randomBytes(16).toString("hex");
  pending.set(token, { action, expires: Date.now() + 120_000 });
  return token;
}

export function consumeConfirmationToken(token: string | undefined, action: string): boolean {
  if (!token) return false;
  const row = pending.get(token);
  pending.delete(token);
  if (!row) return false;
  if (row.action !== action) return false;
  if (Date.now() > row.expires) return false;
  return true;
}
