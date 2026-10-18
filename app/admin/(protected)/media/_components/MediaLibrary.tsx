"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBytes, type MediaAssetDTO } from "@/lib/media/config";
import { uploadMediaFile } from "@/lib/media/upload-client";
import { deleteMediaAction } from "../actions";

type FileState = {
  name: string;
  status: "queued" | "uploading" | "finalizing" | "done" | "error";
  error?: string;
};

const STATUS_LABEL: Record<FileState["status"], string> = {
  queued: "Queued",
  uploading: "Uploading…",
  finalizing: "Finishing…",
  done: "Done",
  error: "Failed",
};

export default function MediaLibrary({ assets }: { assets: MediaAssetDTO[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileState[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleFiles(list: FileList) {
    const selected = Array.from(list);
    if (!selected.length) return;
    setFiles(selected.map((f) => ({ name: f.name, status: "queued" })));
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < selected.length; i++) {
      const setStatus = (status: FileState["status"], err?: string) =>
        setFiles((prev) => prev.map((f, j) => (j === i ? { ...f, status, error: err } : f)));
      setStatus("uploading");
      const res = await uploadMediaFile(selected[i], (s) => setStatus(s));
      if (res.ok) {
        ok++;
        setStatus("done");
      } else setStatus("error", res.error);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (ok) router.refresh();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      window.prompt("Copy this URL:", url);
    }
  }

  async function remove(a: MediaAssetDTO) {
    if (!confirm(`Delete “${a.filename}”? Anything still pointing at its URL will show a broken image or video.`)) return;
    setDeleting(a.id);
    setError(null);
    const res = await deleteMediaAction(a.id);
    setDeleting(null);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  const shown = filter === "all" ? assets : assets.filter((a) => a.kind === filter);

  return (
    <div>
      <div className="adm-card" style={{ marginBottom: 20 }}>
        <div className="adm-head" style={{ marginBottom: 0 }}>
          <div className="adm-actions">
            {(["all", "image", "video"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className="btn-ghost btn-xs"
                aria-pressed={filter === k}
                style={filter === k ? { borderColor: "var(--accent-text)", color: "var(--accent-text)" } : undefined}
                onClick={() => setFilter(k)}
              >
                {k === "all" ? `All (${assets.length})` : k === "image" ? "Images" : "Videos"}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading…" : "Upload files"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          hidden
          aria-label="Upload media files"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
          }}
        />
        {files.length > 0 && (
          <ul className="adm-uploads">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span>{f.name}</span>
                <span className={f.status === "error" ? "adm-msg err" : f.status === "done" ? "adm-msg ok" : "adm-hint"} style={{ margin: 0 }}>
                  {f.status === "error" ? f.error ?? "Failed" : STATUS_LABEL[f.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="adm-msg err">{error}</p>}

      {shown.length === 0 ? (
        <div className="adm-card adm-empty">No files yet. Upload posters, photos, logos or videos above.</div>
      ) : (
        <div className="media-grid">
          {shown.map((a) => (
            <div key={a.id} className="media-tile">
              <div className="media-tile-media">
                {a.kind === "video" ? (
                  <video src={a.url} controls preload="metadata"></video>
                ) : (
                  <img src={a.url} alt="" loading="lazy" />
                )}
              </div>
              <div className="media-tile-body">
                <div className="media-tile-name" title={a.filename}>
                  {a.filename}
                </div>
                <div className="adm-hint" style={{ margin: 0 }}>
                  {a.kind} · {formatBytes(a.bytes)}
                </div>
                <div className="adm-actions">
                  <button type="button" className="btn-ghost btn-xs" onClick={() => void copy(a.url)}>
                    {copied === a.url ? "Copied" : "Copy URL"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-xs btn-danger"
                    disabled={deleting === a.id}
                    onClick={() => void remove(a)}
                  >
                    {deleting === a.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
