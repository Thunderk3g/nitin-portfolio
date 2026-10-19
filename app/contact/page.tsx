import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { LinkedInIcon, MailIcon } from "@/components/icons";
import { loadSiteContent } from "@/lib/content-cache";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await loadSiteContent();
  const title = `Contact | ${site.name}`;
  return {
    title,
    description: `Contact ${site.name}, video editor, for project enquiries and collaborations.`,
    openGraph: { title, type: "website" },
  };
}

export default async function ContactPage() {
  const { site, contact } = await loadSiteContent();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="page">
        <SiteHeader name={site.name} current="contact" className="page-header" />
        <main id="main" className="contact">
          <div className="wrap">
            <div className="contact-card">
              <p className="eyebrow">{contact.eyebrow}</p>
              <h1 className="display">{contact.title}</h1>
              <p className="lede">{contact.lede}</p>
              <div className="contact-actions">
                <a className="btn" href={`mailto:${site.email}`}>
                  <MailIcon />
                  {contact.emailLabel}
                </a>
                <a className="btn-ghost" href={site.linkedin}>
                  <LinkedInIcon />
                  {contact.linkedinLabel}
                </a>
              </div>
              <p className="contact-direct">
                {site.email} · {site.linkedin}
              </p>
            </div>
          </div>
        </main>
        <SiteFooter site={site} current="contact" />
      </div>
    </>
  );
}
