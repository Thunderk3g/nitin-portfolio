# nitin-portfolio

Nitin Wagh: video editing portfolio. A Next.js (App Router + TypeScript) build of the approved
prototype in `prototype/` (see `HANDOFF.md`), with a content management system at `/admin`,
built the same way as the Vinika CMS: Supabase Auth + an email allowlist, Postgres via Drizzle,
and a spec-driven section editor. Media uploads go to Supabase Storage.

## Stack
- Next.js 15 (App Router) · React 19 · TypeScript
- Supabase: Auth (admin login), Postgres (content), Storage (posters, photos, videos)
- Drizzle ORM + drizzle-kit migrations, `postgres` driver
- Playwright for end-to-end tests

## Develop

```bash
npm install
cp .env.example .env.local   # fill in Supabase values (already done locally)
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

First-time database setup (idempotent, safe to re-run):

```bash
npm run db:migrate     # create tables
npm run db:seed        # write the prototype copy into site_content (never overwrites edits)
npm run db:policies    # RLS, Data API grants, the "media" storage bucket and its admin-only policies
npm run admin:create   # create/confirm the ADMIN_EMAIL login; generates ADMIN_PASSWORD into .env.local if unset
```

After changing the schema in `lib/db/schema.ts`: `npm run db:generate` then `npm run db:migrate`.
After changing `ADMIN_EMAILS`: re-run `npm run db:policies` (the storage policies embed the list).

## CMS (`/admin`)
Sign in at `/admin/login`. Only emails listed in `ADMIN_EMAILS` get in; a valid Supabase login
alone is not enough, and an empty list lets nobody in.

- **Site Content**: every section of the site (general/contact details, hero and About, project
  categories, work reel and featured panels, partners, closing CTA, contact page). One row per
  section in `site_content`; the editor is driven by `lib/admin/content-spec.ts`. Missing sections
  or fields fall back to `lib/site-content.ts`, so the site never breaks on a DB issue.
- **Projects**: the videos on the Projects page, grouped by category slug, with draft/published
  status and ordering. A category with no published projects shows the prototype placeholders.
- **Media**: upload images and videos (up to 50 MB each, the Supabase free-plan limit), copy URLs,
  delete. Every image/video field in the editors can also upload directly, pick from the library,
  or take a pasted URL.

Saves publish immediately (pages are rendered per request).

## Structure
- `app/` public pages (`/`, `/projects`, `/contact`) and `app/admin/` (CMS)
- `components/` site components (`Hero.tsx` holds the ink-reveal name and portrait reveal)
- `components/admin/` CMS shell, nav and the shared `MediaField`
- `lib/site-content.ts` content types and defaults · `lib/admin/content-spec.ts` editor specs
- `lib/db/` schema, queries, migrations, seed and policy scripts · `lib/supabase/` auth clients
- `lib/media/` upload settings and the browser upload helper
- `prototype/` the original static HTML prototype (open `prototype/index.html`)

## Tests
`npm test` builds, starts the app on port 4173 and runs `tests/` on desktop (1440x900) and
Pixel 7. `tests/admin.spec.js` signs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
and edits live content, so it restores everything it changes.
