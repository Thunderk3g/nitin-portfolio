"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getAdminUser } from "@/lib/supabase/server";
import { db, isConnectionError, withDbRetry } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import {
  httpsCreateProject,
  httpsDeleteProject,
  httpsMoveProject,
  httpsUpdateProject,
} from "@/lib/db/https-fallback";
import { PROJECTS_TAG } from "@/lib/content-cache";

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
  revalidateTag(PROJECTS_TAG);
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/projects/${id}`);
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
    let row: { id: string } | undefined;
    try {
      [row] = await withDbRetry(() =>
        db
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
            sortOrder: sql<number>`coalesce((select max(p2.sort_order) + 1 from projects p2 where p2.category = ${v.category}), 0)`,
          })
          .returning({ id: projects.id }),
      );
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      row = await httpsCreateProject({
        title: v.title,
        category: v.category,
        role: v.role,
        videoUrl: v.videoUrl || null,
        posterUrl: v.posterUrl || null,
        brief: v.brief,
        contribution: v.contribution,
        tools: v.tools,
        status: v.status,
      });
    }
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
    let ok = false;
    try {
      const [updated] = await withDbRetry(() =>
        db
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
            sortOrder: sql<number>`case when ${projects.category} = ${v.category} then ${projects.sortOrder} else coalesce((select max(p2.sort_order) + 1 from projects p2 where p2.category = ${v.category}), 0) end`,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, id))
          .returning({ id: projects.id }),
      );
      ok = !!updated;
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      ok = await httpsUpdateProject(id, {
        title: v.title,
        category: v.category,
        role: v.role,
        videoUrl: v.videoUrl || null,
        posterUrl: v.posterUrl || null,
        brief: v.brief,
        contribution: v.contribution,
        tools: v.tools,
        status: v.status,
      });
    }

    if (!ok) return { ok: false, error: "Project not found." };

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
    let ok = false;
    try {
      const [row] = await withDbRetry(() =>
        db
          .delete(projects)
          .where(eq(projects.id, id))
          .returning({ id: projects.id }),
      );
      ok = !!row;
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      ok = await httpsDeleteProject(id);
    }
    if (!ok) return { ok: false, error: "Project not found." };
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
    let moved: boolean | null = false;
    try {
      moved = await withDbRetry(() =>
        db.transaction(async (tx) => {
          const siblings = await tx
            .select({ id: projects.id, sortOrder: projects.sortOrder })
            .from(projects)
            .where(
              sql`${projects.category} = (select p2.category from projects p2 where p2.id = ${id} limit 1)`,
            )
            .orderBy(asc(projects.sortOrder), asc(projects.createdAt))
            .for("update");

          if (!siblings.length) return null;

          const order = siblings.map((s) => s.id);
          const idx = order.indexOf(id);
          if (idx === -1) return null;

          const target = idx + dir;
          if (target >= 0 && target < order.length) {
            [order[idx], order[target]] = [order[target], order[idx]];
          }

          const changed: { id: string; nextOrder: number }[] = [];
          for (const [i, sid] of order.entries()) {
            const before = siblings.find((s) => s.id === sid)?.sortOrder;
            if (before !== i) changed.push({ id: sid, nextOrder: i });
          }

          if (changed.length > 0) {
            const cases = sql.join(
              changed.map((c) => sql`when ${projects.id} = ${c.id} then ${c.nextOrder}::int`),
              sql` `,
            );
            await tx
              .update(projects)
              .set({ sortOrder: sql`case ${cases} else ${projects.sortOrder} end` })
              .where(
                inArray(
                  projects.id,
                  changed.map((c) => c.id),
                ),
              );
          }
          return true;
        }),
      );
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      moved = await httpsMoveProject(id, dir);
    }
    if (!moved) return { ok: false, error: "Project not found." };

    revalidateProjects();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reorder failed." };
  }
}
