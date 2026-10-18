/**
 * Admin authorization allowlist.
 *
 * Authentication (a valid Supabase session) is NOT sufficient for admin access:
 * Supabase email signups are enabled by default, so any visitor could register.
 * Only users whose email is in ADMIN_EMAILS (comma-separated env var) are admins.
 * Fails closed — an empty/unset allowlist authorizes nobody.
 *
 * This module is intentionally dependency-free (no next/headers, no server-only)
 * so it is safe to import from Edge middleware as well as server components.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
