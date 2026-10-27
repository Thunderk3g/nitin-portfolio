"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPOTLIGHT_SELECTOR =
  ".cat-media, .cat-row, .reel, .clip-media, .adm-card, .media-tile, .about, .cta-inner, .contact-card, .player, .nle-program-monitor, .theater-scope-bezel, .craft-wipe-bezel, .partner-bento-tile";
const MAGNETIC_SELECTOR = ".btn, .btn-ghost, .feature-go";

/**
 * CinemaMotion: Awwwards-tier fluid scroll & haptic interaction engine.
 * - Top Cinema Timecode Scroll Progress Bar
 * - Fluid inertia wheel smoothing on desktop pointers (synced with ScrollTrigger)
 * - GSAP ScrollTrigger sticky-stack depth & section reveal choreography
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

    // Update top scroll progress bar
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

    // 1. Fluid Wheel Smooth Scroll (Desktop Mouse Wheel Inertia)
    let smoothTargetY = window.scrollY;
    let smoothCurrentY = window.scrollY;
    let smoothRaf = 0;
    let isWheelSmoothing = false;

    const tickSmoothScroll = () => {
      const diff = smoothTargetY - smoothCurrentY;
      if (Math.abs(diff) > 0.6) {
        smoothCurrentY += diff * 0.14;
        window.scrollTo(0, smoothCurrentY);
        ScrollTrigger.update();
        smoothRaf = requestAnimationFrame(tickSmoothScroll);
      } else {
        smoothCurrentY = smoothTargetY;
        window.scrollTo(0, smoothTargetY);
        isWheelSmoothing = false;
        smoothRaf = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Skip smooth wheel if modal is open, modifier keys pressed, or inside scrollable element
      if (document.body.style.overflow === "hidden" || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".player-backdrop, .cmdk-backdrop, .adm-modal, .adm-side")) return;
      // Only apply on standard vertical wheel steps
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      e.preventDefault();
      if (!isWheelSmoothing) {
        smoothCurrentY = window.scrollY;
        smoothTargetY = window.scrollY;
        isWheelSmoothing = true;
      }
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      smoothTargetY = Math.max(0, Math.min(maxScroll, smoothTargetY + e.deltaY * 0.95));
      if (!smoothRaf) {
        smoothRaf = requestAnimationFrame(tickSmoothScroll);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });

    // 2. GSAP ScrollTrigger Choreography across all 8 Component Picks
    const ctx = gsap.context(() => {
      // Sticky-stack 3D depth on Home featured panels
      const features = gsap.utils.toArray<HTMLElement>(".features .feature");
      features.forEach((card, i) => {
        if (i < features.length - 1) {
          const nextCard = features[i + 1];
          gsap.to(card, {
            scale: 0.935,
            opacity: 0.48,
            ease: "none",
            scrollTrigger: {
              trigger: nextCard,
              start: "top bottom",
              end: "top top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        }

        const inner = card.querySelector<HTMLElement>(".feature-inner");
        if (inner) {
          gsap.fromTo(
            inner,
            { y: 36, opacity: 0.65 },
            {
              y: 0,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                end: "top 20%",
                scrub: 0.5,
              },
            },
          );
        }
      });

      // Scroll-linked parallax on Pick C editorial category rows
      const catCards = gsap.utils.toArray<HTMLElement>(".work .cat");
      catCards.forEach((cat, i) => {
        const ph = cat.querySelector<HTMLElement>(".cat-media");
        if (!ph) return;
        gsap.fromTo(
          ph,
          { y: i % 2 === 0 ? 10 : 18 },
          {
            y: i % 2 === 0 ? -8 : -14,
            ease: "none",
            scrollTrigger: {
              trigger: cat,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
      });

      // Cinema stages subtle scale-in tension on scroll
      const stages = gsap.utils.toArray<HTMLElement>(
        ".nle-program-monitor, .theater-scope-bezel, .craft-wipe-bezel, .cta-inner",
      );
      stages.forEach((stage) => {
        gsap.fromTo(
          stage,
          { y: 28, scale: 0.985 },
          {
            y: 0,
            scale: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: stage,
              start: "top 92%",
              end: "top 45%",
              scrub: 0.65,
            },
          },
        );
      });

      // Giant Footer Wordmark rise on scroll
      const giantWord = document.querySelector<HTMLElement>(".footer-giant-wordmark span");
      if (giantWord) {
        gsap.fromTo(
          giantWord,
          { yPercent: 18 },
          {
            yPercent: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".site-footer-wrap",
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.6,
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

      // Spotlight surface coordinates
      const spotEl = target.closest<HTMLElement>(SPOTLIGHT_SELECTOR);
      if (spotEl) {
        const rect = spotEl.getBoundingClientRect();
        spotEl.style.setProperty("--spot-x", `${(e.clientX - rect.left).toFixed(1)}px`);
        spotEl.style.setProperty("--spot-y", `${(e.clientY - rect.top).toFixed(1)}px`);
      }

      // Magnetic button pull
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
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onPointerMove);
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
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
