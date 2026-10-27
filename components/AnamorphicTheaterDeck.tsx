"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReelItem } from "@/lib/site-content";
import { shadedMediaStyle } from "@/lib/media-style";
import { Arrow } from "./icons";

const LUT_PROFILES = [
  {
    name: "KODAK 2383 PRINT",
    swatches: ["#0d1322", "#3766e6", "#d99b52", "#f4efe6"],
    flare:
      "radial-gradient(80% 60% at 75% 28%, rgba(217, 155, 82, 0.34), transparent 60%), radial-gradient(75% 65% at 22% 72%, rgba(55, 102, 230, 0.42), transparent 62%)",
  },
  {
    name: "ANAMORPHIC TEAL",
    swatches: ["#091a24", "#1f7a8c", "#e07a5f", "#f4efe6"],
    flare:
      "radial-gradient(80% 60% at 28% 30%, rgba(31, 122, 140, 0.45), transparent 60%), radial-gradient(75% 65% at 78% 72%, rgba(224, 122, 95, 0.36), transparent 62%)",
  },
  {
    name: "SILVER HALIDE",
    swatches: ["#12141a", "#5c677d", "#9aa6bd", "#ffffff"],
    flare:
      "radial-gradient(75% 55% at 50% 35%, rgba(154, 166, 189, 0.36), transparent 62%), radial-gradient(85% 70% at 80% 80%, rgba(55, 102, 230, 0.3), transparent 65%)",
  },
];

export default function AnamorphicTheaterDeck({
  featured,
  title,
}: {
  featured: ReelItem[];
  title?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = featured[activeIdx] || featured[0];
  const lut = LUT_PROFILES[activeIdx % LUT_PROFILES.length];

  if (!current) return null;

  const baseStyle = shadedMediaStyle(current.tone, current.poster);
  const combinedBg = current.poster
    ? baseStyle.backgroundImage
    : `${lut.flare}, linear-gradient(180deg, rgba(10,12,18,0.2) 0%, rgba(8,10,15,0.88) 100%)`;

  return (
    <div className="features features-pick-c" aria-label="Featured projects">
      <div className="wrap theater-deck-wrap">
        <div className="theater-deck-header" data-reveal="up">
          <div>
            <p className="eyebrow">05 / ANAMORPHIC THEATER DECK · 2.39:1 SCOPE</p>
            <h3 className="display theater-deck-heading">{title || "Featured Director Cuts"}</h3>
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

        {/* 2.39:1 Widescreen CinemaScope Bezel Frame */}
        <div className="theater-scope-bezel" data-reveal="scale">
          <div className="theater-scope-topbar" aria-hidden="true">
            <span>ASPECT 2.39:1 ANAMORPHIC</span>
            <span>
              CHAPTER 0{activeIdx + 1} / 0{featured.length}
            </span>
            <span>24.000 FPS · REC.709</span>
          </div>

          <Link
            href={current.href}
            className="theater-scope-screen ph ph-img"
            style={{
              ...baseStyle,
              backgroundImage: combinedBg,
            }}
          >
            {/* Optical Anamorphic Streak & Scope Crosshair */}
            <div className="theater-anamorphic-streak" aria-hidden="true" />
            <div className="theater-scope-guides" aria-hidden="true">
              <span className="scope-crosshair" />
            </div>
            <div className="theater-scope-vignette" aria-hidden="true" />

            <div className="theater-scope-content">
              <div className="theater-scope-text">
                <span className="feature-kind">
                  CHAPTER 0{activeIdx + 1} · {current.kind}
                </span>
                <span className="feature-title display">{current.title}</span>
              </div>
              <span className="feature-go" aria-hidden="true">
                <Arrow size={22} />
              </span>
            </div>
          </Link>

          {/* Interactive Chapter Switcher Tabs */}
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
                  onMouseEnter={() => setActiveIdx(idx)}
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
    </div>
  );
}
