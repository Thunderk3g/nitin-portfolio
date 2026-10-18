import Link from "next/link";

export type PageId = "home" | "projects" | "contact";

const LINKS: { id: PageId; href: string; label: string }[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "projects", href: "/projects", label: "Projects" },
  { id: "contact", href: "/contact", label: "Contact" },
];

export default function SiteHeader({
  name,
  current,
  className = "",
}: {
  name: string;
  current: PageId;
  className?: string;
}) {
  return (
    <header className={`site-header ${className}`.trim()}>
      <Link className="brand" href="/">
        {name}
      </Link>
      <span className="brand-rule" aria-hidden="true"></span>
      <nav className="nav" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.id} href={l.href} aria-current={l.id === current ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
