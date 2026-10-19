"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HeroSection, SiteSection } from "@/lib/site-content";
import SiteHeader from "./SiteHeader";
import { Arrow, CursorIcon } from "./icons";

/* ------------------------------------------------------------------------
 * Hero interactions, upgraded to Awwwards Director's Cut standard:
 * 1. Ink-reveal name: the name is drawn on a canvas auto-fitted into #slot;
 *    blue metaball "ink" follows the cursor near the letters and reveals an
 *    inflated 3D shader texture inside it. A new texture comes up each time
 *    the ink drains; clicking the name swaps it immediately.
 * 2. Portrait reveal: eases --x/--y/--r on the top portrait's radial mask
 *    and syncs an optical aperture ring (.hero-lens) so a soft circle
 *    reveals the anime illustration underneath.
 * ---------------------------------------------------------------------- */

type Theme = { rim: string; stops: [number, string][]; deco: "sheen" | "sprinkles" | "puffs" };

const THEMES: Theme[] = [
  {
    rim: "#1c2230",
    stops: [
      [0, "#ffffff"],
      [0.26, "#c2cbe0"],
      [0.46, "#ffffff"],
      [0.62, "#7f8ea8"],
      [0.84, "#eef2fa"],
      [1, "#9aa6bd"],
    ],
    deco: "sheen",
  },
  {
    rim: "#3a2704",
    stops: [
      [0, "#fff6d6"],
      [0.34, "#e2b238"],
      [0.5, "#fff8dc"],
      [0.72, "#a37010"],
      [1, "#f0ce6b"],
    ],
    deco: "sheen",
  },
  {
    rim: "#6d1f33",
    stops: [
      [0, "#ffd0dc"],
      [0.5, "#f29cb3"],
      [1, "#df7592"],
    ],
    deco: "sprinkles",
  },
  {
    rim: "#7e899c",
    stops: [
      [0, "#ffffff"],
      [0.55, "#edf1f7"],
      [1, "#cfd7e3"],
    ],
    deco: "puffs",
  },
];

type Box = { x: number; y: number; w: number; h: number };
type Blob = { x: number; y: number; r0: number; r: number; vx: number; vy: number; age: number; hold: number; life: number };
type Elements = {
  hero: HTMLElement;
  canvas: HTMLCanvasElement;
  slot: HTMLElement;
  portrait: HTMLElement;
  real: HTMLElement;
  lens: HTMLElement | null;
};
type Options = { name: string; inkReveal: boolean; revealSize: number };

class InkReveal {
  private blobs: Blob[] = [];
  private theme = 0;
  private ptr: { x: number; y: number; in: boolean } | null = null;
  private fol: { x: number; y: number } | null = null;
  private hadInk = false;
  private rv = { x: -600, y: -600, r: 0, tr: 0, tx: null as number | null, ty: null as number | null };
  private reduced = false;
  private m = document.createElement("canvas");
  private mb = document.createElement("canvas");
  private layer = document.createElement("canvas");
  private tex = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D | null = null;
  private mctx: CanvasRenderingContext2D | null = null;
  private mbctx: CanvasRenderingContext2D | null = null;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private box: Box = { x: 0, y: 0, w: 0, h: 0 };
  private glyph: Box | null = null;
  private band: Box = { x: 0, y: 0, w: 0, h: 0 };
  private fs = 0;
  private asc = 0;
  private cx = 0;
  private ty = 0;
  private unit = 1;
  private ms = 0.75;
  private raf = 0;
  private ro: ResizeObserver | null = null;
  private disposed = false;

  constructor(private els: Elements, private opts: Options) {}

