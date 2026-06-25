-- Add TikTok and phone fields to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;
