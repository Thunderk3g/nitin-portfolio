import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, withDbRetry } from "./index";
import { mediaAssets, projects, siteContent, type MediaAsset, type Project } from "./schema";
import {
  httpsGetSiteContentRows,
  httpsListMedia,
  httpsListProjects,
} from "./https-fallback";
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

function mergeContentRows(rows: { key: string; value: unknown }[]): SiteContent {
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
}

/**
 * Assemble the site content from the `site_content` rows. Each stored section
 * is shallow-merged over its default (lib/site-content.ts), so a missing
 * section or a field added after the row was saved still renders. Falls back
 * to Supabase HTTPS (:443) PostgREST if TCP (:6543) is firewalled, and to
 * defaults if offline.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const rows = await withDbRetry(() => db.select().from(siteContent));
    return mergeContentRows(rows);
  } catch {
    try {
      const httpsRows = await httpsGetSiteContentRows();
      return mergeContentRows(httpsRows);
    } catch {
      return defaultContent;
    }
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
  } catch {
    try {
      const all = await httpsListProjects();
      const published = all.filter((p) => p.status === "published");
      for (const slug of slugs) {
        const list = published.filter((r) => r.category === slug).map(toCard);
        out[slug] = list.length ? list : placeholderProjects();
      }
    } catch {
      for (const slug of slugs) out[slug] = placeholderProjects();
    }
  }
  return out;
}

/* ── Admin queries (automatically fall back to HTTPS :443 when TCP :6543 is firewalled) ── */

export async function getSectionValue(key: string): Promise<unknown | null> {
  try {
    const [row] = await withDbRetry(() =>
      db
        .select({ value: siteContent.value })
        .from(siteContent)
        .where(eq(siteContent.key, key))
        .limit(1),
    );
    return row?.value ?? null;
  } catch {
    const rows = await httpsGetSiteContentRows();
    return rows.find((r) => r.key === key)?.value ?? null;
  }
}

export async function listSectionKeys(): Promise<string[]> {
  try {
    const rows = await withDbRetry(() => db.select({ key: siteContent.key }).from(siteContent));
    return rows.map((r) => r.key);
  } catch {
    const rows = await httpsGetSiteContentRows();
    return rows.map((r) => r.key);
  }
}

export async function listProjects(): Promise<Project[]> {
  try {
    return await withDbRetry(() =>
      db
        .select()
        .from(projects)
        .orderBy(asc(projects.category), asc(projects.sortOrder), asc(projects.createdAt)),
    );
  } catch {
    return httpsListProjects();
  }
}

export async function getProject(id: string): Promise<Project | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const [row] = await withDbRetry(() =>
      db.select().from(projects).where(eq(projects.id, id)).limit(1),
    );
    return row ?? null;
  } catch {
    const all = await httpsListProjects();
    return all.find((p) => p.id === id) ?? null;
  }
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
  try {
    const rows = await withDbRetry(() =>
      db
        .select()
        .from(mediaAssets)
        .where(kind ? eq(mediaAssets.kind, kind) : undefined)
        .orderBy(desc(mediaAssets.createdAt)),
    );
    return rows.map(toMediaDTO);
  } catch {
    const all = await httpsListMedia();
    const filtered = kind ? all.filter((m) => m.kind === kind) : all;
    return filtered.map(toMediaDTO);
  }
}

export async function getDashboardCounts(): Promise<{
  sections: number;
  projects: number;
  published: number;
  media: number;
}> {
  try {
    const [row] = await withDbRetry(() =>
      db.execute<{
        sections: number;
        projects: number;
        published: number;
        media: number;
      }>(sql`
        select
          (select count(*)::int from site_content) as sections,
          (select count(*)::int from projects) as projects,
          (select count(*)::int from projects where status = 'published') as published,
          (select count(*)::int from media_assets) as media
      `),
    );
    return {
      sections: Number(row?.sections ?? 0),
      projects: Number(row?.projects ?? 0),
      published: Number(row?.published ?? 0),
      media: Number(row?.media ?? 0),
    };
  } catch {
    const [secRows, projRows, mediaRows] = await Promise.all([
      httpsGetSiteContentRows(),
      httpsListProjects(),
      httpsListMedia(),
    ]);
    return {
      sections: secRows.length,
      projects: projRows.length,
      published: projRows.filter((p) => p.status === "published").length,
      media: mediaRows.length,
    };
  }
}