  mount() {
    this.reduced = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("resize", this.onResize);
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.els.hero);
    }
    this.els.hero.addEventListener("pointermove", this.onMove);
    this.els.hero.addEventListener("pointerleave", this.onLeave);
    this.els.hero.addEventListener("pointerdown", this.onDown);
    const go = () => {
      if (this.disposed) return;
      this.resize();
      this.loop();
    };
    if (document.fonts && document.fonts.load) document.fonts.load("900 200px Archivo").then(go, go);
    else go();
  }

  unmount() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.ro?.disconnect();
    this.els.hero.removeEventListener("pointermove", this.onMove);
    this.els.hero.removeEventListener("pointerleave", this.onLeave);
    this.els.hero.removeEventListener("pointerdown", this.onDown);
  }

  private onResize = () => this.resize();

  private word() {
    return this.opts.name || " ";
  }

  private setFont(ctx: CanvasRenderingContext2D, size: number) {
    ctx.font = "900 " + size + 'px Archivo, "Arial Black", sans-serif';
    if ("fontStretch" in ctx) (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "condensed";
  }

  private resize() {
    const { canvas: c, slot } = this.els;
    if (this.disposed) return;
    const r = c.getBoundingClientRect(),
      sr = slot.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width)),
      H = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.box = { x: sr.left - r.left, y: sr.top - r.top, w: sr.width, h: sr.height };
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    this.ctx = c.getContext("2d");
    this.layer.width = this.tex.width = c.width;
    this.layer.height = this.tex.height = c.height;
    const t = this.ctx!;
    this.setFont(t, 100);
    t.textAlign = "center";
    const mt = t.measureText(this.word());
    const L = mt.actualBoundingBoxLeft || 0,
      R = mt.actualBoundingBoxRight || mt.width;
    const asc100 = mt.actualBoundingBoxAscent || 72;
    const b = this.box;
    let fs = (b.w / (L + R)) * 100;
    fs = Math.min(fs, (b.h / asc100) * 100);
    this.fs = fs;
    this.asc = (asc100 * fs) / 100;
    this.cx = b.x + b.w / 2 + ((L - R) * fs) / 200;
    this.ty = b.y + b.h / 2 + this.asc / 2;
    // tight box around the drawn letters; the ink is confined to a padded band around it
    this.glyph = { x: this.cx - (L * fs) / 100, y: this.ty - this.asc, w: ((L + R) * fs) / 100, h: this.asc };
    this.unit = Math.max(0.55, Math.min(1.3, this.glyph.h / 150));
    const g = this.glyph,
      px = 90 * this.unit,
      py = 70 * this.unit;
    const bx = Math.max(0, g.x - px),
      by = Math.max(0, g.y - py);
    this.band = { x: bx, y: by, w: Math.min(W, g.x + g.w + px) - bx, h: Math.min(H, g.y + g.h + py) - by };
    this.ms = 0.75;
    this.m.width = this.mb.width = Math.max(1, Math.ceil(this.band.w * this.ms));
    this.m.height = this.mb.height = Math.max(1, Math.ceil(this.band.h * this.ms));
    this.mctx = this.m.getContext("2d");
    this.mbctx = this.mb.getContext("2d", { willReadFrequently: true });
    this.buildTexture();
  }

  private rng(seed: number) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private buildTexture() {
    if (!this.W) return;
    const th = THEMES[this.theme],
      t = this.tex.getContext("2d")!;
    const { fs, cx, ty, asc, dpr, box } = this,
      word = this.word();
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.clearRect(0, 0, this.tex.width, this.tex.height);
    t.setTransform(dpr, 0, 0, dpr, 0, 0);
    t.globalCompositeOperation = "source-over";
    t.filter = "none";
    this.setFont(t, fs);
    t.textAlign = "center";
    t.lineJoin = "round";
    const top = ty - asc,
      bot = ty,
      x0 = box.x,
      bw = box.w;
    const g = t.createLinearGradient(0, top, 0, bot);
    th.stops.forEach((s) => g.addColorStop(s[0], s[1]));
    t.fillStyle = g;
    t.strokeStyle = g;
    t.lineWidth = fs * 0.075;
    t.strokeText(word, cx, ty);
    t.fillText(word, cx, ty);
    t.globalCompositeOperation = "source-atop";
    const rnd = this.rng(77 + this.theme * 31);
    if (th.deco === "sheen") {
      t.filter = "blur(" + Math.round(fs * 0.02) + "px)";
      for (let i = 0; i < 18; i++) {
        t.fillStyle = "rgba(255,255,255," + (0.38 + rnd() * 0.45) + ")";
        t.save();
        t.translate(x0 + rnd() * bw, (top + bot) / 2);
        t.rotate(-0.35);
        t.fillRect(-fs * (0.01 + rnd() * 0.03), -fs, fs * (0.02 + rnd() * 0.06), fs * 2);
        t.restore();
      }
    } else if (th.deco === "sprinkles") {
      const cols = ["#d11d4b", "#ffffff", "#a70f35", "#ff6a8e", "#f6e7ea"];
      for (let i = 0, n = Math.round(bw * 1.6); i < n; i++) {
        t.fillStyle = cols[Math.floor(rnd() * cols.length)];
        t.save();
        t.translate(x0 + rnd() * bw, top + rnd() * asc);
        t.rotate(rnd() * Math.PI);
        const l = fs * (0.025 + rnd() * 0.025),
          wd = fs * 0.012;
        t.fillRect(-l / 2, -wd / 2, l, wd);
        t.restore();
      }
    } else {
      for (let i = 0, n = Math.round(bw * 0.6); i < n; i++) {
        const x = x0 + rnd() * bw,
          y = top + rnd() * asc,
          r = fs * (0.04 + rnd() * 0.07);
        const rg = t.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        rg.addColorStop(0, "#ffffff");
        rg.addColorStop(0.7, "#f1f3f7");
        rg.addColorStop(1, "rgba(160,170,186,0.9)");
        t.fillStyle = rg;
        t.beginPath();
        t.arc(x, y, r, 0, Math.PI * 2);
        t.fill();
      }
    }
    t.filter = "blur(" + Math.max(1, Math.round(fs * 0.025)) + "px)";
    t.strokeStyle = "rgba(0,0,0,0.4)";
    t.lineWidth = fs * 0.06;
    t.strokeText(word, cx + fs * 0.012, ty + fs * 0.018);
    t.filter = "blur(" + Math.max(1, Math.round(fs * 0.012)) + "px)";
    t.strokeStyle = "rgba(255,255,255,0.82)";
    t.lineWidth = fs * 0.024;
    t.strokeText(word, cx - fs * 0.012, ty - fs * 0.02);
    t.filter = "none";
    t.globalCompositeOperation = "destination-over";
    t.strokeStyle = th.rim;
    t.lineWidth = fs * 0.1;
    t.strokeText(word, cx, ty);
    t.globalCompositeOperation = "source-over";
  }

  private nextTheme() {
    this.theme = (this.theme + 1) % THEMES.length;
    this.buildTexture();
  }

  // Lay ink along the segment from (x0,y0) to (x1,y1); faster strokes leave a slightly fuller trail.
  private feed(x0: number, y0: number, x1: number, y1: number) {
    const u = this.unit,
      d = Math.hypot(x1 - x0, y1 - y0);
    const speed = Math.min(1, d / (36 * u));
    const base = (40 + 18 * speed) * u,
      gap = base * 0.35;
    const steps = Math.max(1, Math.ceil(d / gap));
    for (let s = 1; s <= steps; s++) {
      const k = s / steps,
        hold = 18 + Math.random() * 14;
      this.blobs.push({
        x: x0 + (x1 - x0) * k,
        y: y0 + (y1 - y0) * k,
        r0: base * (0.85 + Math.random() * 0.3),
        r: 0,
        vx: ((x1 - x0) * 0.03) / steps,
        vy: ((y1 - y0) * 0.03) / steps,
        age: 0,
        hold,
        life: hold + 46 + Math.random() * 24,
      });
    }
    if (this.blobs.length > 400) this.blobs.splice(0, this.blobs.length - 400);
    this.hadInk = true;
  }

  private inBand(x: number, y: number) {
    const g = this.glyph;
    if (!g) return false;
    const px = 70 * this.unit,
      py = 50 * this.unit;
    return x > g.x - px && x < g.x + g.w + px && y > g.y - py && y < g.y + g.h + py;
  }

  private loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    if (!this.ctx) return;
    const ink = this.opts.inkReveal && !this.reduced;
    if (ink && this.ptr && this.ptr.in && this.glyph) {
      const g = this.glyph,
        m = 24 * this.unit;
      const tx = Math.max(g.x - m, Math.min(g.x + g.w + m, this.ptr.x));
      const ty = Math.max(g.y + g.h * 0.08, Math.min(g.y + g.h * 0.92, this.ptr.y));
      if (!this.fol) this.fol = { x: tx, y: ty };
      const f = this.fol,
        nx = f.x + (tx - f.x) * 0.3,
        ny = f.y + (ty - f.y) * 0.3;
      if (Math.hypot(nx - f.x, ny - f.y) > 0.75) {
        this.feed(f.x, f.y, nx, ny);
        f.x = nx;
        f.y = ny;
      }
    } else if (!this.blobs.length) this.fol = null;
    const bl = this.blobs;
    for (let i = bl.length - 1; i >= 0; i--) {
      const q = bl[i];
      q.age++;
      q.x += q.vx;
      q.y += q.vy;
      q.vx *= 0.92;
      q.vy *= 0.92;
      const grow = Math.min(1, q.age / 7),
        gIn = 1 - (1 - grow) * (1 - grow);
      const t = Math.max(0, Math.min(1, (q.age - q.hold) / (q.life - q.hold))),
        out = 1 - t * t * (3 - 2 * t);
      q.r = q.r0 * gIn * out;
      if (q.age >= q.life) bl.splice(i, 1);
    }
    if (this.hadInk && !bl.length) {
      this.hadInk = false;
      this.nextTheme();
    }
    // portrait reveal easing
    const rv = this.rv;
    if (rv.tx != null && rv.ty != null) {
      rv.x += (rv.tx - rv.x) * 0.18;
      rv.y += (rv.ty - rv.y) * 0.18;
    }
    rv.r += (rv.tr - rv.r) * 0.12;
    const real = this.els.real;
    const xStr = rv.x.toFixed(1) + "px";
    const yStr = rv.y.toFixed(1) + "px";
    const rVal = Math.max(0, rv.r);
    const rStr = rVal.toFixed(1) + "px";
    real.style.setProperty("--x", xStr);
    real.style.setProperty("--y", yStr);
    real.style.setProperty("--r", rStr);

    if (this.els.lens) {
      this.els.lens.style.setProperty("--x", xStr);
      this.els.lens.style.setProperty("--y", yStr);
      this.els.lens.style.setProperty("--r", rStr);
      this.els.lens.style.opacity = rVal > 6 ? "1" : "0";
    }

    this.draw();
  }

  private draw() {
    const c = this.ctx!,
      { dpr, fs, cx, ty } = this;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.els.canvas.width, this.els.canvas.height);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.setFont(c, fs);
    c.textAlign = "center";
    c.fillStyle = "#f4efe6";
    c.fillText(this.word(), cx, ty);
    if (!this.blobs.length || !this.mctx || !this.mbctx) return;
    const s = this.ms,
      bd = this.band,
      m = this.mctx,
      mb = this.mbctx,
      mw = this.m.width,
      mh = this.m.height;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.fillStyle = "#ffffff";
    m.fillRect(0, 0, mw, mh);
    m.fillStyle = "#000000";
    m.beginPath();
    for (const q of this.blobs) {
      if (q.r < 0.5) continue;
      const x = (q.x - bd.x) * s,
        y = (q.y - bd.y) * s,
        r = q.r * s;
      m.moveTo(x + r, y);
      m.arc(x, y, r, 0, Math.PI * 2);
    }
    m.fill();
    mb.setTransform(1, 0, 0, 1, 0, 0);
    mb.globalCompositeOperation = "copy";
    mb.filter = "blur(" + Math.round(9 * this.unit) + "px)";
    mb.drawImage(this.m, 0, 0);
    mb.filter = "none";
    mb.globalCompositeOperation = "source-over";
    const img = mb.getImageData(0, 0, mw, mh),
      d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      let a = (166 - d[i]) / 24;
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      d[i] = d[i + 1] = d[i + 2] = 0;
      d[i + 3] = a * a * (3 - 2 * a) * 255;
    }
    mb.putImageData(img, 0, 0);
    const L = this.layer.getContext("2d")!;
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalCompositeOperation = "source-over";
    L.clearRect(0, 0, this.layer.width, this.layer.height);
    const rx = Math.floor(bd.x * dpr),
      ry = Math.floor(bd.y * dpr),
      rw = Math.ceil((mw / s) * dpr),
      rh = Math.ceil((mh / s) * dpr);
    const inkGrad = L.createLinearGradient(rx, ry, rx + rw, ry + rh);
    inkGrad.addColorStop(0, "#2d5be3");
    inkGrad.addColorStop(0.5, "#3766e6");
    inkGrad.addColorStop(1, "#4f7df3");
    L.fillStyle = inkGrad;
    L.fillRect(rx, ry, rw, rh);
    L.drawImage(this.tex, rx, ry, rw, rh, rx, ry, rw, rh);
    L.globalCompositeOperation = "destination-in";
    L.imageSmoothingEnabled = true;
    L.imageSmoothingQuality = "high";
    L.drawImage(this.mb, 0, 0, mw, mh, bd.x * dpr, bd.y * dpr, (mw / s) * dpr, (mh / s) * dpr);
    L.globalCompositeOperation = "source-over";
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.layer, 0, 0);
  }

  private onMove = (e: PointerEvent) => {
    if (!this.W) return;
    const r = this.els.canvas.getBoundingClientRect();
    const x = e.clientX - r.left,
      y = e.clientY - r.top;
    if (e.pointerType === "mouse" && !this.reduced) {
      const pr = this.els.portrait.getBoundingClientRect();
      const inside = e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom;
      const px = e.clientX - pr.left,
        py = e.clientY - pr.top;
      if (inside) {
        if (this.rv.r < 4) {
          this.rv.x = px;
          this.rv.y = py;
        }
        this.rv.tx = px;
        this.rv.ty = py;
        this.rv.tr = this.opts.revealSize;
      } else {
        this.rv.tr = 0;
      }
    }
    const nearName = this.inBand(x, y);
    if (!nearName) this.fol = null;
    this.ptr = { x, y, in: nearName };
  };

  private onLeave = () => {
    this.rv.tr = 0;
    this.ptr = null;
    this.fol = null;
  };

  private onDown = (e: PointerEvent) => {
    const r = this.els.canvas.getBoundingClientRect();
    const target = e.target as Element | null;
    if (this.inBand(e.clientX - r.left, e.clientY - r.top) && !(target && target.closest && target.closest("a,button"))) {
      this.nextTheme();
    }
  };
}

