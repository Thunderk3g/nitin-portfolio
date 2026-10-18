import type { SiteContent } from "@/lib/site-content";
import { shadedMediaStyle } from "@/lib/media-style";
import Hero from "./Hero";
import CategoryTiles from "./CategoryTiles";
import SiteFooter from "./SiteFooter";
import { Arrow } from "./icons";

/** Home: hero, selected work, work reel + featured, partners, CTA, footer. */
export default function HomePage({ content }: { content: SiteContent }) {
  const { site, hero, categories, allwork, partners, cta } = content;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <main id="main">
        <Hero site={site} hero={hero} />

        <section className="work wrap" aria-labelledby="work-title">
          <h2 id="work-title" className="display section-title">
            {categories.homeTitle}
          </h2>
          <CategoryTiles items={categories.items} hrefPrefix="/projects#" />
        </section>

        <section id="all-work" className="allwork" aria-labelledby="allwork-title">
          <div className="wrap allwork-head">
            <h2 id="allwork-title" className="display section-title">
              {allwork.title}
            </h2>
            <a className="btn-ghost" href="/projects">
              {allwork.ctaLabel}
              <Arrow />
            </a>
          </div>
          {allwork.reels.length > 0 && (
            <div className="marquee">
              <div className="marquee-track">
                {[false, true].map((copy) =>
                  allwork.reels.map((r, i) => (
                    <a
                      key={`${copy ? "c" : "o"}${i}`}
                      className={r.poster ? "reel ph ph-img" : "reel ph"}
                      href={r.href || "/projects"}
                      style={shadedMediaStyle(r.tone, r.poster)}
                      {...(copy ? { "aria-hidden": true, tabIndex: -1 } : {})}
                    >
                      <span className="reel-kind">{r.kind}</span>
                      <span className="display reel-title">{r.title}</span>
                    </a>
                  )),
                )}
              </div>
            </div>
          )}
          {allwork.featured.length > 0 && (
            <div className="features">
              {allwork.featured.map((f, i) => (
                <a
                  key={i}
                  className={f.poster ? "feature ph ph-img" : "feature ph"}
                  href={f.href || "/projects"}
                  style={shadedMediaStyle(f.tone, f.poster)}
                >
                  <span className="feature-inner">
                    <span className="feature-text">
                      <span className="feature-kind">Featured · {f.kind}</span>
                      <span className="display feature-title">{f.title}</span>
                    </span>
                    <span className="feature-go" aria-hidden="true">
                      <Arrow size={20} />
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        {partners.items.length > 0 && (
          <section id="partners" className="partners" aria-labelledby="partners-title">
            <h2 id="partners-title" className="display">
              {partners.title}
            </h2>
            <p className="partners-label">{partners.label}</p>
            <div className="marquee">
              <ul className="marquee-track marquee-fast">
                {[false, true].map((copy) =>
                  partners.items.map((p, i) => (
                    <li
                      key={`${copy ? "c" : "o"}${i}`}
                      className={p.logo ? "logo has-img" : "logo"}
                      {...(copy ? { "aria-hidden": true } : {})}
                    >
                      {p.logo ? <img className="logo-img" src={p.logo} alt={p.name} /> : p.name}
                    </li>
                  )),
                )}
              </ul>
            </div>
          </section>
        )}

        <section className="cta wrap" aria-labelledby="cta-title">
          <div className="cta-inner">
            <h2 id="cta-title" className="display">
              {cta.title}
            </h2>
            <a className="btn" href="/contact">
              {cta.buttonLabel}
              <Arrow />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter site={site} current="home" />
    </>
  );
}
