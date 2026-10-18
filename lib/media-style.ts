import type { CSSProperties } from "react";

/** CSS `url()` with the value quoted and escaped. */
export function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}

/** Placeholder tone, or the uploaded image as a cover background. */
export function mediaStyle(tone: string, image?: string): CSSProperties {
  const style = { "--ph": tone } as CSSProperties;
  if (image) style.backgroundImage = cssUrl(image);
  return style;
}

/**
 * Like mediaStyle, but keeps the bottom shade of `.ph` over the image so the
 * overlaid titles on reel cards and featured panels stay readable.
 */
export function shadedMediaStyle(tone: string, image?: string): CSSProperties {
  const style = { "--ph": tone } as CSSProperties;
  if (image) {
    style.backgroundImage = `linear-gradient(180deg,transparent 40%,rgba(12,13,17,.55)), ${cssUrl(image)}`;
  }
  return style;
}