export default function Hero({ site, hero }: { site: SiteSection; hero: HeroSection }) {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const realRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [anime, setAnime] = useState(false);
  const word = (site.name || "").toUpperCase();

  useEffect(() => {
    const heroEl = heroRef.current,
      canvas = canvasRef.current,
      slot = slotRef.current,
      portrait = portraitRef.current,
      real = realRef.current,
      lens = lensRef.current;
    if (!heroEl || !canvas || !slot || !portrait || !real) return;
    const engine = new InkReveal(
      { hero: heroEl, canvas, slot, portrait, real, lens },
      { name: word, inkReveal: true, revealSize: 170 },
    );
    engine.mount();
    return () => engine.unmount();
  }, [word]);

  return (
    <section className="hero" id="hero" aria-label="Introduction" ref={heroRef}>
      <div className="hero-portrait" id="portrait" ref={portraitRef}>
        <img src={hero.illustration} alt={hero.illustrationAlt} />
        <img
          className={hero.photo ? "hero-real" : "hero-real is-standin"}
          id="real"
          ref={realRef}
          src={hero.photo || hero.illustration}
          alt={hero.photoAlt}
          style={{ opacity: anime ? 0 : 1 }}
        />
        <div className="hero-lens" ref={lensRef} aria-hidden="true"></div>
        <div className="hero-viewfinder" aria-hidden="true">
          <span className="vf-corner vf-tl"></span>
          <span className="vf-corner vf-tr"></span>
          <span className="vf-corner vf-bl"></span>
          <span className="vf-corner vf-br"></span>
        </div>
        <div className="hero-fade" aria-hidden="true"></div>
        <p className="hero-hint">
          <CursorIcon />
          {hero.hint}
        </p>
        <button
          className="btn btn-sm hero-tap"
          type="button"
          id="tap"
          aria-pressed={anime ? "true" : "false"}
          onClick={() => setAnime((a) => !a)}
        >
          {anime ? "Show my real side" : "See my anime side"}
        </button>
      </div>
      <canvas id="ink" className="hero-ink" aria-hidden="true" ref={canvasRef}></canvas>
      <div className="hero-top">
        <SiteHeader name={site.name} current="home" />
        <div className="hero-slot" id="slot" ref={slotRef}>
          <h1 className="sr-only">{site.name}</h1>
        </div>
        <div className="hero-role">
          <p>{hero.role}</p>
          <span aria-hidden="true"></span>
        </div>
        <p className="hero-line">{hero.tagline}</p>
      </div>
      <div className="hero-bottom">
        <div className="about">
          <p className="eyebrow">{hero.aboutEyebrow}</p>
          <h2>{hero.aboutTitle}</h2>
          <p className="bio">{hero.bio}</p>
          {hero.tags.length > 0 && (
            <ul className="tags" aria-label="Editing keywords">
              {hero.tags.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
          <div className="hero-ctas">
            <Link className="btn" href="/projects">
              {hero.primaryCta}
              <Arrow />
            </Link>
            <Link className="link" href="/contact">
              {hero.secondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
