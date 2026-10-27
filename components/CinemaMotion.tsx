"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPOTLIGHT_SELECTOR =
  ".cat-media, .cat-row, .reel, .clip-media, .adm-card, .media-tile, .about, .cta-inner, .contact-card, .player, .nle-program-monitor, .theater-scope-bezel, .craft-wipe-bezel, .partner-bento-tile";
const MAGNETIC_SELECTOR = ".btn, .btn-ghost, .feature-go";

/**
 * CinemaMotion: Awwwards-tier Lenis Smooth Scroll & GSAP ScrollTrigger engine.
 * - Real Lenis smooth scroll synced to gsap.ticker + ScrollTrigger.update
 * - Top Cinema Timecode Scroll Progress Bar
 * - Scroll-scrubbed parallax, optical stage expansion, and staggered section tension
 * - Zero-rerender pointer spotlight tracking (--spot-x, --spot-y)
 * - Magnetic button pull physics (--mag-x, --mag-y)
 * Automatically degrades to static under prefers-reduced-motion: reduce.
 */
export default function CinemaMotion() {
  const pathname = usePathname();
  const barFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateScrollProgress = () => {
      if (!barFillRef.current) return;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.max(0, Math.min(100, (window.scrollY / maxScroll) * 100));
      barFillRef.current.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
    };
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    if (reduced) {
      return () => {
        window.removeEventListener("scroll", updateScrollProgress);
      };
    }

    // 1. Lenis Smooth Scroll Engine synced with GSAP Ticker + ScrollTrigger
    const lenis = new Lenis({
      duration: 1.08,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      prevent: (node: HTMLElement) =>
        document.body.style.overflow === "hidden" ||
        Boolean(node?.closest?.(".player-backdrop, .cmdk-backdrop, .adm-modal, .adm-side")),
    });

    lenis.on("scroll", () => {
      ScrollTrigger.update();
      updateScrollProgress();
    });

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Handle hash anchor links smoothly via Lenis
    const onAnchorClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.("a[href^='#'], a[href^='/#']") as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      const hashIdx = href.indexOf("#");
      if (hashIdx === -1) return;
      const id = href.slice(hashIdx + 1);
      if (!id || id.includes("/")) return;
      const el = document.getElementById(id);
      if (el && (href.startsWith("#") || window.location.pathname === "/")) {
        lenis.scrollTo(el, { offset: -24, duration: 1.1 });
      }
    };
    document.addEventListener("click", onAnchorClick);

    // 2. GSAP ScrollTrigger Choreography across all 8 Component Picks
    const ctx = gsap.context(() => {
      // Hero portrait & ink canvas depth parallax
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        const portraitImgs = heroEl.querySelectorAll<HTMLElement>(".hero-portrait img");
        if (portraitImgs.length) {
          gsap.fromTo(
            portraitImgs,
            { yPercent: 0, scale: 1 },
            {
              yPercent: 9,
              scale: 1.045,
              ease: "none",
              scrollTrigger: {
                trigger: heroEl,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
      }

      // Section headers scrubbed entrance
      const headers = gsap.utils.toArray<HTMLElement>(
        ".work-head-pick-c, .allwork-head, .theater-deck-header, .craft-grade-head, .partners-bento-head",
      );
      headers.forEach((head) => {
        gsap.fromTo(
          head,
          { y: 34 },
          {
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: head,
              start: "top 95%",
              end: "top 55%",
              scrub: 0.4,
            },
          },
        );
      });

      // Editorial Category Rows (03 · Pick C) staggered scroll glide
      const catRows = gsap.utils.toArray<HTMLElement>(".work .cat.cat-row");
      catRows.forEach((row) => {
        gsap.fromTo(
          row,
          { y: 28 },
          {
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 94%",
              end: "top 60%",
              scrub: 0.4,
            },
          },
        );
      });

      // Widescreen Cinema Stages optical zoom-in on scroll
      const stages = gsap.utils.toArray<HTMLElement>(
        ".nle-program-monitor, .theater-scope-bezel, .craft-wipe-bezel, .cta-inner",
      );
      stages.forEach((stage) => {
        gsap.fromTo(
          stage,
          { y: 40, scale: 0.965 },
          {
            y: 0,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: stage,
              start: "top 94%",
              end: "top 48%",
              scrub: 0.5,
            },
          },
        );
      });

      // Partner Monogram Bento Tiles cascade
      const bentoTiles = gsap.utils.toArray<HTMLElement>(".partner-bento-tile");
      bentoTiles.forEach((tile, i) => {
        gsap.fromTo(
          tile,
          { y: 24 + (i % 4) * 8 },
          {
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: tile,
              start: "top 95%",
              end: "top 62%",
              scrub: 0.4,
            },
          },
        );
      });

      // Giant Footer Wordmark rise on scroll
      const giantWord = document.querySelector<HTMLElement>(".footer-giant-wordmark span");
      if (giantWord) {
        gsap.fromTo(
          giantWord,
          { yPercent: 24 },
          {
            yPercent: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".site-footer-wrap",
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.4,
            },
          },
        );
      }
    });

    // 3. Zero-rerender Pointer Spotlight & Magnetic Physics
    let activeMag: HTMLElement | null = null;
    let magTargetX = 0;
    let magTargetY = 0;
    let magCurX = 0;
    let magCurY = 0;
    let rafId = 0;

    const tickMagnetic = () => {
      rafId = 0;
      if (!activeMag) return;
      magCurX += (magTargetX - magCurX) * 0.22;
      magCurY += (magTargetY - magCurY) * 0.22;
      activeMag.style.setProperty("--mag-x", `${magCurX.toFixed(2)}px`);
      activeMag.style.setProperty("--mag-y", `${magCurY.toFixed(2)}px`);
      if (Math.hypot(magTargetX - magCurX, magTargetY - magCurY) > 0.15) {
        rafId = requestAnimationFrame(tickMagnetic);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target as Element | null;
      if (!target || !target.closest) return;

      const spotEl = target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (spotEl) {
        const rect = spotEl.getBoundingClientRect();
        spotEl.style.setProperty("--spot-x", `${(e.clientX - rect.left).toFixed(1)}px`);
        spotEl.style.setProperty("--spot-y", `${(e.clientY - rect.top).toFixed(1)}px`);
      }

      const magEl = target.closest<HTMLElement>(MAGNETIC_SELECTOR);
      if (magEl) {
        if (activeMag && activeMag !== magEl) {
          activeMag.style.setProperty("--mag-x", "0px");
          activeMag.style.setProperty("--mag-y", "0px");
          magCurX = 0;
          magCurY = 0;
        }
        activeMag = magEl;
        const r = magEl.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        magTargetX = Math.max(-8, Math.min(8, dx * 0.18));
        magTargetY = Math.max(-5, Math.min(5, dy * 0.22));
        if (!rafId) rafId = requestAnimationFrame(tickMagnetic);
      } else if (activeMag) {
        activeMag.style.setProperty("--mag-x", "0px");
        activeMag.style.setProperty("--mag-y", "0px");
        activeMag = null;
        magTargetX = 0;
        magTargetY = 0;
        magCurX = 0;
        magCurY = 0;
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("pointermove", onPointerMove);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      if (rafId) cancelAnimationFrame(rafId);
      if (activeMag) {
        activeMag.style.setProperty("--mag-x", "0px");
        activeMag.style.setProperty("--mag-y", "0px");
      }
      ctx.revert();
    };
  }, [pathname]);

  return (
    <div className="cinema-scroll-bar" aria-hidden="true">
      <div className="cinema-scroll-fill" ref={barFillRef} />
    </div>
  );
}
