"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteSection } from "@/lib/site-content";
import type { PageId } from "./SiteHeader";

/**
 * Component 08 · Pick A: Giant Floor-to-Ceiling Wordmark Footer
 * Includes live IST studio clock, availability beacon, footer nav, and
 * oversized condensed display wordmark.
 */
export default function SiteFooter({
  site,
  name,
  current,
}: {
  site?: SiteSection;
  name?: string;
  current: PageId;
}) {
  const brandName = site?.name || name || "Nitin Wagh";
  const [istTime, setIstTime] = useState("IST · 18:42:00");

  useEffect(() => {
    const updateClock = () => {
      try {
        const formatted = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
        setIstTime(`IST · ${formatted}`);
      } catch {
        setIstTime("IST · LIVE");
      }
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <footer className="site-footer-wrap">
      <div className="site-footer">
        <div className="footer-brand-cluster">
          <Link className="brand" href="/">
            {brandName}
          </Link>
          <span className="footer-status-pill" aria-hidden="true">
            <span className="footer-status-dot" />
            AVAILABLE FOR NEW PROJECTS
          </span>
          <span className="footer-clock-pill" aria-hidden="true">
            {istTime}
          </span>
        </div>

        <nav className="nav" aria-label="Footer">
          <Link href="/" aria-current={current === "home" ? "page" : undefined}>
            Home
          </Link>
          <Link href="/projects" aria-current={current === "projects" ? "page" : undefined}>
            Projects
          </Link>
          <Link href="/contact" aria-current={current === "contact" ? "page" : undefined}>
            Contact
          </Link>
        </nav>
      </div>

      {/* Giant Floor-to-Ceiling Wordmark (Pick A) */}
      <div className="footer-giant-wordmark display" aria-hidden="true">
        <span>{brandName}</span>
      </div>
    </footer>
  );
}
