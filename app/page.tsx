import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { loadSiteContent } from "@/lib/content-cache";

// Always reflect the latest content edited from the admin CMS.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site, hero } = await loadSiteContent();
  return {
    title: site.title,
    description: site.metaDescription,
    openGraph: { title: site.title, description: hero.tagline, type: "website" },
  };
}

export default async function Page() {
  const content = await loadSiteContent();
  return <HomePage content={content} />;
}
