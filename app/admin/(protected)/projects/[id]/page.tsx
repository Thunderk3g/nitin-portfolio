import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/db/queries";
import { loadSiteContent } from "@/lib/content-cache";
import ProjectForm from "../_components/ProjectForm";
import type { ProjectFormInput } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, content] = await Promise.all([getProject(id), loadSiteContent()]);
  if (!project) notFound();

  const options = content.categories.items.map((c) => ({ slug: c.slug, title: c.title, orientation: c.orientation }));
  const initial: ProjectFormInput = {
    title: project.title,
    category: project.category,
    role: project.role,
    videoUrl: project.videoUrl ?? "",
    posterUrl: project.posterUrl ?? "",
    brief: project.brief,
    contribution: project.contribution,
    tools: project.tools,
    status: project.status,
  };

  return (
    <div>
      <Link href="/admin/projects" className="adm-back">
        ← Projects
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "14px 0 20px" }}>
        <h1 className="adm-h1" style={{ margin: 0 }}>
          Edit project
        </h1>
        <span className={`adm-pill ${project.status}`}>{project.status}</span>
        {project.status === "published" && (
          <a href={`/projects#${project.category}`} target="_blank" rel="noopener noreferrer" className="adm-back">
            View live ↗
          </a>
        )}
      </div>
      <ProjectForm mode="edit" projectId={project.id} initial={initial} categories={options} />
    </div>
  );
}
