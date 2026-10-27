"use client";

import { useRef, useState } from "react";

const GRADE_SCENES = [
  {
    id: "scene-01",
    code: "SCENE 01",
    title: "Midnight Commercial · Anamorphic Grade",
    camera: "ARRI ALEXA MINI LF · LOG-C3",
    lut: "KODAK 2383 + HALATION 18%",
    rawGradient: "linear-gradient(135deg, #3c3f46 0%, #575b63 48%, #41454d 100%)",
    gradedGradient:
      "radial-gradient(85% 75% at 72% 28%, rgba(235, 148, 72, 0.44), transparent 60%), radial-gradient(90% 80% at 24% 78%, rgba(55, 102, 230, 0.56), transparent 65%), linear-gradient(135deg, #090d18 0%, #152544 52%, #0a0c12 100%)",
    lift: "-0.04 EV",
    gamma: "+0.12 EV",
    gain: "5600K · TEAL/AMBER",
  },
  {
    id: "scene-02",
    code: "SCENE 02",
    title: "SaaS Flagship Launch · High-Contrast Studio",
    camera: "RED V-RAPTOR 8K VV · R3D RAW",
    lut: "OPTICAL COBALT + DEEP BLACKS",
    rawGradient: "linear-gradient(135deg, #47494e 0%, #61646b 50%, #3d4046 100%)",
    gradedGradient:
      "radial-gradient(80% 70% at 50% 25%, rgba(76, 121, 238, 0.52), transparent 62%), linear-gradient(160deg, #07090e 0%, #131c31 55%, #090b10 100%)",
    lift: "-0.08 EV",
    gamma: "+0.06 EV",
    gain: "6200K · STUDIO CLEAN",
  },
  {
    id: "scene-03",
    code: "SCENE 03",
    title: "Founder Documentary · Warm Tungsten Film",
    camera: "SONY FX6 · S-LOG3 / S-GAMUT3.CINE",
    lut: "16MM KODAK VISION3 500T",
    rawGradient: "linear-gradient(135deg, #4b4843 0%, #66625b 52%, #3f3c38 100%)",
    gradedGradient:
      "radial-gradient(80% 75% at 32% 35%, rgba(226, 160, 82, 0.46), transparent 64%), radial-gradient(75% 70% at 80% 75%, rgba(55, 102, 230, 0.35), transparent 65%), linear-gradient(140deg, #120e0a 0%, #2b1f17 52%, #0c0e14 100%)",
    lift: "-0.03 EV",
    gamma: "+0.15 EV",
    gain: "3200K · TUNGSTEN",
  },
];

export default function CraftGradeWipe() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [wipePct, setWipePct] = useState(54);
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = GRADE_SCENES[sceneIdx] || GRADE_SCENES[0];

  const updateWipe = (clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    setWipePct(pct);
  };

  return (
    <section className="craft-grade wrap" id="craft-grade" aria-labelledby="craft-grade-title">
      <div className="craft-grade-head">
        <div>
          <p className="eyebrow">06 / EDITOR CRAFT · COLOUR & FINISHING</p>
          <h2 className="display craft-grade-title" id="craft-grade-title">
            From Raw Log to Final Cut
          </h2>
        </div>
        <div className="craft-scene-pills" role="tablist" aria-label="Colour grade scenes">
          {GRADE_SCENES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === sceneIdx}
              className={idx === sceneIdx ? "craft-scene-btn is-active" : "craft-scene-btn"}
              onClick={() => setSceneIdx(idx)}
            >
              {s.code}
            </button>
          ))}
        </div>
      </div>

      {/* Double-Bezel Interactive Split-Wipe Monitor */}
      <div className="craft-wipe-bezel">
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
          onClick={(e) => updateWipe(e.clientX)}
        >
          {/* Base Layer: AFTER (Final Graded Master) */}
          <div className="craft-layer craft-layer-graded" style={{ backgroundImage: scene.gradedGradient }}>
            <div className="craft-cinema-bars" aria-hidden="true" />
            <div className="craft-focal-subject" aria-hidden="true">
              <div className="craft-subject-ring" />
              <div className="craft-subject-flare" />
            </div>
            <span className="craft-corner-tag craft-tag-after">AFTER · FINAL DI GRADE</span>
          </div>

          {/* Clipped Top Layer: BEFORE (Flat Un-graded RAW LOG) */}
          <div
            className="craft-layer craft-layer-raw"
            style={{
              backgroundImage: scene.rawGradient,
              clipPath: `inset(0 ${100 - wipePct}% 0 0)`,
            }}
          >
            <div className="craft-cinema-bars" aria-hidden="true" />
            <div className="craft-raw-grid" aria-hidden="true" />
            <div className="craft-focal-subject is-raw" aria-hidden="true">
              <div className="craft-subject-ring" />
            </div>
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
