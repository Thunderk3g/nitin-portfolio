"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createSupabaseServerClient, getAdminUser } from "@/lib/supabase/server";
import { db, isConnectionError, withDbRetry } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { httpsDeleteMedia, httpsRecordMedia } from "@/lib/db/https-fallback";
import { listMediaAssets, toMediaDTO } from "@/lib/db/queries";
import {
  MAX_UPLOAD_BYTES,
  MEDIA_BUCKET,
  kindFromMime,
  type MediaAssetDTO,
  type MediaKind,
} from "@/lib/media/config";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Object keys this module generates: images/<uuid>.<ext> or videos/<uuid>.<ext>. */
const PATH_RE = /^(images|videos)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$/;
const LIMIT_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
};

function extFor(filename: string, mime: string): string {
  const fromName = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/)?.[1];
  if (fromName) return fromName;
  return MIME_EXT[mime] ?? ((mime.split("/")[1] ?? "").replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin");
}

function publicUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mime: z.string().trim().min(1).max(255),
  bytes: z.number().int().nonnegative(),
});

/**
 * Step 1 of an upload: validate the file and sign an upload URL for a fresh
 * object key. The browser then sends the bytes straight to Supabase Storage
 * (uploadToSignedUrl) — nothing passes through this app. Signing uses the
 * admin's own session; the storage.objects policies (lib/db/policies.ts) only
 * let allowlisted admins create objects in the bucket.
 */
export async function createUploadAction(input: {
  filename: string;
  mime: string;
  bytes: number;
}): Promise<ActionResult<{ path: string; token: string }>> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid upload request." };
  const { filename, mime, bytes } = parsed.data;

  const kind = kindFromMime(mime);
  if (!kind) return { ok: false, error: "Only images and videos can be uploaded." };
  if (bytes > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `"${filename}" is too large. The limit is ${LIMIT_MB} MB per file on the current Supabase plan.`,
    };
  }

  const path = `${kind}s/${crypto.randomUUID()}.${extFor(filename, mime)}`;
  try {
    // Ensure the bucket's per-file limit in Postgres matches MAX_UPLOAD_BYTES (150 MB).
    await withDbRetry(() =>
      db.execute(
        sql`update storage.buckets set file_size_limit = ${MAX_UPLOAD_BYTES} where id = ${MEDIA_BUCKET} and (file_size_limit is null or file_size_limit < ${MAX_UPLOAD_BYTES})`,
      ),
    ).catch(() => {});

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return { ok: false, error: `Could not start the upload: ${error?.message ?? "no signed URL"}` };
    }
    return { ok: true, data: { path: data.path, token: data.token } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start the upload." };
  }
}

/**
 * Step 2: confirm the object really landed in storage, then record it in the
 * library. Size and type come from the stored object, not the client's claim.
 * Idempotent: finalizing the same path twice returns the existing entry.
 */
export async function finalizeUploadAction(input: {
  path: string;
  filename: string;
}): Promise<ActionResult<MediaAssetDTO>> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const path = typeof input?.path === "string" ? input.path : "";
  if (!PATH_RE.test(path)) return { ok: false, error: "Invalid upload path." };
  const filename = (typeof input?.filename === "string" ? input.filename.trim() : "").slice(0, 255) || path;

  try {
    try {
      const [existing] = await withDbRetry(() =>
        db.select().from(mediaAssets).where(eq(mediaAssets.path, path)).limit(1),
      );
      if (existing) return { ok: true, data: toMediaDTO(existing) };

      const rows = await withDbRetry(() =>
        db.execute<{ metadata: { size?: number; mimetype?: string } | null }>(
          sql`select metadata from storage.objects where bucket_id = ${MEDIA_BUCKET} and name = ${path} limit 1`,
        ),
      );
      const object = rows[0];
      if (!object) return { ok: false, error: "The upload did not reach storage — please try again." };

      const mime = object.metadata?.mimetype ?? "";
      const kind: MediaKind | null = kindFromMime(mime);
      if (!kind) return { ok: false, error: "Stored file is not an image or video." };

      const [row] = await withDbRetry(() =>
        db
          .insert(mediaAssets)
          .values({
            path,
            url: publicUrl(path),
            filename,
            mime,
            bytes: Number(object.metadata?.size ?? 0),
            kind,
          })
          .onConflictDoNothing({ target: mediaAssets.path })
          .returning(),
      );
      const saved =
        row ??
        (
          await withDbRetry(() =>
            db.select().from(mediaAssets).where(eq(mediaAssets.path, path)).limit(1),
          )
        )[0];
      if (!saved) return { ok: false, error: "Could not record the upload — please retry." };

      revalidatePath("/admin/media");
      revalidatePath("/admin");
      return { ok: true, data: toMediaDTO(saved) };
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      const saved = await httpsRecordMedia({ path, filename });
      revalidatePath("/admin/media");
      revalidatePath("/admin");
      return { ok: true, data: toMediaDTO(saved) };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not finish the upload." };
  }
}

export async function listMediaAction(kind?: MediaKind): Promise<ActionResult<MediaAssetDTO[]>> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (kind !== undefined && kind !== "image" && kind !== "video") {
    return { ok: false, error: "Invalid media type." };
  }
  try {
    return { ok: true, data: await listMediaAssets(kind) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not load the library." };
  }
}

/**
 * Remove a file from storage and the library. The object is deleted through
 * the Storage API with the admin's session — Supabase blocks direct SQL
 * deletes on storage.objects.
 */
export async function deleteMediaAction(id: string): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (!UUID_RE.test(id)) return { ok: false, error: "File not found." };

  try {
    let assetPath: string | null = null;
    try {
      const [asset] = await withDbRetry(() =>
        db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1),
      );
      if (!asset) return { ok: false, error: "File not found." };
      assetPath = asset.path;

      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([assetPath]);
      if (error) return { ok: false, error: `Could not delete from storage: ${error.message}` };

      await withDbRetry(() => db.delete(mediaAssets).where(eq(mediaAssets.id, id)));
    } catch (dbErr) {
      if (!isConnectionError(dbErr)) throw dbErr;
      const removed = await httpsDeleteMedia(id);
      if (!removed) return { ok: false, error: "File not found." };
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([removed.path]);
      if (error) return { ok: false, error: `Could not delete from storage: ${error.message}` };
    }
    revalidatePath("/admin/media");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}
