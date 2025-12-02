-- Add group and description columns to tags table
-- Also rename 'type' column to preserve existing data as 'group'

-- First add the new columns
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "group" text NOT NULL DEFAULT 'general';
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "description" text;

-- Make name column unique (it may not be already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tags_name_unique'
  ) THEN
    ALTER TABLE "tags" ADD CONSTRAINT "tags_name_unique" UNIQUE ("name");
  END IF;
END $$;

-- Migrate any existing data from 'type' column to 'group' if 'type' exists and 'group' was just added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tags' AND column_name = 'type'
  ) THEN
    UPDATE "tags" SET "group" = "type" WHERE "type" IS NOT NULL AND "type" != 'general';
    ALTER TABLE "tags" DROP COLUMN IF EXISTS "type";
  END IF;
END $$;
