"use client";

import { useState, useTransition } from "react";
import { seedProductionAction } from "../content/actions";

export default function SeedProductionButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        id="seed-production-btn"
        className="btn-ghost btn-sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const res = await seedProductionAction();
            setMsg(res.ok ? "Seeded!" : res.error);
          });
        }}
      >
        {pending ? "Seeding showcase…" : "Load Studio Showcase Content"}
      </button>
      {msg && (
        <span id="seed-production-msg" style={{ fontSize: 12, color: "var(--accent)" }}>
          {msg}
        </span>
      )}
    </div>
  );
}
