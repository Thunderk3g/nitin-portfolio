import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { siteContent } from "./schema";
import { defaultContent, SECTION_KEYS } from "../site-content";

/**
 * Seeds every site_content section from the prototype defaults. Existing rows
 * are left untouched, so re-running never overwrites content edited in the CMS.
 * Projects are deliberately not seeded: a category with no published projects
 * shows the prototype's placeholders until real work is added.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  console.log("[seed] writing site_content sections…");
  for (const key of SECTION_KEYS) {
    const inserted = await db
      .insert(siteContent)
      .values({ key, value: defaultContent[key] })
      .onConflictDoNothing({ target: siteContent.key })
      .returning({ key: siteContent.key });
    console.log(`[seed]   ${key}: ${inserted.length ? "inserted" : "kept existing"}`);
  }

  await sql.end();
  console.log("[seed] done ✓");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
