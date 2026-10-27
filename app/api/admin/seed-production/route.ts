import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { db, isConnectionError, withDbRetry } from "@/lib/db";
import { mediaAssets, projects, siteContent } from "@/lib/db/schema";
import {
  httpsCreateProject,
  httpsDeleteProject,
  httpsListProjects,
  httpsRecordMedia,
  httpsSaveSection,
} from "@/lib/db/https-fallback";
import { SECTION_KEYS } from "@/lib/site-content";
import {
  PRODUCTION_PROJECTS,
  PRODUCTION_SITE_CONTENT,
  SEED_MEDIA_FILES,
} from "@/lib/seed-data";
import { PROJECTS_TAG, SITE_CONTENT_TAG } from "@/lib/content-cache";
import { MEDIA_BUCKET } from "@/lib/media/config";

async function authorizeRequest(req: Request): Promise<boolean> {
  const cookieAdmin = await getAdminUser();
  if (cookieAdmin) return true;

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    const apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    if (base && apikey && token) {
      const res = await fetch(`${base}/auth/v1/user`, {
        headers: { apikey, Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const user = (await res.json()) as { email?: string };
        if (user.email && isAdminEmail(user.email)) return true;
      }
    }
  }
  return false;
}

export async function POST(req: Request) {
  const allowed = await authorizeRequest(req);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }

  const supabaseBase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  let mode: "postgres" | "https-fallback" = "postgres";

  try {
    try {
      await withDbRetry(async () => {
        // 1. Upsert all 8 site_content sections
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

        // 2. Replace existing projects with the 12 curated production projects
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

        // 3. Upsert all 18 Nano Banana media assets into media_assets
        for (const m of SEED_MEDIA_FILES) {
          const publicUrl = supabaseBase
            ? `${supabaseBase}/storage/v1/object/public/${MEDIA_BUCKET}/${m.path}`
            : m.url;
          await db
            .insert(mediaAssets)
            .values({
              path: m.path,
              url: publicUrl,
              filename: m.filename,
              mime: "image/jpeg",
              bytes: m.bytes,
              kind: "image",
            })
            .onConflictDoUpdate({
              target: mediaAssets.path,
              set: {
                url: publicUrl,
                filename: m.filename,
                mime: "image/jpeg",
                bytes: m.bytes,
              },
            });
        }
      });
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      mode = "https-fallback";
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

    return NextResponse.json({
      ok: true,
      mode,
      sectionsSeeded: SECTION_KEYS.length,
      projectsSeeded: PRODUCTION_PROJECTS.length,
      mediaSeeded: SEED_MEDIA_FILES.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}
