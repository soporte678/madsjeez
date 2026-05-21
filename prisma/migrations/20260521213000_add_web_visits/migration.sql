-- CreateTable
CREATE TABLE "web_visits" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT,
    "referrer" TEXT,
    "user_agent" TEXT,
    "visitor_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "web_visits_created_at_idx" ON "web_visits"("created_at");

-- CreateIndex
CREATE INDEX "web_visits_source_medium_idx" ON "web_visits"("source", "medium");
