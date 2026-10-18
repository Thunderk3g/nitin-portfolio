import { Suspense } from "react";
import { loadSiteContent } from "@/lib/content-cache";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const { site } = await loadSiteContent();
  return (
    <div className="adm-login">
      <Suspense fallback={null}>
        <LoginForm siteName={site.name} />
      </Suspense>
    </div>
  );
}
