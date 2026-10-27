import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProjectsApp from "@/components/ProjectsApp";
import { loadProjectsByCategory, loadSiteContent } from "@/lib/content-cache";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await loadSiteContent();
  const title = `Projects | ${site.name}`;
  return {
    title,
    description: `Video editing projects by ${site.name}: short-form and reels, long-form videos, SaaS demos and cinematic content.`,
    openGraph: { title, type: "website" },
  };
}

// Runs while the HTML is parsed: hides #app for deep links until the client
// has read the hash (see ProjectsApp), so the index never flashes first.
const HASH_FLAG = "if(location.hash.length>1)document.documentElement.setAttribute('data-pj-hash','')";

export default async function ProjectsPage() {
  const content = await loadSiteContent();
  const projects = await loadProjectsByCategory(content.categories.items.map((c) => c.slug));
  return (
    <>
      <a className="skip" href="#app">
        Skip to content
      </a>
      <div className="page">
        <SiteHeader name={content.site.name} current="projects" className="page-header" />
        <main id="app">
          <script dangerouslySetInnerHTML={{ __html: HASH_FLAG }} />
          <ProjectsApp categories={content.categories} projects={projects} />
        </main>
        <SiteFooter site={content.site} current="projects" />
      </div>
    </>
  );
}
