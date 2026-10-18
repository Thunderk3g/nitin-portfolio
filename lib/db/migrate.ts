import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  console.log("[migrate] connecting (session pooler)…");
  const sql = postgres(url, { max: 1 });
  const dbm = drizzle(sql);
  console.log("[migrate] applying migrations…");
  await migrate(dbm, { migrationsFolder: "./lib/db/migrations" });
  await sql.end();
  console.log("[migrate] done ✓");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
