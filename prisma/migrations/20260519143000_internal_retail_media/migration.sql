DO $$ BEGIN
  CREATE TYPE "InternalAdPlacement" AS ENUM ('HOME_LEADERBOARD', 'HOME_RECTANGLE', 'HOME_TILE', 'CATEGORY_LEADERBOARD', 'SEARCH_INLINE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InternalAdPricingModel" AS ENUM ('SOV', 'CPM', 'CPC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InternalAdEventType" AS ENUM ('IMPRESSION', 'CLICK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "internal_ad_campaigns" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "placement" "InternalAdPlacement" NOT NULL,
  "pricing_model" "InternalAdPricingModel" NOT NULL DEFAULT 'SOV',
  "share_of_voice" INTEGER,
  "banner_title" TEXT,
  "banner_subtitle" TEXT,
  "banner_image_url" TEXT,
  "destination_url" TEXT,
  "rotation_interval_seconds" INTEGER NOT NULL DEFAULT 60,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "internal_ad_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "internal_ad_campaigns_campaign_id_key" ON "internal_ad_campaigns"("campaign_id");
CREATE INDEX IF NOT EXISTS "internal_ad_campaigns_placement_is_active_idx" ON "internal_ad_campaigns"("placement", "is_active");

DO $$ BEGIN
  ALTER TABLE "internal_ad_campaigns"
    ADD CONSTRAINT "internal_ad_campaigns_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "internal_ad_events" (
  "id" TEXT NOT NULL,
  "internal_ad_campaign_id" TEXT NOT NULL,
  "event_type" "InternalAdEventType" NOT NULL,
  "slot_key" TEXT,
  "page_path" TEXT,
  "visitor_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_ad_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "internal_ad_events_internal_ad_campaign_id_event_type_idx" ON "internal_ad_events"("internal_ad_campaign_id", "event_type");
CREATE INDEX IF NOT EXISTS "internal_ad_events_page_path_created_at_idx" ON "internal_ad_events"("page_path", "created_at");

DO $$ BEGIN
  ALTER TABLE "internal_ad_events"
    ADD CONSTRAINT "internal_ad_events_internal_ad_campaign_id_fkey"
    FOREIGN KEY ("internal_ad_campaign_id") REFERENCES "internal_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
