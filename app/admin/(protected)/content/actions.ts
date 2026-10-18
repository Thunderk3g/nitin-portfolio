"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { SECTION_SPECS } from "@/lib/admin/content-spec";

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
    await db
      .insert(siteContent)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { value, updatedAt: new Date() },
      });

    // Every public page renders shared content (name, footer links), so
    // revalidate the whole tree.
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${key}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}
