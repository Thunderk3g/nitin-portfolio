CREATE TYPE "public"."media_kind" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" bigint DEFAULT 0 NOT NULL,
	"kind" "media_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"video_url" text,
	"poster_url" text,
	"brief" text DEFAULT '' NOT NULL,
	"contribution" text DEFAULT '' NOT NULL,
	"tools" text DEFAULT '' NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "projects_category_status_sort_idx" ON "projects" USING btree ("category","status","sort_order");