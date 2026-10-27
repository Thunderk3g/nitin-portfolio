import Link from "next/link";
import type { SiteContent } from "@/lib/site-content";
import { shadedMediaStyle } from "@/lib/media-style";
import Hero from "./Hero";
import CategoryTiles from "./CategoryTiles";
import WorkReelTimeline from "./WorkReelTimeline";
import AnamorphicTheaterDeck from "./AnamorphicTheaterDeck";
import CraftGradeWipe from "./CraftGradeWipe";
import SiteFooter from "./SiteFooter";
import { Arrow } from "./icons";

function getMonogram(name: string, index: number): string {
  const cleaned = name.replace(/[\[\]]/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || `P${index + 1}`;
}

export default function HomePage({ content }: { content: SiteContent }) {
  const { site, hero, categories, allwork, craft, partners, cta } = content;

  return (
    <>
      <a className="skip" href="#work">
        Skip to content
      </a>

      <Hero site={site} hero={hero} />

      <main>
        {/* Component 03 · Pick C: Editorial Index + Morph Monitor */}
        <section className="work wrap" id="work" aria-labelledby="work-title">
          <div className="work-head-pick-c">
            <div>
              <p className="eyebrow">03 / SELECTED DISCIPLINES · 4 FORMATS</p>
              <h2 className="display section-title" id="work-title">
                {categories.homeTitle}
              </h2>
            </div>
            <p className="work-sub-pick-c">
              Hover any row to engage the hardware aspect-ratio monitor (9:16 vertical vs. 16:9 widescreen).
            </p>
          </div>
          <CategoryTiles items={categories.items} hrefPrefix="/projects#" />
        </section>

        {/* Component 04 · Pick B: Interactive NLE Timeline Scrubber + Continuous Reel Strip */}
        <section className="allwork allwork-pick-b" aria-labelledby="allwork-title">
          <div className="wrap allwork-head">
            <div>
              <p className="eyebrow">04 / INTERACTIVE NLE TIMELINE SCRUBBER</p>
              <h2 className="display section-title" id="allwork-title">
                {allwork.title}
              </h2>
            </div>
            <Link className="btn-ghost" href="/projects">
              {allwork.ctaLabel}
              <Arrow />
            </Link>
          </div>

          <WorkReelTimeline reels={allwork.reels} />

          <div className="marquee" aria-label="Showreel highlights">
            <div className="marquee-track">
              {[0, 1].map((dup) =>
                allwork.reels.map((r, i) => (
                  <Link
                    key={`${dup}-${i}`}
                    className="reel ph ph-img"
                    style={shadedMediaStyle(r.tone, r.poster)}
                    href={r.href}
                    aria-hidden={dup ? "true" : undefined}
                    tabIndex={dup ? -1 : undefined}
                  >
                    {!r.poster && <span className="ph-label">[Reel clip {i + 1}]</span>}
                    <span className="reel-kind">{r.kind}</span>
                    <span className="reel-title display">{r.title}</span>
                  </Link>
                )),
              )}
            </div>
          </div>

          {/* Component 05 · Pick C: 2.39:1 Anamorphic Theater Deck */}
          <AnamorphicTheaterDeck featured={allwork.featured} title={allwork.featuredTitle} />
        </section>

        {/* Component 06 · Pick A: RAW LOG vs. Final Grade Wipe */}
        <CraftGradeWipe craft={craft} />

        {/* Component 08 · Pick A: Monogram Partner Bento Grid + Continuous Marquee */}
        <section className="partners partners-pick-a" aria-labelledby="partners-title">
          <div className="wrap partners-bento-head">
            <p className="eyebrow">08 / COLLABORATORS & PRODUCTION PARTNERS</p>
            <h2 className="display" id="partners-title">
              {partners.title}
            </h2>
          </div>

          {/* Monogram Bento Grid (Pick A) */}
          <div className="wrap partners-bento-grid" aria-hidden="true">
            {partners.items.slice(0, 8).map((p, i) => (
              <div key={i} className="partner-bento-tile">
                <div className="partner-bento-top">
                  <span className="partner-bento-mono">{getMonogram(p.name, i)}</span>
                  <span className="partner-bento-idx">0{i + 1}</span>
                </div>
                {p.logo ? (
                  <img className="partner-bento-img" src={p.logo} alt={p.name} />
                ) : (
                  <strong className="partner-bento-name">{p.name}</strong>
                )}
                <span className="partner-bento-role">PRODUCTION PARTNER</span>
              </div>
            ))}
          </div>

          <p className="partners-label">{partners.label}</p>
          <div className="marquee" aria-label="Partner logos">
            <ul className="marquee-track marquee-fast">
              {[0, 1].map((dup) =>
                partners.items.map((p, i) => (
                  <li
                    key={`${dup}-${i}`}
                    className={p.logo ? "logo has-img" : "logo"}
                    aria-hidden={dup ? "true" : undefined}
                  >
                    {p.logo ? <img className="logo-img" src={p.logo} alt={p.name} /> : p.name}
                  </li>
                )),
              )}
            </ul>
          </div>
        </section>

        {/* Component 08 · Pick A: Double-Bezel Anamorphic Glow CTA */}
        <section className="cta wrap cta-pick-a" aria-labelledby="cta-title">
          <div className="cta-inner">
            <div className="cta-copy-block">
              <p className="eyebrow">READY FOR FINAL CUT // BOOKING Q2-Q3</p>
              <h2 className="display" id="cta-title">
                {cta.title}
              </h2>
            </div>
            <div className="cta-action-block">
              <Link className="btn" href="/contact">
                {cta.buttonLabel}
                <Arrow />
              </Link>
              <span className="cta-response-meta">RESPONSE TIME: &lt; 24 HOURS · IST (UTC+5:30)</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter name={site.name} current="home" />
    </>
  );
}
