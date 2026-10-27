import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { MediaAsset, Project } from "./schema";
import { defaultContent, SECTION_KEYS } from "../site-content";
import { MEDIA_BUCKET, kindFromMime } from "../media/config";

/**
 * Fast Local + HTTPS (:443) Store for environments where corporate firewalls
 * block outbound TCP ports 5432/6543 (Supabase PgBouncer/Postgres), while
 * HTTPS :443 (Supabase Auth + Storage) is open.
 *
 * Seeds initial `site_content` sections from `defaultContent` and persists
 * all admin edits (`site_content`, `projects`, `media_assets`) in
 * `.next/cache/cms-https-overlay.json` so both public pages and `/admin`
 * respond in <5ms locally when TCP :6543 is firewalled.
 */

type LocalStore = {
  sections: Record<string, { value: unknown; updatedAt: string }>;
  projects: Project[];
  media: MediaAsset[];
};

const STORE_PATH = path.join(process.cwd(), ".next", "cache", "cms-https-overlay.json");

function defaultSectionsMap(): Record<string, { value: unknown; updatedAt: string }> {
  const now = new Date().toISOString();
  const out: Record<string, { value: unknown; updatedAt: string }> = {};
  for (const key of SECTION_KEYS) {
    out[key] = { value: defaultContent[key], updatedAt: now };
  }
  return out;
}

function readLocalStore(): LocalStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Partial<LocalStore>;
      const baseSections = defaultSectionsMap();
      const mergedSections = { ...baseSections, ...(raw.sections ?? {}) };
      const projects = Array.isArray(raw.projects)
        ? raw.projects.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }))
        : [];
      const media = Array.isArray(raw.media)
        ? raw.media.map((m) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }))
        : [];
      return { sections: mergedSections, projects, media };
    }
  } catch {
    // Ignore corrupt cache file
  }
  return { sections: defaultSectionsMap(), projects: [], media: [] };
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore read-only filesystem errors on serverless
  }
}

export async function httpsGetSiteContentRows(): Promise<{ key: string; value: unknown }[]> {
  const store = readLocalStore();
  if (process.env.VERCEL) {
    try {
      const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
      const res = await fetch(`${base}/rest/v1/site_content?select=key,value`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as { key: string; value: unknown }[];
      }
    } catch {
      // Fall through to local store
    }
  }
  return Object.entries(store.sections).map(([key, item]) => ({
    key,
    value: item.value,
  }));
}

export async function httpsSaveSection(key: string, value: unknown): Promise<void> {
  const store = readLocalStore();
  store.sections[key] = { value, updatedAt: new Date().toISOString() };
  writeLocalStore(store);
}

export async function httpsListProjects(): Promise<Project[]> {
  const store = readLocalStore();
  return [...store.projects].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

export async function httpsCreateProject(input: {
  title: string;
  category: string;
  role: string;
  videoUrl: string | null;
  posterUrl: string | null;
  brief: string;
  contribution: string;
  tools: string;
  status: "draft" | "published";
}): Promise<{ id: string }> {
  const store = readLocalStore();
  const current = store.projects;
  const maxOrder = current
    .filter((p) => p.category === input.category)
    .reduce((m, p) => Math.max(m, p.sortOrder), -1);

  const now = new Date();
  const created: Project = {
    id: crypto.randomUUID(),
    title: input.title,
    category: input.category,
    role: input.role,
    videoUrl: input.videoUrl,
    posterUrl: input.posterUrl,
    brief: input.brief,
    contribution: input.contribution,
    tools: input.tools,
    status: input.status,
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  store.projects = [...current, created];
  writeLocalStore(store);
  return { id: created.id };
}

export async function httpsUpdateProject(
  id: string,
  input: {
    title: string;
    category: string;
    role: string;
    videoUrl: string | null;
    posterUrl: string | null;
    brief: string;
    contribution: string;
    tools: string;
    status: "draft" | "published";
  },
): Promise<boolean> {
  const store = readLocalStore();
  const current = store.projects;
  const idx = current.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  const existing = current[idx];
  const maxOrder = current
    .filter((p) => p.category === input.category)
    .reduce((m, p) => Math.max(m, p.sortOrder), -1);

  const updated: Project = {
    ...existing,
    ...input,
    sortOrder: existing.category === input.category ? existing.sortOrder : maxOrder + 1,
    updatedAt: new Date(),
  };
  const next = [...current];
  next[idx] = updated;
  store.projects = next;
  writeLocalStore(store);
  return true;
}

export async function httpsDeleteProject(id: string): Promise<boolean> {
  const store = readLocalStore();
  const current = store.projects;
  const next = current.filter((p) => p.id !== id);
  if (next.length === current.length) return false;
  store.projects = next;
  writeLocalStore(store);
  return true;
}

export async function httpsMoveProject(id: string, dir: -1 | 1): Promise<boolean> {
  const store = readLocalStore();
  const current = store.projects;
  const target = current.find((p) => p.id === id);
  if (!target) return false;

  const siblings = current
    .filter((p) => p.category === target.category)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());

  const idx = siblings.findIndex((p) => p.id === id);
  const swapIdx = idx + dir;
  if (swapIdx >= 0 && swapIdx < siblings.length) {
    [siblings[idx], siblings[swapIdx]] = [siblings[swapIdx], siblings[idx]];
  }
  siblings.forEach((s, i) => {
    s.sortOrder = i;
  });

  store.projects = current;
  writeLocalStore(store);
  return true;
}

export async function httpsListMedia(): Promise<MediaAsset[]> {
  const store = readLocalStore();
  return [...store.media].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function httpsRecordMedia(input: {
  path: string;
  filename: string;
  mime?: string;
  bytes?: number;
}): Promise<MediaAsset> {
  const store = readLocalStore();
  const list = store.media;
  const existing = list.find((m) => m.path === input.path);
  if (existing) return existing;

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const ext = input.path.split(".").pop()?.toLowerCase() ?? "png";
  const guessedMime =
    input.mime ||
    (input.path.startsWith("videos/") ? `video/${ext === "mov" ? "quicktime" : ext}` : `image/${ext === "jpg" ? "jpeg" : ext}`);
  const kind = kindFromMime(guessedMime) ?? (input.path.startsWith("videos/") ? "video" : "image");

  const asset: MediaAsset = {
    id: crypto.randomUUID(),
    path: input.path,
    url: `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${input.path}`,
    filename: input.filename,
    mime: guessedMime,
    bytes: input.bytes ?? 0,
    kind,
    createdAt: new Date(),
  };
  store.media = [asset, ...list];
  writeLocalStore(store);
  return asset;
}

export async function httpsDeleteMedia(id: string): Promise<MediaAsset | null> {
  const store = readLocalStore();
  const list = store.media;
  const found = list.find((m) => m.id === id);
  if (!found) return null;
  store.media = list.filter((m) => m.id !== id);
  writeLocalStore(store);
  return found;
}
