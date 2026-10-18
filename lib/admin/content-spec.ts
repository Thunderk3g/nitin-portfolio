/**
 * Presentation specs that drive the generic Site Content editor. Each section
 * maps to one row in `site_content`; the editor renders friendly inputs from
 * these specs and saves the whole section object back. Shapes mirror
 * lib/site-content.ts (SiteContent).
 */

import type { MediaKind } from "@/lib/media/config";

export type SelectOption = { value: string; label: string };

export type ItemField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "stringlist" | "media" | "color" | "select";
  /** For `media`: which files the picker/upload accepts. */
  accept?: MediaKind;
  /** For `select`. */
  options?: SelectOption[];
  hint?: string;
};

export type Field =
  | { kind: "text" | "textarea"; path: string; label: string; placeholder?: string; hint?: string }
  | { kind: "stringlist"; path: string; label: string }
  | { kind: "media"; path: string; label: string; accept: MediaKind; hint?: string }
  | {
      kind: "list";
      path: string;
      label: string;
      itemLabel: string;
      itemFields: ItemField[];
    };

export type SectionSpec = {
  key: string;
  label: string;
  description: string;
  fields: Field[];
};

const posterItemFields: ItemField[] = [
  { key: "kind", label: "Type (Brand film, Campaign…)", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "poster", label: "Poster image", type: "media", accept: "image" },
  {
    key: "tone",
    label: "Placeholder colour",
    type: "color",
    hint: "Shown when there is no poster image.",
  },
  { key: "href", label: "Link", type: "text", hint: "e.g. /projects or /projects#saas" },
];

export const SECTION_SPECS: SectionSpec[] = [
  {
    key: "site",
    label: "General",
    description: "Name, page title, SEO description, email and LinkedIn (used in the header, footer and contact page).",
    fields: [
      { kind: "text", path: "name", label: "Name", hint: "Also drawn as the ink-reveal name in the hero." },
      { kind: "text", path: "title", label: "Home page browser title" },
      { kind: "textarea", path: "metaDescription", label: "SEO description" },
      { kind: "text", path: "email", label: "Email address" },
      { kind: "text", path: "linkedin", label: "LinkedIn profile URL" },
    ],
  },
  {
    key: "hero",
    label: "Hero & About",
    description: "Role line, portrait images and the About column next to the portrait.",
    fields: [
      { kind: "text", path: "role", label: "Role line" },
      { kind: "text", path: "tagline", label: "Tagline" },
      { kind: "text", path: "hint", label: "Cursor hint" },
      { kind: "media", path: "illustration", label: "Illustration (revealed under the cursor)", accept: "image" },
      { kind: "text", path: "illustrationAlt", label: "Illustration alt text" },
      {
        kind: "media",
        path: "photo",
        label: "Real photo (on top)",
        accept: "image",
        hint: "Match the illustration's pose and crop. Leave empty to use a greyscale stand-in.",
      },
      { kind: "text", path: "photoAlt", label: "Photo alt text" },
      { kind: "text", path: "aboutEyebrow", label: "About eyebrow" },
      { kind: "text", path: "aboutTitle", label: "About heading" },
      { kind: "textarea", path: "bio", label: "Bio" },
      { kind: "stringlist", path: "tags", label: "Skill tags" },
      { kind: "text", path: "primaryCta", label: "Primary button label" },
      { kind: "text", path: "secondaryCta", label: "Secondary link label" },
    ],
  },
  {
    key: "categories",
    label: "Project categories",
    description: "The category tiles on the home and Projects pages. Projects are grouped by category slug.",
    fields: [
      { kind: "text", path: "homeTitle", label: "Home section title" },
      { kind: "text", path: "pageTitle", label: "Projects page title" },
      { kind: "textarea", path: "pageLede", label: "Projects page intro" },
      {
        kind: "list",
        path: "items",
        label: "Categories",
        itemLabel: "Category",
        itemFields: [
          {
            key: "slug",
            label: "Slug",
            type: "text",
            hint: "Lowercase-with-hyphens. Used in the URL (/projects#slug) and to group projects.",
          },
          { key: "title", label: "Title", type: "text" },
          { key: "desc", label: "Description", type: "textarea" },
          {
            key: "orientation",
            label: "Video format",
            type: "select",
            options: [
              { value: "vertical", label: "Vertical 9:16" },
              { value: "landscape", label: "Landscape 16:9" },
            ],
          },
          { key: "thumbnail", label: "Thumbnail", type: "media", accept: "image" },
          {
            key: "tone",
            label: "Placeholder colour",
            type: "color",
            hint: "Shown when there is no thumbnail or poster.",
          },
        ],
      },
    ],
  },
  {
    key: "allwork",
    label: "Work reel & featured",
    description: "The auto-scrolling poster reel and the three sticky featured panels on the home page.",
    fields: [
      { kind: "text", path: "title", label: "Section title" },
      { kind: "text", path: "ctaLabel", label: "Button label" },
      { kind: "list", path: "reels", label: "Reel cards", itemLabel: "Card", itemFields: posterItemFields },
      { kind: "list", path: "featured", label: "Featured panels", itemLabel: "Panel", itemFields: posterItemFields },
    ],
  },
  {
    key: "partners",
    label: "Partners",
    description: "Headline and the partner logo marquee. Only publish partners who have approved it.",
    fields: [
      { kind: "textarea", path: "title", label: "Headline" },
      { kind: "text", path: "label", label: "Label above the logos" },
      {
        kind: "list",
        path: "items",
        label: "Partners",
        itemLabel: "Partner",
        itemFields: [
          { key: "name", label: "Name", type: "text" },
          {
            key: "logo",
            label: "Logo",
            type: "media",
            accept: "image",
            hint: "Optional. A light logo on a transparent background works best; the name shows when empty.",
          },
        ],
      },
    ],
  },
  {
    key: "cta",
    label: "Closing call to action",
    description: "The closing headline and button at the bottom of the home page.",
    fields: [
      { kind: "textarea", path: "title", label: "Headline" },
      { kind: "text", path: "buttonLabel", label: "Button label" },
    ],
  },
  {
    key: "contact",
    label: "Contact page",
    description: "Copy and button labels on the Contact page. The email and LinkedIn links come from General.",
    fields: [
      { kind: "text", path: "eyebrow", label: "Eyebrow" },
      { kind: "textarea", path: "title", label: "Headline" },
      { kind: "textarea", path: "lede", label: "Intro" },
      { kind: "text", path: "emailLabel", label: "Email button label" },
      { kind: "text", path: "linkedinLabel", label: "LinkedIn button label" },
    ],
  },
];

export function getSpec(key: string): SectionSpec | undefined {
  return SECTION_SPECS.find((s) => s.key === key);
}
