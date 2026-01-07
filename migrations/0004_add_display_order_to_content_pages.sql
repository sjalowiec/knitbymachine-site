-- Add display_order column to content_pages table
-- This field controls the order practice projects appear in listings
-- Nullable: existing rows get NULL, treated as sorting to the end

ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "display_order" integer;
