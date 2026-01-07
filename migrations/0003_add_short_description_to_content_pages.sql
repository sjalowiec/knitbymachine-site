-- Add short_description column to content_pages table
-- This field is used for catalog card descriptions (required for practice-projects)

ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "short_description" text;
