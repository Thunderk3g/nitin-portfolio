import Link from "next/link";
import { loadSiteContent } from "@/lib/content-cache";
import ProjectForm from "../_components/ProjectForm";
import type { ProjectFormInput } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { categories } = await loadSiteContent();
  const options = categories.items.map((c) => ({ slug: c.slug, title: c.title, orientation: c.orientation }));
  const empty: ProjectFormInput = {
    title: "",
    category: options.some((c) => c.slug === category) ? category! : options[0]?.slug ?? "",
    role: "",
    videoUrl: "",
    posterUrl: "",
    brief: "",
    contribution: "",
    tools: "",
    status: "draft",
  };

  return (
    <div>
      <Link href="/admin/projects" className="adm-back">
        ← Projects
      </Link>
      <h1 className="adm-h1" style={{ margin: "14px 0 20px" }}>
        New project
      </h1>
      <ProjectForm mode="create" initial={empty} categories={options} />
    </div>
  );
}
