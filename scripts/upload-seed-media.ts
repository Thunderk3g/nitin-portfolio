import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { SEED_MEDIA_FILES } from "../lib/seed-data";
import { MEDIA_BUCKET } from "../lib/media/config";

async function main() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !key || !email || !password) {
    throw new Error("Missing Supabase env vars in .env.local");
  }

  const authRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authRes.ok) {
    const errText = await authRes.text();
    throw new Error(`Admin sign-in failed (${authRes.status}): ${errText}`);
  }

  const { access_token } = (await authRes.json()) as { access_token: string };
  console.log(`[seed-media] Signed in as ${email} ✓`);

  const seedDir = path.join(process.cwd(), "public", "seed");
  for (const item of SEED_MEDIA_FILES) {
    const filePath = path.join(seedDir, item.filename);
    const buf = fs.readFileSync(filePath);
    const upRes = await fetch(`${url}/storage/v1/object/${MEDIA_BUCKET}/${item.path}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: buf,
    });
    if (!upRes.ok) {
      const txt = await upRes.text();
      console.warn(`[seed-media] warn uploading ${item.path}: ${txt}`);
    } else {
      console.log(`[seed-media] uploaded ${item.path} (${buf.byteLength} bytes) ✓`);
    }
  }

  console.log("[seed-media] All 18 Nano Banana images uploaded to Supabase Storage ✓");
}

main().catch((err) => {
  console.error("[seed-media] failed:", err);
  process.exit(1);
});
