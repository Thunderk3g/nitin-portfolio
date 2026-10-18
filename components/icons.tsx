/** Inline SVG icons from the prototype (same paths, sizes and strokes). */

export function Arrow({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="arrow"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10h14M12 5l5 5-5 5" />
    </svg>
  );
}

export function BackArrow() {
  return (
    <svg
      className="arrow arrow-back"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 10H3M8 5l-5 5 5 5" />
    </svg>
  );
}

export function PlayBadge() {
  return (
    <span className="play" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="#fff">
        <path d="M5 3.5v11l9-5.5z" />
      </svg>
    </span>
  );
}

export function CursorIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 2l9.5 5-4.2 1.2L6.8 12.5z" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 5.5l7 5.5 7-5.5" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" />
      <path d="M6.5 9v5M6.5 6.2v.1M10 14v-5M10 11.5c0-1.5 1-2.5 2.2-2.5S14 10 14 11.5V14" />
    </svg>
  );
}
