import Link from "next/link";
import type { SiteSection } from "@/lib/site-content";
import type { PageId } from "./SiteHeader";

const PAGES: { id: PageId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "projects", href: "/projects", label: "Projects" },
  { id: "contact", href: "/contact", label: "Contact" },
];

/** Email / LinkedIn plus links to the two other pages, repeated on every page. */
export default function SiteFooter({ site, current }: { site: SiteSection; current: PageId }) {
  return (
    <footer className="site-footer">
      <span className="brand">{site.name}</span>
      <nav className="nav" aria-label="Footer">
        <a href={`mailto:${site.email}`}>Email me</a>
        <a href={site.linkedin}>LinkedIn</a>
        {PAGES.filter((p) => p.id !== current).map((p) => (
          <Link key={p.id} href={p.href}>
            {p.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
