import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, withDbRetry } from "./index";
import { mediaAssets, projects, siteContent, type MediaAsset, type Project } from "./schema";
import {
  defaultContent,
  placeholderProjects,
  SECTION_KEYS,
  type ProjectCard,
  type SiteContent,
} from "../site-content";
import type { MediaAssetDTO, MediaKind } from "../media/config";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Assemble the site content from the `site_content` rows. Each stored section
 * is shallow-merged over its default (lib/site-content.ts), so a missing
 * section or a field added after the row was saved still renders. Falls back
 * to the defaults entirely if the DB is unreachable — the public site never
 * breaks on a content/DB issue.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const rows = await withDbRetry(() => db.select().from(siteContent));
    if (!rows.length) return defaultContent;
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const out = {} as Record<string, unknown>;
    for (const key of SECTION_KEYS) {
      const stored = map.get(key);
      out[key] = isPlainObject(stored)
        ? { ...defaultContent[key], ...stored }
        : defaultContent[key];
    }
    return out as SiteContent;
  } catch (err) {
    console.error("[queries] getSiteContent fell back to defaults:", err);
    return defaultContent;
  }
}

function toCard(p: Project): ProjectCard {
  return {
    id: p.id,
    title: p.title,
    role: p.role,
    video: p.videoUrl ?? "",
    poster: p.posterUrl ?? "",
    brief: p.brief,
    contribution: p.contribution,
    tools: p.tools,
  };
}

/**
 * Published projects per category slug, in display order. A category with no
 * published projects yet shows the prototype placeholders; so does every
 * category if the DB is unreachable.
 */
export async function getProjectsByCategory(
  slugs: string[],
): Promise<Record<string, ProjectCard[]>> {
  const out: Record<string, ProjectCard[]> = {};
  try {
    const rows = slugs.length
      ? await withDbRetry(() =>
          db
            .select()
            .from(projects)
            .where(and(eq(projects.status, "published"), inArray(projects.category, slugs)))
            .orderBy(asc(projects.sortOrder), asc(projects.createdAt)),
        )
      : [];
    for (const slug of slugs) {
      const list = rows.filter((r) => r.category === slug).map(toCard);
      out[slug] = list.length ? list : placeholderProjects();
    }
  } catch (err) {
    console.error("[queries] getProjectsByCategory fell back to placeholders:", err);
    for (const slug of slugs) out[slug] = placeholderProjects();
  }
  return out;
}

/* ── Admin queries (may throw; admin pages surface the error) ── */

export async function getSectionValue(key: string): Promise<unknown | null> {
  const [row] = await withDbRetry(() =>
    db
      .select({ value: siteContent.value })
      .from(siteContent)
      .where(eq(siteContent.key, key))
      .limit(1),
  );
  return row?.value ?? null;
}

export async function listSectionKeys(): Promise<string[]> {
  const rows = await withDbRetry(() => db.select({ key: siteContent.key }).from(siteContent));
  return rows.map((r) => r.key);
}

export async function listProjects(): Promise<Project[]> {
  return withDbRetry(() =>
    db
      .select()
      .from(projects)
      .orderBy(asc(projects.category), asc(projects.sortOrder), asc(projects.createdAt)),
  );
}

export async function getProject(id: string): Promise<Project | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await withDbRetry(() =>
    db.select().from(projects).where(eq(projects.id, id)).limit(1),
  );
  return row ?? null;
}

export function toMediaDTO(a: MediaAsset): MediaAssetDTO {
  return {
    id: a.id,
    url: a.url,
    path: a.path,
    filename: a.filename,
    mime: a.mime,
    bytes: a.bytes,
    kind: a.kind,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listMediaAssets(kind?: MediaKind): Promise<MediaAssetDTO[]> {
  const rows = await withDbRetry(() =>
    db
      .select()
      .from(mediaAssets)
      .where(kind ? eq(mediaAssets.kind, kind) : undefined)
      .orderBy(desc(mediaAssets.createdAt)),
  );
  return rows.map(toMediaDTO);
}

export async function getDashboardCounts(): Promise<{
  sections: number;
  projects: number;
  published: number;
  media: number;
}> {
  try {
    const count = sql<number>`count(*)::int`;
    const [[c], [p], [pub], [m]] = await withDbRetry(() =>
      Promise.all([
        db.select({ n: count }).from(siteContent),
        db.select({ n: count }).from(projects),
        db.select({ n: count }).from(projects).where(eq(projects.status, "published")),
        db.select({ n: count }).from(mediaAssets),
      ]),
    );
    return {
      sections: c?.n ?? 0,
      projects: p?.n ?? 0,
      published: pub?.n ?? 0,
      media: m?.n ?? 0,
    };
  } catch {
    return { sections: 0, projects: 0, published: 0, media: 0 };
  }
}
