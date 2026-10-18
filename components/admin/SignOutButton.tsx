"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-ghost btn-xs"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
