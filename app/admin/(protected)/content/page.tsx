import Link from "next/link";
import { listSectionKeys } from "@/lib/db/queries";
import { SECTION_SPECS } from "@/lib/admin/content-spec";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const present = new Set(await listSectionKeys());

  return (
    <div>
      <h1 className="adm-h1">Site content</h1>
      <p className="adm-sub">Edit each section of the site. Changes publish to the live site immediately.</p>
      <div className="adm-list">
        {SECTION_SPECS.map((spec) => (
          <Link key={spec.key} href={`/admin/content/${spec.key}`} className="adm-card adm-row">
            <div>
              <div className="adm-row-title">{spec.label}</div>
              <div className="adm-row-desc">{spec.description}</div>
            </div>
            <span className={"adm-pill" + (present.has(spec.key) ? " published" : "")}>
              {present.has(spec.key) ? "Edit →" : "Set up →"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
