-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "session_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_session_token_hash_key" ON "admin_sessions"("session_token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_user_id_revoked_at_expires_at_idx" ON "admin_sessions"("admin_user_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "admin_sessions_user_id_revoked_at_expires_at_idx" ON "admin_sessions"("user_id", "revoked_at", "expires_at");
