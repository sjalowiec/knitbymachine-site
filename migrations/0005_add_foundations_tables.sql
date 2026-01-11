-- Migration: Add foundations tables for block-based content editor
-- This adds foundations (top-level), foundation_sections (pages), and foundation_section_videos (multi-video linking)

-- Create foundations table
CREATE TABLE IF NOT EXISTS "foundations" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "summary" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "machine_tags" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create foundation_sections table
CREATE TABLE IF NOT EXISTS "foundation_sections" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "foundation_id" VARCHAR NOT NULL REFERENCES "foundations"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "content_blocks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create foundation_section_videos join table for multi-video linking
CREATE TABLE IF NOT EXISTS "foundation_section_videos" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "section_id" VARCHAR NOT NULL REFERENCES "foundation_sections"("id") ON DELETE CASCADE,
  "video_id" VARCHAR NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "label" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_foundation_sections_foundation_id" ON "foundation_sections"("foundation_id");
CREATE INDEX IF NOT EXISTS "idx_foundation_section_videos_section_id" ON "foundation_section_videos"("section_id");
CREATE INDEX IF NOT EXISTS "idx_foundation_section_videos_video_id" ON "foundation_section_videos"("video_id");

-- Create unique constraint to prevent duplicate video links on same section
CREATE UNIQUE INDEX IF NOT EXISTS "idx_foundation_section_videos_unique" ON "foundation_section_videos"("section_id", "video_id");
