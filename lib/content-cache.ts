import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getProjectsByCategory, getSiteContent } from "@/lib/db/queries";

export const SITE_CONTENT_TAG = "site-content";
export const PROJECTS_TAG = "projects";

const cachedSiteContent = unstable_cache(getSiteContent, ["site-content-v1"], {
  tags: [SITE_CONTENT_TAG],
  revalidate: 300,
});

const cachedProjectsByCategory = unstable_cache(
  async (slugsKey: string) => {
    const slugs = slugsKey ? slugsKey.split(",") : [];
    return getProjectsByCategory(slugs);
  },
  ["projects-by-category-v1"],
  {
    tags: [PROJECTS_TAG, SITE_CONTENT_TAG],
    revalidate: 300,
  },
);

/**
 * Shared across generateMetadata, layouts, and pages. Cached in the Next.js
 * Data Cache and immediately invalidated via `revalidateTag("site-content")`
 * whenever the admin CMS saves a section.
 */
export const loadSiteContent = cache(() => cachedSiteContent());

/**
 * Cached published projects per category, immediately invalidated via
 * `revalidateTag("projects")` whenever a project is created, edited, moved or deleted.
 */
export const loadProjectsByCategory = cache((slugs: string[]) =>
  cachedProjectsByCategory(slugs.join(",")),
);
