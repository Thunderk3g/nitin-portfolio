import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { MAX_UPLOAD_BYTES, MEDIA_BUCKET } from "../media/config";

/**
 * Idempotent RLS, grant and storage setup. Re-run after changing ADMIN_EMAILS.
 *
 * The Next.js app talks to Postgres as the `postgres` role (bypasses RLS), so
 * table policies do not affect server-side reads/writes. They are
 * defense-in-depth for the PostgREST Data API reachable with the publishable
 * key: Supabase's default privileges GRANT ALL on every new `public` table to
 * anon/authenticated, so we revoke that and re-grant only SELECT on the
 * world-readable content (site sections, published projects).
 *
 * Storage is different: there is no service-role key, so admin uploads and
 * deletes go through the Storage API with the admin's own session. The
 * storage.objects policies below are therefore the real authorization
 * boundary — only allowlisted emails may write to the `media` bucket.
 */

const OUR_TABLES = ["site_content", "projects", "media_assets"] as const;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** SQL text[] literal of the allowlist, single quotes escaped. Empty => '{}' (allows nobody). */
function emailArrayLiteral(emails: string[]): string {
  if (!emails.length) return "array[]::text[]";
  return `array[${emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(", ")}]::text[]`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const sql = postgres(url, { max: 1, onnotice: () => {} });

  // ── Report what else lives here; nothing outside OUR_TABLES / our bucket is touched. ──
  const tables = await sql<{ table_name: string }[]>`
    select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`;
  const foreign = tables.map((t) => t.table_name).filter((t) => !(OUR_TABLES as readonly string[]).includes(t));
  console.log(`[policies] public tables: ${tables.length} (not ours, untouched: ${foreign.join(", ") || "none"})`);
  const buckets = await sql<{ id: string }[]>`select id from storage.buckets order by 1`;
  const otherBuckets = buckets.map((b) => b.id).filter((b) => b !== MEDIA_BUCKET);
  console.log(`[policies] other storage buckets (untouched): ${otherBuckets.join(", ") || "none"}`);

  const emails = adminEmails();
  if (!emails.length) {
    console.warn("[policies] ADMIN_EMAILS is empty — storage write policies will allow NOBODY.");
  }
  const isAdmin = `lower(auth.jwt() ->> 'email') = any (${emailArrayLiteral(emails)})`;
  const inBucket = `bucket_id = '${MEDIA_BUCKET}'`;

  await sql.begin(async (tx) => {
    // ── Tables: lock down the Data API, then expose only public reads. ──
    await tx.unsafe(`
      alter table public.site_content enable row level security;
      alter table public.projects     enable row level security;
      alter table public.media_assets enable row level security;

      revoke all on public.site_content, public.projects, public.media_assets from anon, authenticated;

      drop policy if exists site_content_read on public.site_content;
      create policy site_content_read on public.site_content
        for select to anon, authenticated using (true);

      drop policy if exists projects_read_published on public.projects;
      create policy projects_read_published on public.projects
        for select to anon, authenticated using (status = 'published');

      grant usage on schema public to anon, authenticated;
      grant select on public.site_content to anon, authenticated;
      grant select on public.projects     to anon, authenticated;
      -- media_assets: RLS on, no grants, no policies. Server-only.

      -- Stop future migrations (run as postgres) from silently granting ALL on
      -- new public tables to the Data API roles.
      alter default privileges for role postgres in schema public
        revoke all on tables from anon, authenticated;
      alter default privileges for role postgres in schema public
        revoke all on sequences from anon, authenticated;
      alter default privileges for role postgres in schema public
        revoke all on functions from anon, authenticated;
    `);

    // ── Storage: public-read bucket, admin-only writes. ──
    await tx`
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (${MEDIA_BUCKET}, ${MEDIA_BUCKET}, true, ${MAX_UPLOAD_BYTES}, ${["image/*", "video/*"]})
      on conflict (id) do update
        set public = excluded.public,
            file_size_limit = excluded.file_size_limit,
            allowed_mime_types = excluded.allowed_mime_types`;

    await tx.unsafe(`
      drop policy if exists media_admin_select on storage.objects;
      create policy media_admin_select on storage.objects
        for select to authenticated using (${inBucket} and ${isAdmin});

      drop policy if exists media_admin_insert on storage.objects;
      create policy media_admin_insert on storage.objects
        for insert to authenticated with check (${inBucket} and ${isAdmin});

      drop policy if exists media_admin_update on storage.objects;
      create policy media_admin_update on storage.objects
        for update to authenticated
        using (${inBucket} and ${isAdmin}) with check (${inBucket} and ${isAdmin});

      drop policy if exists media_admin_delete on storage.objects;
      create policy media_admin_delete on storage.objects
        for delete to authenticated using (${inBucket} and ${isAdmin});
    `);
  });

  const [{ count: contentCount }] = await sql`select count(*)::int from public.site_content`;
  const [{ count: projectCount }] = await sql`select count(*)::int from public.projects`;
  const [{ count: publishedCount }] =
    await sql`select count(*)::int from public.projects where status = 'published'`;
  const [{ count: mediaCount }] = await sql`select count(*)::int from public.media_assets`;

  console.log("[policies] RLS enabled + grants applied ✓");
  console.log(`[policies] storage bucket '${MEDIA_BUCKET}' (public, ${MAX_UPLOAD_BYTES / 1024 / 1024} MB/file) + admin write policies ✓`);
  console.log(`[policies] storage admins: ${emails.length}`);
  console.log(`[policies] site_content rows: ${contentCount}`);
  console.log(`[policies] projects rows: ${projectCount} (published: ${publishedCount})`);
  console.log(`[policies] media_assets rows: ${mediaCount}`);

  await sql.end();
}

main().catch((err) => {
  console.error("[policies] failed:", err);
  process.exit(1);
});
