import { config } from "dotenv";
config({ path: ".env.local" });

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { isAdminEmail } from "../lib/admin-allowlist";

/**
 * Provision (or confirm) the Supabase Auth admin user for the CMS.
 *
 *   npm run admin:create
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD from .env.local. If ADMIN_PASSWORD is not
 * set, a strong one is generated and appended to .env.local (never printed).
 *
 * Talks to the GoTrue REST API directly (no supabase-js, so no Node WebSocket
 * dependency): signs the user up, then sets email_confirmed_at directly in
 * Postgres so the account can sign in without an email round-trip, and finally
 * verifies the password via the token endpoint.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  let password = process.env.ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!email) throw new Error("Set ADMIN_EMAIL in .env.local");
  if (!url || !key || !dbUrl) throw new Error("Missing Supabase env vars");

  if (!isAdminEmail(email)) {
    console.warn(
      `[admin] ⚠ ${email} is not in ADMIN_EMAILS — the account will exist but cannot open /admin.`,
    );
  }

  if (!password) {
    password = crypto.randomBytes(18).toString("base64url");
    const envFile = path.resolve(".env.local");
    const existing = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
    const sep = existing.length && !existing.endsWith("\n") ? "\n" : "";
    fs.appendFileSync(envFile, `${sep}ADMIN_PASSWORD=${password}\n`);
    console.log("[admin] password saved to .env.local (ADMIN_PASSWORD)");
  }

  const headers = { apikey: key, "Content-Type": "application/json" };

  console.log(`[admin] signing up ${email}…`);
  const signupRes = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (!signupRes.ok) {
    const text = await signupRes.text();
    if (/already|registered|exists/i.test(text)) {
      console.log("[admin] user already exists — confirming email only.");
    } else {
      throw new Error(`Sign-up failed (${signupRes.status}): ${text}`);
    }
  }

  // Confirm the email directly so the account can log in immediately. With
  // email-enumeration protection on, a repeat sign-up returns a fake success
  // and creates nothing; the existing row is confirmed here all the same.
  const sql = postgres(dbUrl, { max: 1 });
  const rows = await sql`
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now())
     where lower(email) = lower(${email})
     returning id
  `;
  await sql.end();
  if (rows.length === 0) {
    throw new Error("User row not found after sign-up — check Supabase Auth settings.");
  }
  console.log("[admin] email confirmed ✓");

  // Verify the credentials actually work via the password grant.
  const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  const tokenBody = await tokenRes.json();
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(
      `Sign-in verification failed (${tokenRes.status}): ${tokenBody.msg ?? tokenBody.error_description ?? tokenBody.error ?? "unknown error"}. ` +
        "If this account already existed, ADMIN_PASSWORD does not match its password — reset it from the Supabase dashboard (Authentication → Users) and update .env.local.",
    );
  }

  console.log("\n[admin] ✅ admin ready — log in at /admin/login");
  console.log(`[admin]    email: ${email}`);
  console.log("[admin]    password: ADMIN_PASSWORD in .env.local");
}

main().catch((err) => {
  console.error("[admin] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
