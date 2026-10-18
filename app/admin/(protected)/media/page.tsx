import { listMediaAssets } from "@/lib/db/queries";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/media/config";
import MediaLibrary from "./_components/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const assets = await listMediaAssets();
  return (
    <div>
      <h1 className="adm-h1">Media</h1>
      <p className="adm-sub">
        Posters, photos, logos and videos stored in Supabase Storage. Up to {formatBytes(MAX_UPLOAD_BYTES)} per file.
      </p>
      <MediaLibrary assets={assets} />
    </div>
  );
}
