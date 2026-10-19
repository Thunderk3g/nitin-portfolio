"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPOTLIGHT_SELECTOR =
  ".cat-media, .reel, .clip-media, .adm-card, .media-tile, .about, .cta-inner, .contact-card, .player";
const MAGNETIC_SELECTOR = ".btn, .btn-ghost, .feature-go";

/**
 * CinemaMotion: Awwwards-tier motion & haptic interaction engine.
 * - GSAP ScrollTrigger sticky-stack depth choreography for featured reels
 * - Scroll-scrubbed parallax & reveal tension across editorial sections
 * - Zero-rerender pointer spotlight tracking (--spot-x, --spot-y)
 * - Magnetic button pull physics (--mag-x, --mag-y)
 * Automatically degrades to static under prefers-reduced-motion: reduce.
 */
export default function CinemaMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) return;

    // 1. GSAP ScrollTrigger Choreography
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

      // Subtle scroll-linked parallax on category media frames
      const catCards = gsap.utils.toArray<HTMLElement>(".work .cat");
      catCards.forEach((cat, i) => {
        const ph = cat.querySelector<HTMLElement>(".cat-media");
        if (!ph) return;
        gsap.fromTo(
          ph,
          { y: i % 2 === 0 ? 14 : 26 },
          {
            y: i % 2 === 0 ? -10 : -20,
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
    });

    // 2. Zero-rerender Pointer Spotlight & Magnetic Physics
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
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      if (activeMag) {
        activeMag.style.setProperty("--mag-x", "0px");
        activeMag.style.setProperty("--mag-y", "0px");
      }
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
