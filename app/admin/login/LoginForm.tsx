"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Only allow same-site, non-protocol-relative paths to prevent open redirects. */
function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) {
    return raw;
  }
  return "/admin";
}

export default function LoginForm({ siteName }: { siteName: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = safeRedirect(search.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="adm-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span className="brand">{siteName}</span>
        <span className="adm-tag">CMS</span>
      </div>
      <h1 className="adm-h1" style={{ marginTop: 14 }}>
        Sign in
      </h1>
      <p className="adm-sub" style={{ marginBottom: 22 }}>
        Admin access to the portfolio content manager.
      </p>

      <div className="adm-field">
        <label className="adm-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="adm-field">
        <label className="adm-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="adm-msg err" style={{ margin: "0 0 14px" }}>
          {error}
        </p>
      )}

      <button type="submit" className="btn" style={{ width: "100%" }} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
