import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { missingAdminEnv } from "@/lib/supabase/env";
import { loadSiteContent } from "@/lib/content-cache";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (missingAdminEnv().length) redirect("/admin/login");
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");
  const { site } = await loadSiteContent();
  return (
    <AdminShell userEmail={user.email ?? "admin"} siteName={site.name}>
      {children}
    </AdminShell>
  );
}
