import { NextResponse } from "next/server";

/**
 * Admin bootstrap endpoints must not run in production unless explicitly enabled.
 */
export function assertAdminBootstrapAllowed(): NextResponse | null {
  const enabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
  if (process.env.NODE_ENV === "production" && !enabled) {
    return NextResponse.json(
      { error: "Not available" },
      { status: 404 }
    );
  }
  return null;
}
