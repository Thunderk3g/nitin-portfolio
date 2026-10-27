"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReelItem } from "@/lib/site-content";
import { shadedMediaStyle } from "@/lib/media-style";
import { Arrow } from "./icons";

const LUT_PROFILES = [
  { name: "KODAK 2383 PRINT", swatches: ["#0d1322", "#3766e6", "#d99b52", "#f4efe6"] },
  { name: "ANAMORPHIC TEAL", swatches: ["#091a24", "#1f7a8c", "#e07a5f", "#f4efe6"] },
  { name: "SILVER HALIDE", swatches: ["#12141a", "#5c677d", "#9aa6bd", "#ffffff"] },
];

export default function AnamorphicTheaterDeck({ featured }: { featured: ReelItem[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = featured[activeIdx] || featured[0];
  const lut = LUT_PROFILES[activeIdx % LUT_PROFILES.length];

  if (!current) return null;

  return (
    <div className="features features-pick-c" aria-label="Featured projects">
      {/* 2.39:1 Anamorphic CinemaScope Theater Stage (Pick C) */}
      <div className="wrap theater-deck-wrap">
        <div className="theater-deck-header">
          <div>
            <p className="eyebrow">05 / ANAMORPHIC THEATER DECK · 2.39:1 SCOPE</p>
            <h3 className="display theater-deck-heading">Featured Director Cuts</h3>
          </div>
          <div className="theater-lut-badge" aria-label="Active colour grade LUT">
            <span className="theater-lut-label">GRADE: {lut.name}</span>
            <div className="theater-lut-swatches" aria-hidden="true">
              {lut.swatches.map((hex, i) => (
                <span key={i} className="theater-lut-dot" style={{ backgroundColor: hex }} />
              ))}
            </div>
          </div>
        </div>

        {/* 2.39:1 Widescreen Bezel Frame */}
        <div className="theater-scope-bezel">
          <div className="theater-scope-topbar" aria-hidden="true">
            <span>ASPECT 2.39:1 ANAMORPHIC</span>
            <span>CHAPTER 0{activeIdx + 1} / 0{featured.length}</span>
            <span>24.000 FPS · REC.709</span>
          </div>

          <Link
            href={current.href}
            className="theater-scope-screen ph ph-img"
            style={shadedMediaStyle(current.tone, current.poster)}
          >
            {!current.poster && <span className="ph-label">[Featured video {activeIdx + 1}]</span>}
            <div className="theater-scope-vignette" aria-hidden="true" />
            <div className="theater-scope-content">
              <div className="theater-scope-text">
                <span className="feature-kind">
                  0{activeIdx + 1} · {current.kind}
                </span>
                <span className="feature-title display">{current.title}</span>
              </div>
              <span className="feature-go" aria-hidden="true">
                <Arrow size={22} />
              </span>
            </div>
          </Link>

          {/* Chapter Switcher Tabs */}
          <div className="theater-chapter-tabs" role="tablist" aria-label="Featured case study chapters">
            {featured.map((f, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <button
                  key={`${f.title}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={isSelected ? "theater-chapter-tab is-active" : "theater-chapter-tab"}
                  onClick={() => setActiveIdx(idx)}
                >
                  <span className="theater-tab-num">CH 0{idx + 1}</span>
                  <strong className="theater-tab-title">{f.title}</strong>
                  <span className="theater-tab-kind">{f.kind}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky-Stack Anamorphic Cards Below for Scroll Continuity */}
      <div className="theater-sticky-stack">
        {featured.map((f, i) => (
          <Link
            key={`${f.title}-${i}`}
            className="feature ph ph-img"
            style={shadedMediaStyle(f.tone, f.poster)}
            href={f.href}
          >
            {!f.poster && <span className="ph-label">[Featured video {i + 1}]</span>}
            <div className="feature-inner">
              <div className="feature-text">
                <span className="feature-kind">{f.kind}</span>
                <span className="feature-title display">{f.title}</span>
              </div>
              <span className="feature-go" aria-hidden="true">
                <Arrow size={22} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
