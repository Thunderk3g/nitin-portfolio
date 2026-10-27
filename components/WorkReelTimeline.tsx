"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ReelItem } from "@/lib/site-content";
import { shadedMediaStyle } from "@/lib/media-style";
import { Arrow } from "./icons";

function formatTimelineTC(pct: number): string {
  const totalFrames = Math.round((pct / 100) * 24 * 120); // 2-minute master sequence
  const f = totalFrames % 24;
  const s = Math.floor(totalFrames / 24) % 60;
  const m = Math.floor(totalFrames / (24 * 60));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `01:${pad(m)}:${pad(s)}:${pad(f)}`;
}

export default function WorkReelTimeline({ reels }: { reels: ReelItem[] }) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playheadPct, setPlayheadPct] = useState(14);
  const count = Math.max(1, reels.length);
  const activeIdx = Math.min(count - 1, Math.floor((playheadPct / 100) * count));
  const activeReel = reels[activeIdx] || reels[0];

  const handleScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(99.9, ((clientX - rect.left) / rect.width) * 100));
    setPlayheadPct(pct);
  };

  if (!activeReel) return null;

  return (
    <div className="nle-timeline-deck wrap">
      {/* Widescreen Program Monitor */}
      <div className="nle-program-monitor">
        <div className="nle-monitor-topbar">
          <span className="nle-monitor-badge">
            <span className="nle-rec-dot" />
            SEQUENCE 04 · TIMELINE PLAYHEAD SCRUBBER
          </span>
          <span className="nle-monitor-tc">{formatTimelineTC(playheadPct)}</span>
        </div>

        <div className="nle-monitor-stage ph ph-img" style={shadedMediaStyle(activeReel.tone, activeReel.poster)}>
          <div className="nle-monitor-safezone" aria-hidden="true" />
          <div className="nle-monitor-overlay">
            <div className="nle-monitor-meta">
              <span className="nle-clip-tag">
                CLIP {String(activeIdx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} · {activeReel.kind}
              </span>
              <h3 className="nle-clip-title display">{activeReel.title}</h3>
            </div>
            <Link className="btn btn-sm" href={activeReel.href}>
              Open Reel
              <Arrow />
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive DaVinci / Premiere NLE Timeline Track */}
      <div
        className="nle-scrubber-surface"
        ref={timelineRef}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons > 0) {
            handleScrub(e.clientX);
          }
        }}
        onClick={(e) => handleScrub(e.clientX)}
      >
        <div className="nle-time-ruler" aria-hidden="true">
          <span>01:00:00:00</span>
          <span>01:00:30:00</span>
          <span>01:01:00:00</span>
          <span>01:01:30:00</span>
          <span>01:02:00:00</span>
        </div>

        {/* Red NLE Playhead Line + Cap */}
        <div className="nle-playhead-line" style={{ left: `${playheadPct}%` }} aria-hidden="true">
          <span className="nle-playhead-cap">▼</span>
        </div>

        {/* V1 Video Track Clips */}
        <div className="nle-track-row" role="tablist" aria-label="Scrub reel clips">
          {reels.map((r, i) => {
            const isSelected = i === activeIdx;
            return (
              <button
                key={`${r.title}-${i}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={isSelected ? "nle-track-clip is-active" : "nle-track-clip"}
                style={{ "--clip-tone": r.tone } as React.CSSProperties}
                onClick={(e) => {
                  e.stopPropagation();
                  setPlayheadPct(((i + 0.5) / count) * 100);
                }}
              >
                <span className="nle-track-code">V1 · 0{i + 1}</span>
                <strong className="nle-track-name">{r.title}</strong>
                <span className="nle-track-kind">{r.kind}</span>
              </button>
            );
          })}
        </div>

        {/* A1 Audio Waveform Strip */}
        <div className="nle-audio-strip" aria-hidden="true">
          <span className="nle-audio-label">A1 · MASTER STEREO 48KHZ</span>
          <div className="nle-audio-bars" />
        </div>
      </div>
    </div>
  );
}
