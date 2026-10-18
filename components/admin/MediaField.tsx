"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPT, type MediaAssetDTO, type MediaKind } from "@/lib/media/config";
import { uploadMediaFile } from "@/lib/media/upload-client";
import { listMediaAction } from "@/app/admin/(protected)/media/actions";

/**
 * Image/video reference editor. Stores the file's public URL as a plain
 * string, so the public site renders it directly. Three ways to fill it:
 * upload a file (goes straight to Supabase Storage and into the library),
 * pick from the library, or paste an external URL.
 */
export default function MediaField({
  id,
  value,
  onChange,
  accept,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  accept: MediaKind;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "finalizing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const busy = status !== "idle";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setStatus("uploading");
    const res = await uploadMediaFile(file, (s) => setStatus(s));
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) onChange(res.asset.url);
    else setError(res.error);
  }

  return (
    <div className="media-field">
      <div className="media-preview">
        {value ? (
          accept === "video" ? (
            <video src={value} muted preload="metadata"></video>
          ) : (
            <img src={value} alt="" />
          )
        ) : (
          "None"
        )}
      </div>
      <div className="media-body">
        <div className="adm-actions">
          <button type="button" className="btn-ghost btn-xs" disabled={busy} onClick={() => fileRef.current?.click()}>
            {status === "uploading" ? "Uploading…" : status === "finalizing" ? "Finishing…" : `Upload ${accept}`}
          </button>
          <button type="button" className="btn-ghost btn-xs" disabled={busy} onClick={() => setPicking(true)}>
            Choose from library
          </button>
          {value && (
            <button type="button" className="btn-ghost btn-xs" disabled={busy} onClick={() => onChange("")}>
              Clear
            </button>
          )}
        </div>
        <input
          id={id}
          className="field-input"
          value={value}
          placeholder="…or paste a URL (https://…)"
          onChange={(e) => {
            setError(null);
            onChange(e.target.value.trim());
          }}
        />
        {error && <p className="adm-msg err" style={{ margin: 0 }}>{error}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT[accept]}
        hidden
        aria-label={`Upload ${accept} file`}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {picking && (
        <MediaPicker
          kind={accept}
          selected={value}
          onPick={(url) => {
            onChange(url);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function MediaPicker({
  kind,
  selected,
  onPick,
  onClose,
}: {
  kind: MediaKind;
  selected: string;
  onPick: (url: string) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<MediaAssetDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setAssets(null);
    setError(null);
    const res = await listMediaAction(kind);
    if (res.ok) setAssets(res.data);
    else {
      setAssets([]);
      setError(res.error);
    }
  }

  useEffect(() => {
    void load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="adm-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Choose ${kind === "video" ? "a video" : "an image"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="adm-modal-panel">
        <div className="adm-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="adm-h1" style={{ fontSize: 20 }}>
              Choose {kind === "video" ? "a video" : "an image"}
            </h2>
            <p className="adm-sub" style={{ margin: 0 }}>
              From the media library, newest first.
            </p>
          </div>
          <div className="adm-actions">
            <button type="button" className="btn-ghost btn-xs" onClick={() => void load()}>
              Refresh
            </button>
            <button type="button" className="btn-ghost btn-xs" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        {error && <p className="adm-msg err">{error}</p>}
        {assets === null ? (
          <p className="adm-sub">Loading library…</p>
        ) : assets.length === 0 ? (
          <p className="adm-sub">No {kind}s yet. Use “Upload {kind}” or the Media page.</p>
        ) : (
          <div className="media-grid">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                className={"media-pick" + (a.url === selected ? " selected" : "")}
                title={a.filename}
                onClick={() => onPick(a.url)}
              >
                <div className="media-tile-media">
                  {a.kind === "video" ? (
                    <video src={a.url} muted preload="metadata"></video>
                  ) : (
                    <img src={a.url} alt="" loading="lazy" />
                  )}
                </div>
                <span>{a.filename}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
