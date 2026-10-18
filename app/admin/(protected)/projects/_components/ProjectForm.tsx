"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MediaField from "@/components/admin/MediaField";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  type ProjectFormInput,
} from "../actions";

export type CategoryOption = { slug: string; title: string; orientation: string };

export default function ProjectForm({
  mode,
  projectId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  projectId?: string;
  initial: ProjectFormInput;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [form, setForm] = useState<ProjectFormInput>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof ProjectFormInput>(k: K, v: ProjectFormInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setMsg(null);
  };

  const cat = categories.find((c) => c.slug === form.category);
  const knownCategory = !!cat || !form.category;

  function save() {
    startTransition(async () => {
      const res = mode === "create" ? await createProjectAction(form) : await updateProjectAction(projectId!, form);
      if (res.ok) {
        if (mode === "create" && "data" in res && res.data) {
          router.push(`/admin/projects/${res.data.id}`);
        } else {
          setMsg({ ok: true, text: "Saved." });
          router.refresh();
        }
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  function remove() {
    if (!projectId) return;
    if (!confirm("Delete this project permanently? Its media stays in the library.")) return;
    startDelete(async () => {
      const res = await deleteProjectAction(projectId);
      if (res.ok) router.push("/admin/projects");
      else setMsg({ ok: false, text: res.error });
    });
  }

  const labeled = (id: string, label: string, node: React.ReactNode, hint?: string) => (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
      </label>
      {node}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );

  return (
    <div className="adm-grid2">
      <div className="adm-card">
        {labeled(
          "p-title",
          "Title",
          <input id="p-title" className="field-input" value={form.title} onChange={(e) => set("title", e.target.value)} />,
        )}
        {labeled(
          "p-role",
          "Role",
          <input
            id="p-role"
            className="field-input"
            value={form.role ?? ""}
            placeholder="Editor, colourist…"
            onChange={(e) => set("role", e.target.value)}
          />,
          "Shown under the title as “Format · Role”.",
        )}
        {labeled(
          "p-video",
          "Video",
          <MediaField id="p-video" accept="video" value={form.videoUrl ?? ""} onChange={(v) => set("videoUrl", v)} />,
          "Plays in the player only after the visitor clicks the poster.",
        )}
        {labeled(
          "p-poster",
          "Poster image",
          <MediaField id="p-poster" accept="image" value={form.posterUrl ?? ""} onChange={(v) => set("posterUrl", v)} />,
          cat ? `Use a ${cat.orientation === "vertical" ? "9:16 vertical" : "16:9 landscape"} image to match the category.` : undefined,
        )}
        {labeled(
          "p-brief",
          "Brief",
          <textarea id="p-brief" className="field-input" value={form.brief ?? ""} onChange={(e) => set("brief", e.target.value)} />,
        )}
        {labeled(
          "p-contribution",
          "My contribution",
          <textarea
            id="p-contribution"
            className="field-input"
            value={form.contribution ?? ""}
            onChange={(e) => set("contribution", e.target.value)}
          />,
        )}
        {labeled(
          "p-tools",
          "Tools",
          <input
            id="p-tools"
            className="field-input"
            value={form.tools ?? ""}
            placeholder="Premiere Pro, After Effects, DaVinci Resolve"
            onChange={(e) => set("tools", e.target.value)}
          />,
        )}
      </div>

      <aside className="adm-aside">
        <div className="adm-card">
          {labeled(
            "p-status",
            "Status",
            <select
              id="p-status"
              className="field-input"
              value={form.status}
              onChange={(e) => set("status", e.target.value as "draft" | "published")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>,
            "Only published projects appear on the site.",
          )}
          {labeled(
            "p-category",
            "Category",
            <select id="p-category" className="field-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="" disabled>
                Pick a category
              </option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
              {!knownCategory && <option value={form.category}>{form.category} (no longer a category)</option>}
            </select>,
          )}
        </div>

        <div className="adm-card adm-stack">
          <button className="btn btn-sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
          </button>
          {mode === "edit" && (
            <button className="btn-ghost btn-sm btn-danger" onClick={remove} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          )}
          {msg && <span className={"adm-msg " + (msg.ok ? "ok" : "err")}>{msg.text}</span>}
        </div>
      </aside>
    </div>
  );
}
