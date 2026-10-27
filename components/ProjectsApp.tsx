"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoriesSection, Category, ProjectCard } from "@/lib/site-content";
import { mediaStyle } from "@/lib/media-style";
import CategoryTiles from "./CategoryTiles";
import { BackArrow, PlayBadge } from "./icons";

/**
 * Projects page — Component 07 · Pick C (Darkroom Lightbox + Floating Scrub Pill)
 * Category list → category gallery (#slug) → darkroom lightbox modal (#slug/index).
 */
export default function ProjectsApp({
  categories,
  projects,
}: {
  categories: CategoriesSection;
  projects: Record<string, ProjectCard[]>;
}) {
  const [hash, setHash] = useState("");

  useLayoutEffect(() => {
    const read = () => setHash(window.location.hash.replace("#", ""));
    read();
    delete document.documentElement.dataset.pjHash;
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && window.location.hash.includes("/")) {
        window.location.hash = window.location.hash.split("/")[0];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [slug, idx] = hash.split("/");
  const cat = categories.items.find((c) => c.slug === slug);
  const list = cat ? projects[cat.slug] ?? [] : [];
  const open = cat && idx != null && idx !== "" ? list[Number(idx)] : undefined;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!cat) {
    return (
      <section className="wrap intro">
        <p className="eyebrow">07 / DIRECTOR SCREENING ROOM · 4 DISCIPLINES</p>
        <h1 className="display page-title">{categories.pageTitle}</h1>
        <p className="lede">{categories.pageLede}</p>
        <CategoryTiles items={categories.items} hrefPrefix="#" />
      </section>
    );
  }

  const vertical = cat.orientation === "vertical";
  const ratio = vertical ? "9 / 16" : "16 / 9";
  const fmt = vertical ? "Vertical 9:16" : "Landscape 16:9";

  return (
    <>
      <section className="wrap gallery">
        <a className="btn-ghost btn-sm" href="#">
          <BackArrow />
          Back to projects
        </a>
        <h1 className="display page-title">{cat.title}</h1>
        <p className="lede">{cat.desc}</p>
        <div className={`clips ${vertical ? "clips-portrait" : "clips-land"}`}>
          {list.map((p, i) => (
            <a key={p.id} className="clip" href={`#${cat.slug}/${i}`} aria-label={`Play ${p.title}`}>
              <span className="clip-media ph" style={{ aspectRatio: ratio, ...mediaStyle(cat.tone, p.poster) }}>
                {!p.poster && <span className="ph-label">[Poster thumbnail]</span>}
                <PlayBadge />
              </span>
              <span className="clip-title">{p.title}</span>
              <span className="clip-meta">
                {fmt} · {p.role}
              </span>
            </a>
          ))}
        </div>
        <div className="others">
          <p>Other categories</p>
          <div>
            {categories.items
              .filter((c) => c.slug !== cat.slug)
              .map((c) => (
                <a key={c.slug} className="btn-ghost btn-sm" href={`#${c.slug}`}>
                  {c.title}
                </a>
              ))}
          </div>
        </div>
      </section>
      {open && (
        <Player key={`${cat.slug}/${idx}`} cat={cat} project={open} ratio={ratio} fmt={fmt} vertical={vertical} />
      )}
    </>
  );
}

function formatScrubTC(pct: number): string {
  const totalSec = Math.round((pct / 100) * 45);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const frames = Math.round(((pct / 100) * 45 * 24) % 24);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

function Player({
  cat,
  project: p,
  ratio,
  fmt,
  vertical,
}: {
  cat: Category;
  project: ProjectCard;
  ratio: string;
  fmt: string;
  vertical: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [scrubPct, setScrubPct] = useState(34);
  const [speed, setSpeed] = useState("1.0x");
  const playRef = useRef<HTMLButtonElement>(null);
  const scrubTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playRef.current?.focus({ preventScroll: true });
  }, []);

  // J / K / L NLE Shuttle keyboard shortcuts inside Darkroom Lightbox
  useEffect(() => {
    const onShuttle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "j" || e.key === "J") {
        setScrubPct((prev) => Math.max(0, prev - 8));
        setSpeed("-1.0x");
      } else if (e.key === "k" || e.key === "K") {
        setPlaying(false);
        setSpeed("PAUSE");
      } else if (e.key === "l" || e.key === "L") {
        setPlaying(true);
        setScrubPct((prev) => Math.min(100, prev + 8));
        setSpeed("1.5x");
      }
    };
    window.addEventListener("keydown", onShuttle);
    return () => window.removeEventListener("keydown", onShuttle);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setScrubPct((prev) => (prev >= 100 ? 0 : prev + 0.8));
    }, 120);
    return () => window.clearInterval(id);
  }, [playing]);

  const handleTrackClick = (clientX: number) => {
    if (!scrubTrackRef.current) return;
    const rect = scrubTrackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setScrubPct(next);
  };

  return (
    <div
      className="player-backdrop player-backdrop-darkroom"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) window.location.hash = cat.slug;
      }}
    >
      <div className={vertical ? "player player-pick-c player-vertical" : "player player-pick-c"}>
        {/* Darkroom Top Telemetry Bar */}
        <div className="darkroom-topbar" aria-hidden="true">
          <span className="darkroom-rec">
            <span className="darkroom-rec-dot" />
            DARKROOM LIGHTBOX · {fmt.toUpperCase()}
          </span>
          <span className="darkroom-keys">KEYS: [J/K/L] SHUTTLE · [ESC] EXIT</span>
        </div>

        <div className="player-stage" id="stage" style={{ aspectRatio: ratio }}>
          {playing ? (
            p.video ? (
              <video src={p.video} controls autoPlay playsInline></video>
            ) : (
              <span className="player-empty">[Video file or link plays here]</span>
            )
          ) : (
            <button
              ref={playRef}
              className="player-poster ph"
              id="playBtn"
              type="button"
              aria-label="Play video"
              style={mediaStyle(cat.tone, p.poster)}
              onClick={() => setPlaying(true)}
            >
              {!p.poster && <span className="ph-label">[Poster thumbnail]</span>}
              <PlayBadge />
            </button>
          )}
        </div>

        {/* Floating Glass Scrub Pill (Pick C) */}
        <div className="darkroom-scrub-pill" aria-hidden="true">
          <button
            type="button"
            tabIndex={-1}
            className="darkroom-pill-play"
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span className="darkroom-pill-tc">
            {formatScrubTC(scrubPct)} / 00:45:00
          </span>
          <div
            className="darkroom-pill-track"
            ref={scrubTrackRef}
            onClick={(e) => handleTrackClick(e.clientX)}
          >
            <div className="darkroom-pill-fill" style={{ width: `${scrubPct}%` }} />
            <div className="darkroom-pill-head" style={{ left: `${scrubPct}%` }} />
          </div>
          <span className="darkroom-pill-badge">{speed} · 24FPS</span>
        </div>

        <div className="player-body">
          <div className="player-head">
            <div>
              <h2>{p.title}</h2>
              <p>
                {fmt} · {p.role}
              </p>
            </div>
            <a className="btn-ghost btn-sm" href={`#${cat.slug}`} aria-label="Close player">
              Close
            </a>
          </div>
          <dl className="facts">
            <div>
              <dt>Brief</dt>
              <dd>{p.brief}</dd>
            </div>
            <div>
              <dt>My contribution</dt>
              <dd>{p.contribution}</dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>{p.tools}</dd>
            </div>
          </dl>
          <div className="player-foot">
            <a className="link" href="#">
              Back to projects
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
