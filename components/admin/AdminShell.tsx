import { ReactNode } from "react";
import Link from "next/link";
import AdminNav from "./AdminNav";
import SignOutButton from "./SignOutButton";

export default function AdminShell({
  userEmail,
  siteName,
  children,
}: {
  userEmail: string;
  siteName: string;
  children: ReactNode;
}) {
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <span className="brand">{siteName}</span>
          <span className="adm-tag">CMS</span>
        </Link>
        <AdminNav />
      </aside>

      <div>
        <header className="adm-top">
          <span className="adm-user">{userEmail}</span>
          <SignOutButton />
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
