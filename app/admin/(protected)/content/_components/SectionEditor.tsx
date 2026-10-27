"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Field, ItemField, SectionSpec } from "@/lib/admin/content-spec";
import MediaField from "@/components/admin/MediaField";
import { saveSectionAction } from "../actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setByPath(obj: any, path: string, v: any): any {
  const keys = path.split(".");
  const root = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur: any = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const child = cur[k];
    cur[k] = Array.isArray(child) ? [...child] : { ...(child ?? {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = v;
  return root;
}

const HEX = /^#[0-9a-f]{6}$/i;

const QUICK_LINKS = [
  { label: "Short-Form", href: "/projects#short-form" },
  { label: "Long-Form", href: "/projects#long-form" },
  { label: "SaaS & Tech", href: "/projects#saas" },
  { label: "Cinematic", href: "/projects#cinematic" },
  { label: "All Projects", href: "/projects" },
  { label: "Contact Page", href: "/contact" },
];

function StringListControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const arr = Array.isArray(value) ? value : [];
  const [raw, setRaw] = useState(() => arr.join(", "));

  const commit = (text: string) => {
    setRaw(text);
    onChange(
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  };

  const removeTag = (idx: number) => {
    const next = arr.filter((_, i) => i !== idx);
    setRaw(next.join(", "));
    onChange(next);
  };

  return (
    <div>
      <input
        id={id}
        className="field-input"
        value={raw}
        placeholder="e.g. Commercials, SaaS Launches, Short-form, Colour & Sound"
        onChange={(e) => commit(e.target.value)}
      />
      {arr.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {arr.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--ink)",
              }}
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => removeTag(idx)}
                style={{
                  background: "none",
                  border: 0,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** One labelled input of any supported type. */
function FieldInput({
  id,
  label,
  type,
  value,
  onChange,
  hint,
  placeholder,
  field,
}: {
  id: string;
  label: string;
  type: ItemField["type"];
  value: any;
  onChange: (v: any) => void;
  hint?: string;
  placeholder?: string;
  field?: ItemField;
}) {
  const isHrefField = field?.key === "href";
  let control: React.ReactNode;
  if (type === "textarea") {
    control = (
      <textarea
        id={id}
        className="field-input"
        value={value ?? ""}
        placeholder={placeholder ?? field?.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (type === "stringlist") {
    const arr: string[] = Array.isArray(value) ? value : [];
    control = <StringListControl id={id} value={arr} onChange={onChange} />;
    hint = hint ?? "Separate items with commas.";
  } else if (type === "media") {
    control = (
      <MediaField id={id} value={value ?? ""} onChange={onChange} accept={field?.accept ?? "image"} />
    );
  } else if (type === "color") {
    const v = typeof value === "string" ? value : "";
    control = (
      <div className="field-color">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX.test(v) ? v : "#262a33"}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          id={id}
          className="field-input"
          value={v}
          placeholder="#262a33"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  } else if (type === "select") {
    control = (
      <select id={id} className="field-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {(field?.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <div>
        <input
          id={id}
          className="field-input"
          value={value ?? ""}
          placeholder={placeholder ?? field?.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {isHrefField && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)", marginRight: 2 }}>Quick pick:</span>
            {QUICK_LINKS.map((q) => {
              const active = value === q.href;
              return (
                <button
                  key={q.href}
                  type="button"
                  onClick={() => onChange(q.href)}
                  className="btn-ghost btn-xs"
                  style={{
                    padding: "4px 9px",
                    fontSize: 11,
                    borderColor: active ? "var(--accent)" : undefined,
                    color: active ? "var(--ink)" : undefined,
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
      </label>
      {control}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function blankItem(fields: ItemField[]) {
  const blank: any = {};
  fields.forEach((f) => {
    blank[f.key] =
      f.type === "stringlist"
        ? []
        : f.type === "select"
          ? f.options?.[0]?.value ?? ""
          : f.type === "color"
            ? "#262a33"
            : "";
  });
  return blank;
}

export default function SectionEditor({
  sectionKey,
  spec,
  initial,
}: {
  sectionKey: string;
  spec: SectionSpec;
  initial: any;
}) {
  const [value, setValue] = useState<any>(initial ?? {});
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (path: string, v: any) => {
    setValue((prev: any) => setByPath(prev, path, v));
    setMsg(null);
  };

  // List edits derive from the latest state (prev), not a stale render snapshot,
  // so rapid edits/reorders never discard a concurrent change.
  const updateList = (path: string, updater: (list: any[]) => any[]) => {
    setValue((prev: any) => setByPath(prev, path, updater(getByPath(prev, path) ?? [])));
    setMsg(null);
  };

  function renderField(field: Field, i: number) {
    const id = `f-${field.path.replace(/\./g, "-")}`;
    if (field.kind === "list") {
      const list: any[] = getByPath(value, field.path) ?? [];
      const updateItem = (idx: number, key: string, v: any) =>
        updateList(field.path, (lst) => lst.map((it, j) => (j === idx ? { ...it, [key]: v } : it)));
      const addItem = () => updateList(field.path, (lst) => [...lst, blankItem(field.itemFields)]);
      const removeItem = (idx: number) => updateList(field.path, (lst) => lst.filter((_, j) => j !== idx));
      const move = (idx: number, dir: -1 | 1) =>
        updateList(field.path, (lst) => {
          const j = idx + dir;
          if (j < 0 || j >= lst.length) return lst;
          const next = [...lst];
          [next[idx], next[j]] = [next[j], next[idx]];
          return next;
        });
      return (
        <div key={i} style={{ marginTop: 12, marginBottom: 24 }}>
          <div className="adm-label" style={{ fontSize: 14, marginBottom: 12, color: "var(--ink)" }}>
            {field.label} ({list.length})
          </div>
          <div className="adm-stack" style={{ gap: 14 }}>
            {list.map((item, idx) => {
              const summary = item?.title || item?.name || item?.code || "";
              return (
                <div key={idx} className="adm-item">
                  <div className="adm-item-head">
                    <span>
                      {field.itemLabel} #{idx + 1}
                      {summary ? ` · ${summary}` : ""}
                    </span>
                    <div className="adm-actions">
                      <button
                        type="button"
                        className="btn-ghost btn-xs"
                        aria-label="Move up"
                        disabled={idx === 0}
                        onClick={() => move(idx, -1)}
                      >
                        ↑ Move up
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-xs"
                        aria-label="Move down"
                        disabled={idx === list.length - 1}
                        onClick={() => move(idx, 1)}
                      >
                        ↓ Move down
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-xs btn-danger"
                        onClick={() => removeItem(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {field.itemFields.map((f) => (
                    <FieldInput
                      key={f.key}
                      id={`${id}-${idx}-${f.key}`}
                      label={f.label}
                      type={f.type}
                      hint={f.hint}
                      placeholder={f.placeholder}
                      field={f}
                      value={item?.[f.key]}
                      onChange={(v) => updateItem(idx, f.key, v)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <button type="button" className="btn-ghost btn-xs" style={{ marginTop: 12 }} onClick={addItem}>
            + Add another {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }

    if (field.kind === "stringlist") {
      return (
        <FieldInput
          key={i}
          id={id}
          label={field.label}
          type="stringlist"
          hint={field.hint}
          value={getByPath(value, field.path) ?? []}
          onChange={(v) => update(field.path, v)}
        />
      );
    }

    if (field.kind === "media") {
      return (
        <FieldInput
          key={i}
          id={id}
          label={field.label}
          type="media"
          hint={field.hint}
          field={{ key: field.path, label: field.label, type: "media", accept: field.accept }}
          value={getByPath(value, field.path)}
          onChange={(v) => update(field.path, v)}
        />
      );
    }

    return (
      <FieldInput
        key={i}
        id={id}
        label={field.label}
        type={field.kind}
        hint={field.hint}
        placeholder={field.placeholder}
        value={getByPath(value, field.path)}
        onChange={(v) => update(field.path, v)}
      />
    );
  }

  function save() {
    startTransition(async () => {
      const res = await saveSectionAction(sectionKey, value);
      if (res.ok) {
        setMsg({ ok: true, text: "Saved. The live site is updated." });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div>
      <div
        className="adm-card"
        style={{
          marginBottom: 14,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
          Tip: Edit any text or image below, then click <strong>Save changes</strong> at the bottom. Your website updates immediately.
        </span>
        {spec.liveUrl && (
          <Link href={spec.liveUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-xs">
            Preview on live site ↗
          </Link>
        )}
      </div>

      <div className="adm-card">{spec.fields.map((f, i) => renderField(f, i))}</div>
      <div className="adm-savebar">
        <button className="btn btn-sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className={"adm-msg " + (msg.ok ? "ok" : "err")}>{msg.text}</span>}
      </div>
    </div>
  );
}
