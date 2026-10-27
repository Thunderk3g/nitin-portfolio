"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/supabase/server";
import { db, isConnectionError, withDbRetry } from "@/lib/db";
import { mediaAssets, projects, siteContent } from "@/lib/db/schema";
import {
  httpsCreateProject,
  httpsDeleteProject,
  httpsListProjects,
  httpsRecordMedia,
  httpsSaveSection,
} from "@/lib/db/https-fallback";
import { SECTION_SPECS } from "@/lib/admin/content-spec";
import { SECTION_KEYS } from "@/lib/site-content";
import {
  PRODUCTION_PROJECTS,
  PRODUCTION_SITE_CONTENT,
  SEED_MEDIA_FILES,
} from "@/lib/seed-data";
import { PROJECTS_TAG, SITE_CONTENT_TAG } from "@/lib/content-cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

const VALID_KEYS = new Set(SECTION_SPECS.map((s) => s.key));
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Category slugs group projects and appear in URLs, so they must be valid and unique. */
function checkCategories(value: Record<string, unknown>): string | null {
  const items = value.items;
  if (!Array.isArray(items)) return "Categories must be a list.";
  const seen = new Set<string>();
  for (const [i, item] of items.entries()) {
    const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
    if (!SLUG_RE.test(slug)) {
      return `Category ${i + 1}: slug "${slug}" must be lowercase words separated by hyphens (e.g. short-form).`;
    }
    if (seen.has(slug)) return `Category slug "${slug}" is used more than once.`;
    seen.add(slug);
  }
  return null;
}

/** Persist one site section. Auth is re-checked here — server actions are
 *  publicly reachable endpoints, so we never rely on the page guard alone. */
export async function saveSectionAction(
  key: string,
  value: unknown,
): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };

  if (!VALID_KEYS.has(key)) {
    return { ok: false, error: "Unknown section." };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Invalid content shape." };
  }
  if (key === "categories") {
    const problem = checkCategories(value as Record<string, unknown>);
    if (problem) return { ok: false, error: problem };
  }

  try {
    try {
      await withDbRetry(() =>
        db
          .insert(siteContent)
          .values({ key, value })
          .onConflictDoUpdate({
            target: siteContent.key,
            set: { value, updatedAt: new Date() },
          }),
      );
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      await httpsSaveSection(key, value);
    }

    revalidateTag(SITE_CONTENT_TAG);
    if (key === "categories") revalidateTag(PROJECTS_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${key}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}

/** Seed all 8 site_content sections, 12 curated projects, and 18 Nano Banana media assets. */
export async function seedProductionAction(): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };

  try {
    try {
      await withDbRetry(async () => {
        for (const key of SECTION_KEYS) {
          const val = PRODUCTION_SITE_CONTENT[key];
          await db
            .insert(siteContent)
            .values({ key, value: val })
            .onConflictDoUpdate({
              target: siteContent.key,
              set: { value: val, updatedAt: new Date() },
            });
        }

        const existingProjects = await db.select().from(projects);
        for (const p of existingProjects) {
          await db.delete(projects).where(eq(projects.id, p.id));
        }
        for (const item of PRODUCTION_PROJECTS) {
          await db.insert(projects).values({
            category: item.category,
            title: item.title,
            role: item.role,
            videoUrl: item.videoUrl,
            posterUrl: item.posterUrl,
            brief: item.brief,
            contribution: item.contribution,
            tools: item.tools,
            status: item.status,
            sortOrder: item.sortOrder,
          });
        }

        for (const m of SEED_MEDIA_FILES) {
          await db
            .insert(mediaAssets)
            .values({
              path: m.path,
              url: m.url,
              filename: m.filename,
              mime: "image/jpeg",
              bytes: m.bytes,
              kind: "image",
            })
            .onConflictDoUpdate({
              target: mediaAssets.path,
              set: {
                url: m.url,
                filename: m.filename,
                mime: "image/jpeg",
                bytes: m.bytes,
              },
            });
        }
      });
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      for (const key of SECTION_KEYS) {
        await httpsSaveSection(key, PRODUCTION_SITE_CONTENT[key]);
      }
      const existing = await httpsListProjects();
      for (const p of existing) {
        await httpsDeleteProject(p.id);
      }
      for (const item of PRODUCTION_PROJECTS) {
        await httpsCreateProject(item);
      }
      for (const m of SEED_MEDIA_FILES) {
        await httpsRecordMedia({
          path: m.path,
          filename: m.filename,
          mime: "image/jpeg",
          bytes: m.bytes,
        });
      }
    }

    revalidateTag(SITE_CONTENT_TAG);
    revalidateTag(PROJECTS_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/projects");
    revalidatePath("/contact");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Seed failed." };
  }
}
