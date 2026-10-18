/**
 * Media library settings shared by the admin UI (client) and the server
 * actions. Dependency-free so it is safe to import anywhere.
 */

/** Public Supabase Storage bucket that holds uploaded posters, photos and videos. */
export const MEDIA_BUCKET = "media";

/**
 * Per-file cap. 50 MB is the Supabase free-plan global upload limit; raise it
 * here (and on the bucket via `npm run db:policies`) after upgrading the plan.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type MediaKind = "image" | "video";

/** `accept` attribute values for file inputs. */
export const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/*",
};

export function kindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

/** A library entry as the admin UI sees it (serializable across server actions). */
export type MediaAssetDTO = {
  id: string;
  url: string;
  path: string;
  filename: string;
  mime: string;
  bytes: number;
  kind: MediaKind;
  createdAt: string;
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
