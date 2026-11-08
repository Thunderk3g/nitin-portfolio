"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReelItem } from "@/lib/site-content";
import { mediaStyle, shadedMediaStyle } from "@/lib/media-style";
import { Arrow, BackArrow } from "./icons";

/** Phones get the swipeable clip bin instead of the desktop scrubber (keep in sync with globals.css). */
const MOBILE_QUERY = "(max-width: 760px)";

function formatTimelineTC(pct: number): string {
  const totalFrames = Math.round((pct / 100) * 24 * 120); // 2-minute master sequence
  const f = totalFrames % 24;
  const s = Math.floor(totalFrames / 24) % 60;
  const m = Math.floor(totalFrames / (24 * 60));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `01:${pad(m)}:${pad(s)}:${pad(f)}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function WorkReelTimeline({ reels }: { reels: ReelItem[] }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const userInteractedRef = useRef(false);
  const [playheadPct, setPlayheadPct] = useState(14);
  const count = Math.max(1, reels.length);
  const activeIdx = Math.min(count - 1, Math.floor((playheadPct / 100) * count));
  const activeReel = reels[activeIdx] || reels[0];

  // Scroll-linked timeline playhead advance when scrolling through the section.
  // Desktop only: on phones the clip changing under your thumb while you scroll is confusing.
  useEffect(() => {
    const mobile = window.matchMedia?.(MOBILE_QUERY);
    const onScroll = () => {
      if (userInteractedRef.current || !deckRef.current || mobile?.matches) return;
      const rect = deckRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      // Progress from 0 when top enters bottom of viewport to 1 when bottom leaves top
      const raw = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.max(0.08, Math.min(0.94, raw));
      setPlayheadPct(clamped * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the active clip visible in the phone clip bin (scrolls the strip only, never the page).
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || strip.offsetParent === null) return;
    const clip = strip.children[activeIdx] as HTMLElement | undefined;
    if (!clip) return;
    const target = clip.offsetLeft - (strip.clientWidth - clip.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  const handleScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    userInteractedRef.current = true;
    const rect = timelineRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(99.9, ((clientX - rect.left) / rect.width) * 100));
    setPlayheadPct(pct);
  };

  const selectClip = (i: number) => {
    userInteractedRef.current = true;
    const next = (i + count) % count;
    setPlayheadPct(((next + 0.5) / count) * 100);
  };

  if (!activeReel) return null;

  return (
    <div className="nle-timeline-deck wrap" ref={deckRef}>
      {/* Widescreen Program Monitor */}
      <div className="nle-program-monitor" data-reveal="scale">
        <div className="nle-monitor-topbar">
          <span className="nle-monitor-badge">
            <span className="nle-rec-dot" />
            SEQUENCE 04<span className="nle-badge-long"> · TIMELINE PLAYHEAD SCRUBBER</span>
          </span>
          <span className="nle-monitor-tc">{formatTimelineTC(playheadPct)}</span>
        </div>

        <div
          className="nle-monitor-stage ph ph-img"
          style={shadedMediaStyle(activeReel.tone, activeReel.poster)}
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") swipeRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const start = swipeRef.current;
            swipeRef.current = null;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            // Horizontal swipe on the monitor steps through the clips (phones/tablets).
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) selectClip(activeIdx + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => {
            swipeRef.current = null;
          }}
        >
          <div className="nle-monitor-grid" aria-hidden="true" />
          <div className="nle-monitor-safezone" aria-hidden="true">
            <span className="nle-center-cross">+</span>
          </div>
          <div className="nle-monitor-overlay">
            <div className="nle-monitor-meta">
              <span className="nle-clip-tag">
                CLIP {pad2(activeIdx + 1)} / {pad2(count)} · {activeReel.kind}
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

      {/* Interactive DaVinci / Premiere NLE Timeline Track (tablet & desktop) */}
      <div
        className="nle-scrubber-surface"
        ref={timelineRef}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons > 0) {
            handleScrub(e.clientX);
          }
        }}
        onPointerLeave={(e) => {
          // Only a mouse "leaves"; on touch, pointerleave fires after every tap and
          // would hand the playhead back to the scroll-linked sweep.
          if (e.pointerType === "mouse") userInteractedRef.current = false;
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
                  selectClip(i);
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

      {/* Phone clip bin: swipeable thumbnail strip + prev/next (replaces the scrubber) */}
      <div className="nle-bin">
        <div className="nle-bin-head">
          <span className="nle-bin-label">
            <span className="nle-rec-dot" aria-hidden="true" />
            V1 · CLIP BIN
          </span>
          <span className="nle-bin-count" aria-live="polite">
            {pad2(activeIdx + 1)} / {pad2(count)}
          </span>
          <div className="nle-bin-nav">
            <button type="button" aria-label="Previous clip" onClick={() => selectClip(activeIdx - 1)}>
              <BackArrow />
            </button>
            <button type="button" aria-label="Next clip" onClick={() => selectClip(activeIdx + 1)}>
              <Arrow />
            </button>
          </div>
        </div>

        <div className="nle-bin-strip" ref={stripRef} role="tablist" aria-label="Choose a reel">
          {reels.map((r, i) => {
            const isSelected = i === activeIdx;
            return (
              <button
                key={`bin-${r.title}-${i}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={isSelected ? "nle-bin-clip is-active" : "nle-bin-clip"}
                onClick={() => selectClip(i)}
              >
                <span className="nle-bin-thumb ph ph-img" style={mediaStyle(r.tone, r.poster)} aria-hidden="true">
                  <span className="nle-bin-code">V1 · {pad2(i + 1)}</span>
                </span>
                <strong className="nle-bin-name">{r.title}</strong>
                <span className="nle-bin-kind">{r.kind}</span>
              </button>
            );
          })}
        </div>

        <div className="nle-bin-progress" aria-hidden="true">
          {reels.map((_, i) => (
            <span key={i} className={i <= activeIdx ? "is-on" : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
