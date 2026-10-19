"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown inside the admin shell when a page fails to load, usually because the
 * database didn't answer in time. Retry refetches the page from the server.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="adm-card">
      <h1 className="adm-h1">This page didn&apos;t load</h1>
      <p className="adm-sub" style={{ margin: "8px 0 18px" }}>
        The content database didn&apos;t respond in time. Nothing was changed. Try again in a
        moment.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      >
        Try again
      </button>
    </div>
  );
}
