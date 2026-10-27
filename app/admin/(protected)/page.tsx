import Link from "next/link";
import { getDashboardCounts } from "@/lib/db/queries";
import { SECTION_SPECS } from "@/lib/admin/content-spec";
import SeedProductionButton from "./_components/SeedProductionButton";

export const dynamic = "force-dynamic";

const VISUAL_MAP = [
  {
    step: "01",
    title: "Top Bar, Your Name & Contact Info",
    where: "Header bar, browser tab title, email & LinkedIn",
    href: "/admin/content/site",
    cta: "Edit Info",
  },
  {
    step: "02",
    title: "Hero Stage, Portrait Photo & Bio",
    where: "Top of Home page · Portrait brush reveal + About text",
    href: "/admin/content/hero",
    cta: "Edit Hero & Bio",
  },
  {
    step: "03",
    title: "Selected Work (4 Video Categories)",
    where: "Home page 3D morph monitor + Projects page tabs",
    href: "/admin/content/categories",
    cta: "Edit Categories",
  },
  {
    step: "04 & 05",
    title: "NLE Timeline Strip & 2.39:1 Widescreen Featured Cuts",
    where: "Middle of Home page · Horizontal filmstrip + 3 big widescreen cards",
    href: "/admin/content/allwork",
    cta: "Edit Timeline & Featured",
  },
  {
    step: "06",
    title: "Before / After Colour Grade Slider",
    where: "Home page · Interactive RAW Log vs Final Grade wipe",
    href: "/admin/content/craft",
    cta: "Edit Before / After",
  },
  {
    step: "07",
    title: "All Video Projects & Cinema Lightbox Player",
    where: "/projects page · Upload videos, thumbnails, roles & briefs",
    href: "/admin/projects",
    cta: "Manage Videos",
  },
  {
    step: "08A",
    title: "Trusted Partners & Client Logos",
    where: "Bottom of Home page · Monogram & logo bento grid",
    href: "/admin/content/partners",
    cta: "Edit Partners",
  },
  {
    step: "08B",
    title: "Closing Call-to-Action & Contact Page",
    where: "Bottom of Home page + /contact page",
    href: "/admin/content/cta",
    cta: "Edit Closing CTA",
  },
];

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
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Dashboard</h1>
          <p className="adm-sub">
            Welcome! Pick any section below to update text, swap photos, or upload new videos. Changes go live immediately.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/admin/projects/new" className="btn btn-sm">
            + Upload new video project
          </Link>
          <SeedProductionButton />
          <Link href="/" target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
            View live website ↗
          </Link>
        </div>
      </div>

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

      <div style={{ marginTop: 32 }}>
        <h2 className="adm-group" style={{ fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
          Visual Website Map · Click any section to edit
        </h2>
        <p className="adm-sub" style={{ marginBottom: 16 }}>
          Ordered from top to bottom exactly as visitors scroll down your website.
        </p>
        <div className="adm-list">
          {VISUAL_MAP.map((item) => (
            <Link key={item.step} href={item.href} className="adm-card adm-row">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 54,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "rgba(255, 59, 48, 0.12)",
                    border: "1px solid rgba(255, 59, 48, 0.3)",
                    color: "#ff6b60",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  {item.step}
                </span>
                <div>
                  <div className="adm-row-title">{item.title}</div>
                  <div className="adm-row-desc">{item.where}</div>
                </div>
              </div>
              <span className="adm-pill published">{item.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
