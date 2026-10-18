"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [
  ["/admin", "Dashboard"],
  ["/admin/content", "Site Content"],
  ["/admin/projects", "Projects"],
  ["/admin/media", "Media"],
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "contents" }} aria-label="Admin">
      {LINKS.map(([href, label]) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={"adm-sidelink" + (active ? " active" : "")}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
      <a href="/" target="_blank" rel="noopener noreferrer" className="adm-sidelink" style={{ marginTop: "auto" }}>
        View site ↗
      </a>
    </nav>
  );
}
