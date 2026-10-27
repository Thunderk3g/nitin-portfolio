"use client";

import { useRef, useState } from "react";
import type { Category } from "@/lib/site-content";
import { mediaStyle } from "@/lib/media-style";
import { Arrow } from "./icons";

const CATEGORY_SPECS: Record<string, { ratio: "9:16" | "16:9"; spec: string; fps: string; codec: string }> = {
  "short-form": {
    ratio: "9:16",
    spec: "9:16 VERTICAL · 60FPS",
    fps: "60 FPS",
    codec: "PRORES 422 · SOCIAL CUT",
  },
  "long-form": {
    ratio: "16:9",
    spec: "16:9 WIDESCREEN · 24FPS",
    fps: "24 FPS",
    codec: "NARRATIVE · DOCU ARC",
  },
  saas: {
    ratio: "16:9",
    spec: "16:9 MOTION · 60FPS",
    fps: "60 FPS",
    codec: "UI KINETICS · LAUNCH FILM",
  },
  cinematic: {
    ratio: "16:9",
    spec: "2.39:1 SCOPE · 24FPS",
    fps: "24 FPS",
    codec: "RAW LOG · FILM GRADE",
  },
};

export default function CategoryTiles({
  items,
  hrefPrefix,
}: {
  items: Category[];
  hrefPrefix: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeCat = hoveredIdx !== null ? items[hoveredIdx] : null;
  const activeSpec = activeCat
    ? CATEGORY_SPECS[activeCat.slug] || {
        ratio: activeCat.orientation === "vertical" ? ("9:16" as const) : ("16:9" as const),
        spec: activeCat.orientation === "vertical" ? "9:16 VERTICAL · 60FPS" : "16:9 WIDESCREEN · 24FPS",
        fps: activeCat.orientation === "vertical" ? "60 FPS" : "24 FPS",
        codec: "DIRECTOR'S CUT",
      }
    : null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="cats-index-stage"
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredIdx(null)}
    >
      <div className="cats cats-pick-c">
        {items.map((c, idx) => {
          const num = String(idx + 1).padStart(2, "0");
          const total = String(items.length).padStart(2, "0");
          const specInfo = CATEGORY_SPECS[c.slug] || {
            ratio: c.orientation === "vertical" ? "9:16" : "16:9",
            spec: c.orientation === "vertical" ? "9:16 VERTICAL · 60FPS" : "16:9 WIDESCREEN · 24FPS",
            fps: c.orientation === "vertical" ? "60 FPS" : "24 FPS",
            codec: "DIRECTOR'S CUT",
          };
          const isHovered = hoveredIdx === idx;

          return (
            <a
              key={c.slug}
              className={isHovered ? "cat cat-row is-hovered" : "cat cat-row"}
              href={`${hrefPrefix}${c.slug}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
            >
              <div className="cat-row-index" aria-hidden="true">
                <span className="cat-row-num">{num}</span>
                <span className="cat-row-slash">/ {total}</span>
              </div>

              <span className="cat-media">
                <span className="ph ph-img" style={mediaStyle(c.tone, c.thumbnail)}>
                  {!c.thumbnail && <span className="ph-label">[{c.title} thumbnail]</span>}
                </span>
              </span>

              <span className="cat-body">
                <span className="cat-title">
                  {c.title}
                  <Arrow />
                </span>
                <span className="cat-desc">{c.desc}</span>
              </span>

              <span className="cat-row-specs" aria-hidden="true">
                <span className="cat-spec-pill">{specInfo.spec}</span>
                <span className="cat-spec-sub">{specInfo.codec}</span>
              </span>
            </a>
          );
        })}
      </div>

      {/* Floating 3D Aspect-Morphing Hardware Monitor (Pick C) */}
      <div
        className={
          activeCat && activeSpec
            ? `cat-morph-monitor is-visible is-${activeSpec.ratio === "9:16" ? "vertical" : "landscape"}`
            : "cat-morph-monitor"
        }
        style={{
          transform: `translate3d(${pos.x + 28}px, ${pos.y - 110}px, 0)`,
        }}
        aria-hidden="true"
      >
        {activeCat && activeSpec && (
          <div className="cat-morph-bezel">
            <div className="cat-morph-hud">
              <span className="cat-morph-rec">● {activeSpec.ratio} MONITOR</span>
              <span className="cat-morph-fps">{activeSpec.fps}</span>
            </div>
            <div className="cat-morph-screen ph ph-img" style={mediaStyle(activeCat.tone, activeCat.thumbnail)}>
              <div className="cat-morph-scanline" />
              <div className="cat-morph-caption">
                <span className="cat-morph-kind">{activeSpec.codec}</span>
                <strong className="cat-morph-name">{activeCat.title}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
