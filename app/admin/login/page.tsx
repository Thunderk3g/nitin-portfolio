import { Suspense } from "react";
import { loadSiteContent } from "@/lib/content-cache";
import { missingAdminEnv } from "@/lib/supabase/env";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const { site } = await loadSiteContent();
  const missing = missingAdminEnv();

  if (missing.length) {
    return (
      <div className="adm-login">
        <div className="adm-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="brand">{site.name}</span>
            <span className="adm-tag">CMS</span>
          </div>
          <h1 className="adm-h1" style={{ marginTop: 14 }}>
            CMS not configured
          </h1>
          <p className="adm-sub" style={{ marginBottom: 14 }}>
            This deployment is missing these environment variables:
          </p>
          <ul className="adm-sub" style={{ margin: "0 0 14px", paddingLeft: 18 }}>
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <p className="adm-sub">
            Add them in Vercel under Project Settings, Environment Variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-login">
      <Suspense fallback={null}>
        <LoginForm siteName={site.name} />
      </Suspense>
    </div>
  );
}
