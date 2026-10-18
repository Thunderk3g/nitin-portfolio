import Link from "next/link";
import { listProjects } from "@/lib/db/queries";
import { loadSiteContent } from "@/lib/content-cache";
import { cssUrl } from "@/lib/media-style";
import MoveButtons from "./_components/MoveButtons";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ProjectsListPage() {
  const [projects, content] = await Promise.all([listProjects(), loadSiteContent()]);
  const cats = content.categories.items;
  const known = new Set(cats.map((c) => c.slug));
  // Categories from site content first, then any slug a project still uses after a rename.
  const groups = [
    ...cats.map((c) => ({ slug: c.slug, title: c.title, orphan: false })),
    ...[...new Set(projects.map((p) => p.category))]
      .filter((s) => !known.has(s))
      .map((s) => ({ slug: s, title: s, orphan: true })),
  ];

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Projects</h1>
          <p className="adm-sub">The videos on the Projects page, grouped by category. Order here is the order on the site.</p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-sm">
          + New project
        </Link>
      </div>

      {groups.map((g) => {
        const list = projects.filter((p) => p.category === g.slug);
        const published = list.filter((p) => p.status === "published").length;
        return (
          <section key={g.slug}>
            <h2 className="adm-group">
              {g.title} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>· #{g.slug}</span>
            </h2>
            {g.orphan && (
              <p className="adm-hint" style={{ margin: "0 0 10px" }}>
                No category uses this slug any more, so these projects are hidden. Move them to a category or delete them.
              </p>
            )}
            {!g.orphan && published === 0 && (
              <p className="adm-hint" style={{ margin: "0 0 10px" }}>
                No published projects yet, so the site shows placeholders for this category.
              </p>
            )}
            <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
              {list.length === 0 ? (
                <div className="adm-empty">No projects in this category.</div>
              ) : (
                <div className="adm-tablewrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th>Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p, i) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span
                                className="adm-thumb"
                                style={p.posterUrl ? { backgroundImage: cssUrl(p.posterUrl) } : undefined}
                              />
                              <div>
                                <Link href={`/admin/projects/${p.id}`}>{p.title}</Link>
                                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                                  {p.role || "—"}
                                  {p.videoUrl ? "" : " · no video yet"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`adm-pill ${p.status}`}>{p.status}</span>
                          </td>
                          <td style={{ color: "var(--ink-3)" }}>{fmt(p.updatedAt)}</td>
                          <td>
                            <MoveButtons id={p.id} first={i === 0} last={i === list.length - 1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
