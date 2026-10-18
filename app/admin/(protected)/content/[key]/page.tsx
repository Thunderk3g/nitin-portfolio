import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectionValue } from "@/lib/db/queries";
import { getSpec } from "@/lib/admin/content-spec";
import { defaultContent } from "@/lib/site-content";
import SectionEditor from "../_components/SectionEditor";

export const dynamic = "force-dynamic";

export default async function EditSectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const spec = getSpec(key);
  if (!spec) notFound();

  const fallback = (defaultContent as Record<string, unknown>)[key] ?? {};
  const row = await getSectionValue(key);
  // Defaults first so fields added after a section was saved still show their seed value.
  const initial =
    row && typeof row === "object" && !Array.isArray(row)
      ? { ...(fallback as object), ...(row as object) }
      : fallback;

  return (
    <div>
      <Link href="/admin/content" className="adm-back">
        ← Site content
      </Link>
      <h1 className="adm-h1" style={{ marginTop: 14 }}>
        {spec.label}
      </h1>
      <p className="adm-sub">{spec.description}</p>
      <SectionEditor sectionKey={key} spec={spec} initial={initial} />
    </div>
  );
}
