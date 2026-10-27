"use client";

import { useEffect, useRef, useState } from "react";
import { defaultContent, type CraftSection } from "@/lib/site-content";
import { cssUrl } from "@/lib/media-style";

const FALLBACK_GRADIENTS = [
  {
    raw: "linear-gradient(135deg, #3c3f46 0%, #575b63 48%, #41454d 100%)",
    graded:
      "radial-gradient(85% 75% at 72% 28%, rgba(235, 148, 72, 0.44), transparent 60%), radial-gradient(90% 80% at 24% 78%, rgba(55, 102, 230, 0.56), transparent 65%), linear-gradient(135deg, #090d18 0%, #152544 52%, #0a0c12 100%)",
  },
  {
    raw: "linear-gradient(135deg, #47494e 0%, #61646b 50%, #3d4046 100%)",
    graded:
      "radial-gradient(80% 70% at 50% 25%, rgba(76, 121, 238, 0.52), transparent 62%), linear-gradient(160deg, #07090e 0%, #131c31 55%, #090b10 100%)",
  },
  {
    raw: "linear-gradient(135deg, #4b4843 0%, #66625b 52%, #3f3c38 100%)",
    graded:
      "radial-gradient(80% 75% at 32% 35%, rgba(226, 160, 82, 0.46), transparent 64%), radial-gradient(75% 70% at 80% 75%, rgba(55, 102, 230, 0.35), transparent 65%), linear-gradient(140deg, #120e0a 0%, #2b1f17 52%, #0c0e14 100%)",
  },
];

export default function CraftGradeWipe({ craft }: { craft?: CraftSection }) {
  const data = craft && Array.isArray(craft.scenes) && craft.scenes.length > 0 ? craft : defaultContent.craft;
  const scenes = data.scenes;

  const stageRef = useRef<HTMLDivElement>(null);
  const pointerActiveRef = useRef(false);
  const [wipePct, setWipePct] = useState(54);
  const [sceneIdx, setSceneIdx] = useState(0);
  const safeIdx = sceneIdx < scenes.length ? sceneIdx : 0;
  const scene = scenes[safeIdx] || scenes[0];
  const fallback = FALLBACK_GRADIENTS[safeIdx % FALLBACK_GRADIENTS.length];

  // Scroll-linked automatic colour-grade wipe sweep as user scrolls past section
  useEffect(() => {
    const onScroll = () => {
      if (pointerActiveRef.current || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const raw = (vh - rect.top) / (vh + rect.height);
      const pct = Math.max(18, Math.min(82, 18 + raw * 64));
      setWipePct(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateWipe = (clientX: number) => {
    if (!stageRef.current) return;
    pointerActiveRef.current = true;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    setWipePct(pct);
  };

  const afterBg = scene.afterImage ? cssUrl(scene.afterImage) : fallback.graded;
  const beforeBg = scene.beforeImage
    ? cssUrl(scene.beforeImage)
    : scene.afterImage
      ? cssUrl(scene.afterImage)
      : fallback.raw;

  return (
    <section className="craft-grade wrap" id="craft-grade" aria-labelledby="craft-grade-title">
      <div className="craft-grade-head" data-reveal="up">
        <div>
          <p className="eyebrow">{data.eyebrow || "06 / EDITOR CRAFT · COLOUR & FINISHING"}</p>
          <h2 className="display craft-grade-title" id="craft-grade-title">
            {data.title || "From Raw Log to Final Cut"}
          </h2>
        </div>
        <div className="craft-scene-pills" role="tablist" aria-label="Colour grade scenes">
          {scenes.map((s, idx) => (
            <button
              key={`${s.code}-${idx}`}
              type="button"
              role="tab"
              aria-selected={idx === safeIdx}
              className={idx === safeIdx ? "craft-scene-btn is-active" : "craft-scene-btn"}
              onClick={() => setSceneIdx(idx)}
            >
              {s.code || `SCENE 0${idx + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Double-Bezel Interactive Split-Wipe Monitor */}
      <div className="craft-wipe-bezel" data-reveal="scale">
        <div className="craft-wipe-hud">
          <span>SOURCE: {scene.camera}</span>
          <span>SPLIT WIPE: {Math.round(wipePct)}%</span>
          <span>OUTPUT: {scene.lut}</span>
        </div>

        <div
          className="craft-wipe-stage"
          ref={stageRef}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.buttons > 0) {
              updateWipe(e.clientX);
            }
          }}
          onPointerLeave={() => {
            pointerActiveRef.current = false;
          }}
          onClick={(e) => updateWipe(e.clientX)}
        >
          {/* Base Layer: AFTER (Final Graded Master) */}
          <div
            className="craft-layer craft-layer-graded"
            style={{
              backgroundImage: afterBg,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="craft-cinema-bars" aria-hidden="true" />
            {!scene.afterImage && (
              <div className="craft-focal-subject" aria-hidden="true">
                <div className="craft-subject-ring" />
                <div className="craft-subject-flare" />
              </div>
            )}
            <span className="craft-corner-tag craft-tag-after">AFTER · FINAL DI GRADE</span>
          </div>

          {/* Clipped Top Layer: BEFORE (Flat Un-graded RAW LOG) */}
          <div
            className="craft-layer craft-layer-raw"
            style={{
              backgroundImage: beforeBg,
              backgroundSize: "cover",
              backgroundPosition: "center",
              clipPath: `inset(0 ${100 - wipePct}% 0 0)`,
            }}
          >
            <div className="craft-cinema-bars" aria-hidden="true" />
            <div className="craft-raw-grid" aria-hidden="true" />
            {!scene.beforeImage && !scene.afterImage && (
              <div className="craft-focal-subject is-raw" aria-hidden="true">
                <div className="craft-subject-ring" />
              </div>
            )}
            <span className="craft-corner-tag craft-tag-before">BEFORE · FLAT RAW LOG</span>
          </div>

          {/* Interactive Optical Divider Handle */}
          <div className="craft-wipe-divider" style={{ left: `${wipePct}%` }} aria-hidden="true">
            <div className="craft-wipe-knob">
              <span>◀</span>
              <span>▶</span>
            </div>
          </div>
        </div>

        {/* Colourist Telemetry Bar */}
        <div className="craft-telemetry-bar">
          <div className="craft-telemetry-cell">
            <span className="craft-tel-label">SEQUENCE</span>
            <strong className="craft-tel-val">{scene.title}</strong>
          </div>
          <div className="craft-telemetry-cell">
            <span className="craft-tel-label">LIFT / SHADOWS</span>
            <strong className="craft-tel-val">{scene.lift}</strong>
          </div>
          <div className="craft-telemetry-cell">
            <span className="craft-tel-label">GAMMA / MIDTONES</span>
            <strong className="craft-tel-val">{scene.gamma}</strong>
          </div>
          <div className="craft-telemetry-cell">
            <span className="craft-tel-label">COLOR BALANCE</span>
            <strong className="craft-tel-val">{scene.gain}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
