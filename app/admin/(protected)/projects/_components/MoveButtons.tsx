"use client";

import { useState, useTransition } from "react";
import { moveProjectAction } from "../actions";

export default function MoveButtons({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const move = (dir: -1 | 1) =>
    startTransition(async () => {
      const res = await moveProjectAction(id, dir);
      if (res.ok) {
        setError(null);
      } else setError(res.error);
    });

  return (
    <div className="adm-actions" title={error ?? undefined}>
      <button type="button" className="btn-ghost btn-xs" aria-label="Move up" disabled={first || pending} onClick={() => move(-1)}>
        ↑
      </button>
      <button type="button" className="btn-ghost btn-xs" aria-label="Move down" disabled={last || pending} onClick={() => move(1)}>
        ↓
      </button>
      {error && <span className="adm-msg err">{error}</span>}
    </div>
  );
}
