import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createUploadAction,
  finalizeUploadAction,
} from "@/app/admin/(protected)/media/actions";
import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, formatBytes, kindFromMime, type MediaAssetDTO } from "./config";

export type UploadResult = { ok: true; asset: MediaAssetDTO } | { ok: false; error: string };

/**
 * Upload one file to the media library from the browser:
 *   1. createUploadAction  — server validates + signs an upload URL (admin only)
 *   2. uploadToSignedUrl   — bytes go straight to Supabase Storage
 *   3. finalizeUploadAction — server confirms the object and records it
 */
export async function uploadMediaFile(
  file: File,
  onStatus?: (s: "uploading" | "finalizing") => void,
): Promise<UploadResult> {
  const mime = file.type || "application/octet-stream";
  if (!kindFromMime(mime)) {
    return { ok: false, error: `"${file.name}" is not an image or video.` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)} per file — compress it or host it elsewhere and paste the URL.`,
    };
  }

  try {
    onStatus?.("uploading");
    const signed = await createUploadAction({ filename: file.name, mime, bytes: file.size });
    if (!signed.ok) return signed;

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .uploadToSignedUrl(signed.data.path, signed.data.token, file, { contentType: mime });
    if (error) return { ok: false, error: `Upload failed: ${error.message}` };

    onStatus?.("finalizing");
    const done = await finalizeUploadAction({ path: signed.data.path, filename: file.name });
    if (!done.ok) return done;
    return { ok: true, asset: done.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed — network error." };
  }
}
