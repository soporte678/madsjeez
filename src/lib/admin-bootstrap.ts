import { NextResponse } from "next/server";

/**
 * Admin bootstrap endpoints must not run in production unless explicitly enabled.
 */
export function assertAdminBootstrapAllowed(): NextResponse | null {
  const enabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
  if (process.env.NODE_ENV === "production" && !enabled) {
    return NextResponse.json(
      { error: "Admin bootstrap is disabled in production. Set ENABLE_ADMIN_BOOTSTRAP=true temporarily if required." },
      { status: 403 }
    );
  }
  return null;
}
