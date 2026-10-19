/**
 * Settings the CMS needs on a deployment. Each one is read through a static
 * `process.env.NAME` reference so Next.js wires it up in Edge middleware too.
 * Only the names are ever reported, never the values.
 *
 * Dependency-free so it is safe to import from middleware and server code.
 */
export function missingAdminEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  if (!process.env.POOL_DATABASE_URL && !process.env.DATABASE_URL) {
    missing.push("POOL_DATABASE_URL");
  }
  if (!process.env.ADMIN_EMAILS?.trim()) missing.push("ADMIN_EMAILS");
  return missing;
}
