-- CreateEnum
CREATE TYPE "MeliAdsChangeOutcome" AS ENUM ('PENDING', 'POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "meli_ads_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metrics_days" INTEGER NOT NULL DEFAULT 14,
    "advertisers_count" INTEGER NOT NULL DEFAULT 0,
    "campaigns_count" INTEGER NOT NULL DEFAULT 0,
    "recommendations_count" INTEGER NOT NULL DEFAULT 0,
    "totals" JSONB,
    "deltas" JSONB,
    "diagnostics" JSONB,
    "errors" JSONB,
    "source" TEXT NOT NULL DEFAULT 'sync',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meli_ads_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meli_ads_campaign_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "advertiser_id" INTEGER NOT NULL,
    "site_id" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT,
    "strategy" TEXT,
    "budget" DOUBLE PRECISION,
    "roas_target" DOUBLE PRECISION,
    "metrics" JSONB,
    "metrics_prev" JSONB,
    "trend_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meli_ads_campaign_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meli_ads_changes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "advertiser_id" INTEGER,
    "site_id" TEXT NOT NULL,
    "recommendation_id" TEXT,
    "recommendation_title" TEXT,
    "payload" JSONB NOT NULL,
    "api_status" INTEGER NOT NULL DEFAULT 0,
    "api_ok" BOOLEAN NOT NULL DEFAULT false,
    "api_detail" JSONB,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "MeliAdsChangeOutcome" NOT NULL DEFAULT 'PENDING',
    "outcome_score" DOUBLE PRECISION,
    "outcome_summary" TEXT,
    "evaluated_at" TIMESTAMP(3),
    "evaluated_snapshot_id" TEXT,
    CONSTRAINT "meli_ads_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meli_ads_snapshots_user_id_created_at_idx" ON "meli_ads_snapshots"("user_id", "created_at" DESC);
CREATE INDEX "meli_ads_campaign_snapshots_snapshot_id_idx" ON "meli_ads_campaign_snapshots"("snapshot_id");
CREATE INDEX "meli_ads_campaign_snapshots_campaign_id_site_id_idx" ON "meli_ads_campaign_snapshots"("campaign_id", "site_id");
CREATE INDEX "meli_ads_changes_user_id_applied_at_idx" ON "meli_ads_changes"("user_id", "applied_at" DESC);
CREATE INDEX "meli_ads_changes_campaign_id_site_id_applied_at_idx" ON "meli_ads_changes"("campaign_id", "site_id", "applied_at" DESC);
CREATE INDEX "meli_ads_changes_outcome_applied_at_idx" ON "meli_ads_changes"("outcome", "applied_at" DESC);

-- AddForeignKey
ALTER TABLE "meli_ads_snapshots" ADD CONSTRAINT "meli_ads_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meli_ads_campaign_snapshots" ADD CONSTRAINT "meli_ads_campaign_snapshots_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "meli_ads_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meli_ads_changes" ADD CONSTRAINT "meli_ads_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meli_ads_changes" ADD CONSTRAINT "meli_ads_changes_evaluated_snapshot_id_fkey" FOREIGN KEY ("evaluated_snapshot_id") REFERENCES "meli_ads_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
