"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getAdminUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "" (none), an http(s) URL, or a site path such as /assets/poster.jpg. */
const mediaUrl = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^https?:\/\/\S+$/i.test(v) || (v.startsWith("/") && !v.startsWith("//")),
      `${label} must be an http(s) URL or a site path starting with /`,
    )
    .optional()
    .default("");

const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Pick a category"),
  role: z.string().trim().optional().default(""),
  videoUrl: mediaUrl("Video"),
  posterUrl: mediaUrl("Poster"),
  brief: z.string().trim().optional().default(""),
  contribution: z.string().trim().optional().default(""),
  tools: z.string().trim().optional().default(""),
  status: z.enum(["draft", "published"]),
});

export type ProjectFormInput = z.input<typeof projectSchema>;

function revalidateProjects(id?: string) {
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/projects/${id}`);
}

/** Next free position at the end of a category. */
async function nextSortOrder(category: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${projects.sortOrder}), -1)::int` })
    .from(projects)
    .where(eq(projects.category, category));
  return (row?.max ?? -1) + 1;
}

export async function createProjectAction(
  input: ProjectFormInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  try {
    const [row] = await db
      .insert(projects)
      .values({
        title: v.title,
        category: v.category,
        role: v.role,
        videoUrl: v.videoUrl || null,
        posterUrl: v.posterUrl || null,
        brief: v.brief,
        contribution: v.contribution,
        tools: v.tools,
        status: v.status,
        sortOrder: await nextSortOrder(v.category),
      })
      .returning({ id: projects.id });
    if (!row) return { ok: false, error: "Insert returned no row — please retry." };

    revalidateProjects(row.id);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed." };
  }
}

export async function updateProjectAction(
  id: string,
  input: ProjectFormInput,
): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Project not found." };

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  try {
    const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!existing) return { ok: false, error: "Project not found." };

    // Moving to another category appends it to the end of that category.
    const sortOrder =
      existing.category === v.category ? existing.sortOrder : await nextSortOrder(v.category);

    await db
      .update(projects)
      .set({
        title: v.title,
        category: v.category,
        role: v.role,
        videoUrl: v.videoUrl || null,
        posterUrl: v.posterUrl || null,
        brief: v.brief,
        contribution: v.contribution,
        tools: v.tools,
        status: v.status,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));

    revalidateProjects(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Project not found." };
  try {
    const [row] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (!row) return { ok: false, error: "Project not found." };
    revalidateProjects(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}

/**
 * Swap a project with its neighbour in the same category. The category is
 * renumbered 0..n-1 first so duplicate/gapped sort orders can't break the swap.
 */
export async function moveProjectAction(id: string, dir: -1 | 1): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Project not found." };
  if (dir !== -1 && dir !== 1) return { ok: false, error: "Invalid direction." };

  try {
    const moved = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ category: projects.category })
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);
      if (!current) return null;

      const siblings = await tx
        .select({ id: projects.id, sortOrder: projects.sortOrder })
        .from(projects)
        .where(eq(projects.category, current.category))
        .orderBy(asc(projects.sortOrder), asc(projects.createdAt))
        .for("update");

      const order = siblings.map((s) => s.id);
      const idx = order.indexOf(id);
      const target = idx + dir;
      if (target >= 0 && target < order.length) {
        [order[idx], order[target]] = [order[target], order[idx]];
      }

      for (const [i, sid] of order.entries()) {
        const before = siblings.find((s) => s.id === sid)?.sortOrder;
        if (before !== i) {
          await tx.update(projects).set({ sortOrder: i }).where(eq(projects.id, sid));
        }
      }
      return true;
    });
    if (!moved) return { ok: false, error: "Project not found." };

    revalidateProjects();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reorder failed." };
  }
}
