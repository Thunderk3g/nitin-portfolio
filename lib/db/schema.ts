import {
  pgTable,
  pgEnum,
  text,
  jsonb,
  uuid,
  integer,
  bigint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Editable site content, stored one row per top-level section
 * (site, hero, categories, allwork, partners, cta, contact).
 * `value` holds the section's typed JSON (see lib/site-content.ts shapes).
 * The public pages assemble a SiteContent object from these rows; the admin
 * CMS edits one section at a time.
 */
export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectStatus = pgEnum("project_status", ["draft", "published"]);

/**
 * Portfolio projects, grouped on the Projects page by `category` (a category
 * slug from the `categories` site_content section) and ordered by `sortOrder`.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    role: text("role").notNull().default(""),
    videoUrl: text("video_url"),
    posterUrl: text("poster_url"),
    brief: text("brief").notNull().default(""),
    contribution: text("contribution").notNull().default(""),
    tools: text("tools").notNull().default(""),
    status: projectStatus("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_category_status_sort_idx").on(t.category, t.status, t.sortOrder)],
);

export const mediaKind = pgEnum("media_kind", ["image", "video"]);

/**
 * Media library: one row per file uploaded to the Supabase Storage `media`
 * bucket. `path` is the storage object key; `url` its public URL.
 */
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull().unique(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  bytes: bigint("bytes", { mode: "number" }).notNull().default(0),
  kind: mediaKind("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteContentRow = typeof siteContent.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
