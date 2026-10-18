import Link from "next/link";
import { getDashboardCounts } from "@/lib/db/queries";
import { SECTION_SPECS } from "@/lib/admin/content-spec";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { sections, projects, published, media } = await getDashboardCounts();
  const cards = [
    { label: `Content sections set up (of ${SECTION_SPECS.length})`, value: sections, href: "/admin/content", cta: "Edit content" },
    { label: "Projects", value: projects, href: "/admin/projects", cta: "Manage projects" },
    { label: "Published projects", value: published, href: "/admin/projects", cta: "Manage projects" },
    { label: "Media files", value: media, href: "/admin/media", cta: "Open library" },
  ];
  return (
    <div>
      <h1 className="adm-h1">Dashboard</h1>
      <p className="adm-sub">Manage the portfolio content, projects and media.</p>
      <div className="adm-cards">
        {cards.map((c) => (
          <div key={c.label} className="adm-card">
            <div className="adm-stat">{c.value}</div>
            <div className="adm-stat-label">{c.label}</div>
            <Link href={c.href} className="btn-ghost btn-xs">
              {c.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
