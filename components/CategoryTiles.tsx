import type { Category } from "@/lib/site-content";
import { mediaStyle } from "@/lib/media-style";
import { Arrow } from "./icons";

/**
 * The two-column category tiles (home "Selected work" and the Projects index).
 * `hrefPrefix` is "/projects#" from home and "#" on the Projects page itself.
 * Plain anchors so in-page hash routing stays native.
 */
export default function CategoryTiles({
  items,
  hrefPrefix,
}: {
  items: Category[];
  hrefPrefix: string;
}) {
  return (
    <div className="cats">
      {items.map((c) => (
        <a key={c.slug} className="cat" href={`${hrefPrefix}${c.slug}`}>
          <span className="cat-media">
            <span className={c.thumbnail ? "ph ph-img" : "ph"} style={mediaStyle(c.tone, c.thumbnail)}>
              {!c.thumbnail && <span className="ph-label">[Category thumbnail]</span>}
            </span>
          </span>
          <span className="cat-body">
            <span className="cat-title">
              {c.title}
              <Arrow />
            </span>
            <span className="cat-desc">{c.desc}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
