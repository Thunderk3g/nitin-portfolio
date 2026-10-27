"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type PageId = "home" | "projects" | "contact";
export type NavCurrent = PageId;

const LINKS: { id: PageId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "projects", href: "/projects", label: "Projects" },
  { id: "contact", href: "/contact", label: "Contact" },
];

const QUICK_REELS = [
  { code: "01 / 9:16", label: "Short-form & Reels", href: "/projects#short-form" },
  { code: "02 / 16:9", label: "Long-form Videos", href: "/projects#long-form" },
  { code: "03 / UI", label: "SaaS Demos", href: "/projects#saas" },
  { code: "04 / 2.39:1", label: "Cinematic Content", href: "/projects#cinematic" },
  { code: "05 / NLE", label: "Interactive NLE Timeline", href: "/#allwork-title" },
  { code: "06 / LUT", label: "RAW LOG vs. Final Grade Wipe", href: "/#craft-grade" },
  { code: "07 / BOOK", label: "Commission & Contact", href: "/contact" },
];

export default function SiteHeader({
  name,
  current,
  className = "",
}: {
  name: string;
  current: PageId;
  className?: string;
}) {
  const [tc, setTc] = useState("00:00:14:08");
  const [cmdOpen, setCmdOpen] = useState(false);

  // Live 24fps SMPTE timecode HUD
  useEffect(() => {
    let frames = 14 * 24 + 8;
    const pad = (n: number) => String(n).padStart(2, "0");
    const timer = window.setInterval(() => {
      frames++;
      const f = frames % 24;
      const s = Math.floor(frames / 24) % 60;
      const m = Math.floor(frames / (24 * 60)) % 60;
      setTc(`00:${pad(m)}:${pad(s)}:${pad(f)}`);
    }, 1000 / 24);
    return () => window.clearInterval(timer);
  }, []);

  // Command+K / Ctrl+K shortcut for Quick Reel Jumper
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`site-header site-header-pick-c ${className}`.trim()}>
        <Link className="brand" href="/">
          {name}
        </Link>

        <div className="header-rail-mid" aria-hidden="true">
          <span className="brand-rule"></span>
          <div className="header-timecode">
            <span className="tc-rec-dot" />
            <span className="tc-label">REC · 24FPS</span>
            <span className="tc-digits">{tc}</span>
          </div>
        </div>

        <nav className="nav nav-strip" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.id}
              href={l.href}
              className="nav-roll-link"
              aria-current={l.id === current ? "page" : undefined}
            >
              <span className="nav-roll-clip">
                <span className="nav-roll-inner" data-text={l.label}>
                  {l.label}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="header-cmdk-btn"
          onClick={() => setCmdOpen(true)}
          aria-label="Open quick reel jumper"
        >
          <span>REELS</span>
          <span className="cmdk-key" aria-hidden="true">
            ⌘K
          </span>
        </button>
      </header>

      {cmdOpen && (
        <div
          className="cmdk-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Reel Jumper"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCmdOpen(false);
          }}
        >
          <div className="cmdk-modal">
            <div className="cmdk-head">
              <span>DIRECTOR REEL INDEX · QUICK JUMP</span>
              <button
                type="button"
                className="cmdk-close"
                onClick={() => setCmdOpen(false)}
              >
                ESC
              </button>
            </div>
            <div className="cmdk-list">
              {QUICK_REELS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="cmdk-item"
                  onClick={() => setCmdOpen(false)}
                >
                  <div>
                    <span className="cmdk-item-title">{item.label}</span>
                    <span className="cmdk-item-meta">{item.code}</span>
                  </div>
                  <span className="cmdk-item-tc" aria-hidden="true">
                    JUMP ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
