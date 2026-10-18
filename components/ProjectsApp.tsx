"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CategoriesSection, Category, ProjectCard } from "@/lib/site-content";
import { mediaStyle } from "@/lib/media-style";
import CategoryTiles from "./CategoryTiles";
import { BackArrow, PlayBadge } from "./icons";

/**
 * Projects page: category list → category gallery (#slug) → video player
 * modal (#slug/index). Hash routing, exactly like the prototype.
 */
export default function ProjectsApp({
  categories,
  projects,
}: {
  categories: CategoriesSection;
  projects: Record<string, ProjectCard[]>;
}) {
  const [hash, setHash] = useState("");

  // Layout effect: read the hash before the first paint so deep links never
  // show the index first, then reveal #app (hidden by the inline script).
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
  const playRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    playRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className="player-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) window.location.hash = cat.slug;
      }}
    >
      <div className={vertical ? "player player-vertical" : "player"}>
        <div className="player-stage" id="stage" style={{ aspectRatio: ratio }}>
          {playing ? (
            p.video ? (
              <video src={p.video} controls autoPlay playsInline></video>
            ) : (
              <span className="player-empty">[Video file or link plays here]</span>
            )
          ) : (
            // Playback starts only on click; poster shown until then.
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
