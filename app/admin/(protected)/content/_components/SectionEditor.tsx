"use client";

import { useState, useTransition } from "react";
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
  let control: React.ReactNode;
  if (type === "textarea") {
    control = (
      <textarea
        id={id}
        className="field-input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (type === "stringlist") {
    const arr: string[] = Array.isArray(value) ? value : [];
    control = (
      <input
        id={id}
        className="field-input"
        value={arr.join(", ")}
        placeholder="Comma-separated"
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    );
    hint = hint ?? "Separate with commas.";
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
        <input id={id} className="field-input" value={v} placeholder="#262a33" onChange={(e) => onChange(e.target.value)} />
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
      <input
        id={id}
        className="field-input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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
      f.type === "stringlist" ? [] : f.type === "select" ? f.options?.[0]?.value ?? "" : f.type === "color" ? "#262a33" : "";
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
        <div key={i} style={{ marginTop: 8, marginBottom: 22 }}>
          <div className="adm-label" style={{ fontSize: 13, marginBottom: 12 }}>
            {field.label}
          </div>
          <div className="adm-stack" style={{ gap: 14 }}>
            {list.map((item, idx) => (
              <div key={idx} className="adm-item">
                <div className="adm-item-head">
                  <span>
                    {field.itemLabel} {idx + 1}
                  </span>
                  <div className="adm-actions">
                    <button type="button" className="btn-ghost btn-xs" aria-label="Move up" onClick={() => move(idx, -1)}>
                      ↑
                    </button>
                    <button type="button" className="btn-ghost btn-xs" aria-label="Move down" onClick={() => move(idx, 1)}>
                      ↓
                    </button>
                    <button type="button" className="btn-ghost btn-xs btn-danger" onClick={() => removeItem(idx)}>
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
                    field={f}
                    value={item?.[f.key]}
                    onChange={(v) => updateItem(idx, f.key, v)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost btn-xs" style={{ marginTop: 12 }} onClick={addItem}>
            + Add {field.itemLabel.toLowerCase()}
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
