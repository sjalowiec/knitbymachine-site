CREATE TABLE "ana_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" varchar,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_member_only" boolean DEFAULT false NOT NULL,
	"video_url" text,
	"image_url" text,
	"image_alt" text,
	"wizard_url" text,
	"meta_title" text,
	"meta_description" text,
	"schema_markup" jsonb,
	"related_anas" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"related_workshops" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"body" text NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"pending_publish" boolean DEFAULT false NOT NULL,
	"published_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ana_entries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" varchar,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"author" text NOT NULL,
	"image_url" text,
	"image_alt" text,
	"meta_title" text,
	"meta_description" text,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glossary_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"abbreviation" text,
	"description" text NOT NULL,
	"tooltip" text,
	"example" text,
	"categories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"letter" text NOT NULL,
	"image_filename" text,
	"image_alt" text,
	"gif_filename" text,
	"video_url" text,
	"is_member_only" boolean DEFAULT false NOT NULL,
	"schema_markup" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"slug" text NOT NULL,
	"ana_id" text,
	"workshop_id" text,
	"promo_text" text,
	"related_terms" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"pending_publish" boolean DEFAULT false NOT NULL,
	"published_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_entries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wizards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"hero" text,
	"description" text NOT NULL,
	"category_id" varchar,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"video_url" text,
	"access_level" text DEFAULT 'free' NOT NULL,
	"price" text,
	"related_anas" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"related_workshops" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"image_url" text,
	"image_alt" text,
	"icon_url" text,
	"meta_title" text,
	"meta_description" text,
	"schema_markup" jsonb,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wizards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" varchar,
	"description" text NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"duration" text,
	"level" text,
	"materials" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_member_only" boolean DEFAULT false NOT NULL,
	"video_url" text,
	"image_url" text,
	"image_alt" text,
	"meta_title" text,
	"meta_description" text,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workshops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");