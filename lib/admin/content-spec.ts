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
  placeholder?: string;
};

export type Field =
  | { kind: "text" | "textarea"; path: string; label: string; placeholder?: string; hint?: string }
  | { kind: "stringlist"; path: string; label: string; hint?: string }
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
  step: string;
  label: string;
  description: string;
  liveUrl: string;
  fields: Field[];
};

const posterItemFields: ItemField[] = [
  {
    key: "kind",
    label: "Category tag (top label on card)",
    type: "text",
    placeholder: "Brand film, Campaign, SaaS launch...",
    hint: "Short label shown above the video title.",
  },
  {
    key: "title",
    label: "Video / Project title",
    type: "text",
    placeholder: "Cut to the feeling",
  },
  {
    key: "poster",
    label: "Thumbnail / Poster photo",
    type: "media",
    accept: "image",
    hint: "Upload a screenshot or still frame from this edit (16:9 horizontal looks best).",
  },
  {
    key: "tone",
    label: "Fallback background colour",
    type: "color",
    hint: "Used automatically if you haven't uploaded a poster image yet.",
  },
  {
    key: "href",
    label: "Click destination link",
    type: "text",
    placeholder: "/projects#cinematic",
    hint: "Click one of the quick buttons below or paste any link.",
  },
];

export const SECTION_SPECS: SectionSpec[] = [
  {
    key: "site",
    step: "01",
    label: "01 · Header, Name & Contact Info",
    description:
      "Your name in the top navigation bar, browser tab title, Google search description, email address, and LinkedIn link.",
    liveUrl: "/",
    fields: [
      {
        kind: "text",
        path: "name",
        label: "Your full name",
        placeholder: "Nitin Wagh",
        hint: "Appears in the top-left header, footer, and big hero watermark.",
      },
      {
        kind: "text",
        path: "title",
        label: "Browser tab title",
        placeholder: "Nitin Wagh · Video Designer & Editor",
        hint: "Shown in Google search results and the browser tab.",
      },
      {
        kind: "textarea",
        path: "metaDescription",
        label: "Google search summary (SEO description)",
        hint: "1 to 2 sentences describing what you do for Google and social link previews.",
      },
      {
        kind: "text",
        path: "email",
        label: "Your contact email address",
        placeholder: "nitin.wagh@gmail.com",
        hint: "Visitors click 'Send an email' to write to this address.",
      },
      {
        kind: "text",
        path: "linkedin",
        label: "Your LinkedIn profile link",
        placeholder: "https://www.linkedin.com/in/...",
        hint: "Paste your full LinkedIn URL starting with https://",
      },
    ],
  },
  {
    key: "hero",
    step: "02",
    label: "02 · Top Hero Stage & About Bio",
    description:
      "The first thing visitors see: your interactive portrait photo, NLE scrubber stage, bio paragraph, and skill tags.",
    liveUrl: "/#about",
    fields: [
      {
        kind: "text",
        path: "role",
        label: "Top role badge",
        placeholder: "Video Designer & Editor",
        hint: "Small uppercase badge at the very top of the page.",
      },
      {
        kind: "text",
        path: "tagline",
        label: "Short subtitle next to role",
        placeholder: "Story-first motion across every format.",
      },
      {
        kind: "text",
        path: "hint",
        label: "Interactive portrait tip",
        placeholder: "Move across the portrait",
        hint: "Small helper text underneath your portrait photo.",
      },
      {
        kind: "media",
        path: "photo",
        label: "Main portrait photo (top layer)",
        accept: "image",
        hint: "Your main portrait photo. Leave empty to use the built-in studio portrait.",
      },
      {
        kind: "text",
        path: "photoAlt",
        label: "Main portrait description (for accessibility)",
        placeholder: "Portrait of Nitin Wagh",
      },
      {
        kind: "media",
        path: "illustration",
        label: "Illustrated / alternate portrait (revealed when moving cursor)",
        accept: "image",
        hint: "Revealed under the brush when visitors move their mouse across your photo.",
      },
      {
        kind: "text",
        path: "illustrationAlt",
        label: "Alternate portrait description",
        placeholder: "Illustrated portrait of Nitin Wagh",
      },
      {
        kind: "text",
        path: "aboutEyebrow",
        label: "Small label above your bio",
        placeholder: "About",
      },
      {
        kind: "text",
        path: "aboutTitle",
        label: "Main headline (Right column)",
        placeholder: "Every frame earns its place.",
        hint: "Big bold headline displayed next to your portrait.",
      },
      {
        kind: "textarea",
        path: "bio",
        label: "About you paragraph",
        hint: "2 to 4 sentences about your editing style, pacing, and what kinds of videos you craft.",
      },
      {
        kind: "stringlist",
        path: "tags",
        label: "Skill tags (pill badges below your bio)",
        hint: "Type skills separated by commas, e.g. Commercials, SaaS Launches, Short-form, Colour & Sound",
      },
      {
        kind: "text",
        path: "primaryCta",
        label: "Main red button text",
        placeholder: "Explore projects",
      },
      {
        kind: "text",
        path: "secondaryCta",
        label: "Second button text",
        placeholder: "Start a project",
      },
    ],
  },
  {
    key: "categories",
    step: "03",
    label: "03 · Selected Work (4 Video Categories)",
    description:
      "The 4 main video categories (Short-Form, Long-Form, SaaS & Tech, Cinematic). Hovering each row morphs the preview monitor.",
    liveUrl: "/#categories",
    fields: [
      {
        kind: "text",
        path: "homeTitle",
        label: "Home page section heading",
        placeholder: "Four arenas. One signature.",
      },
      {
        kind: "text",
        path: "pageTitle",
        label: "Projects page main heading",
        placeholder: "Selected works, cut to fit the screen.",
      },
      {
        kind: "textarea",
        path: "pageLede",
        label: "Projects page intro paragraph",
        hint: "Shown at the top of the /projects page.",
      },
      {
        kind: "list",
        path: "items",
        label: "Video Categories (4 rows on Home + tabs on Projects page)",
        itemLabel: "Category",
        itemFields: [
          {
            key: "title",
            label: "Category name",
            type: "text",
            placeholder: "Short-Form Content",
          },
          {
            key: "slug",
            label: "Category ID (URL code)",
            type: "text",
            placeholder: "short-form",
            hint: "Keep lowercase with hyphens (e.g. short-form, long-form, saas, cinematic). Projects use this ID to match into this category.",
          },
          {
            key: "desc",
            label: "Short description",
            type: "textarea",
            placeholder: "Hook-first vertical edits engineered for retention...",
          },
          {
            key: "orientation",
            label: "Video shape (Aspect ratio)",
            type: "select",
            options: [
              { value: "vertical", label: "Vertical 9:16 (Reels / Shorts / TikTok)" },
              { value: "landscape", label: "Landscape 16:9 (YouTube / Brand Films / TVC)" },
            ],
          },
          {
            key: "thumbnail",
            label: "Preview image (shown inside the 3D monitor on hover)",
            type: "media",
            accept: "image",
          },
          {
            key: "tone",
            label: "Fallback colour",
            type: "color",
            hint: "Used when no preview image is uploaded.",
          },
        ],
      },
    ],
  },
  {
    key: "allwork",
    step: "04 & 05",
    label: "04 & 05 · NLE Timeline Strip & 2.39:1 Theater Deck",
    description:
      "Controls both the horizontal NLE timeline strip (Section 04) and the 3 big widescreen 2.39:1 Featured Cuts (Section 05).",
    liveUrl: "/#work",
    fields: [
      {
        kind: "text",
        path: "title",
        label: "04 · Timeline section heading",
        placeholder: "Across the timeline.",
      },
      {
        kind: "text",
        path: "ctaLabel",
        label: "Top-right link text",
        placeholder: "See every project",
      },
      {
        kind: "list",
        path: "reels",
        label: "04 · Horizontal Timeline Clips (drag/scroll filmstrip)",
        itemLabel: "Timeline Clip",
        itemFields: posterItemFields,
      },
      {
        kind: "text",
        path: "featuredTitle",
        label: "05 · Widescreen 2.39:1 Theater Deck heading",
        placeholder: "Three cuts. Widescreen.",
        hint: "Heading right above the 3 big widescreen featured case study cards.",
      },
      {
        kind: "list",
        path: "featured",
        label: "05 · Widescreen Featured Cuts (3 big showcase cards)",
        itemLabel: "Featured Cut",
        itemFields: posterItemFields,
      },
    ],
  },
  {
    key: "craft",
    step: "06",
    label: "06 · Before / After Colour Grade Slider",
    description:
      "Interactive split-screen comparison where visitors drag a handle to compare RAW Log camera footage against your Final Rec.709 Colour Grade.",
    liveUrl: "/#craft",
    fields: [
      {
        kind: "text",
        path: "eyebrow",
        label: "Small top label",
        placeholder: "06 / Colour, Sound & Finishing Craft",
      },
      {
        kind: "text",
        path: "title",
        label: "Section headline",
        placeholder: "From flat LOG sensor data to theatrical print.",
      },
      {
        kind: "list",
        path: "scenes",
        label: "Before / After Comparison Reels (3 switchable tabs)",
        itemLabel: "Scene",
        itemFields: [
          {
            key: "code",
            label: "Tab badge code",
            type: "text",
            placeholder: "REEL 01",
          },
          {
            key: "title",
            label: "Scene title",
            type: "text",
            placeholder: "Night Exterior · Anamorphic Street",
          },
          {
            key: "beforeImage",
            label: "BEFORE image (Flat RAW LOG frame)",
            type: "media",
            accept: "image",
            hint: "Upload an ungraded/flat screenshot from your timeline. Leave empty to use the built-in studio preview.",
          },
          {
            key: "afterImage",
            label: "AFTER image (Final Colour Graded frame)",
            type: "media",
            accept: "image",
            hint: "Upload the exact same frame after your colour grade. Visitors drag the slider to compare Before vs After.",
          },
          {
            key: "camera",
            label: "Camera & Format label (Before side)",
            type: "text",
            placeholder: "ARRI LogC4 · ISO 800 · 4.6K Open Gate",
          },
          {
            key: "lut",
            label: "Look / LUT label (After side)",
            type: "text",
            placeholder: "Kodak 2383 Print + Halir Grade · Rec.709",
          },
          {
            key: "lift",
            label: "Lift readout (optional technical detail)",
            type: "text",
            placeholder: "-0.04 / -0.02 / +0.05",
          },
          {
            key: "gamma",
            label: "Gamma readout (optional technical detail)",
            type: "text",
            placeholder: "+0.02 / +0.00 / -0.03",
          },
          {
            key: "gain",
            label: "Gain readout (optional technical detail)",
            type: "text",
            placeholder: "+1.12 / +1.04 / +0.92",
          },
        ],
      },
    ],
  },
  {
    key: "partners",
    step: "08A",
    label: "08A · Trusted Partners & Client Logos",
    description:
      "The client & agency logo grid near the bottom of the home page.",
    liveUrl: "/#partners",
    fields: [
      {
        kind: "textarea",
        path: "title",
        label: "Section headline",
        placeholder: "Trusted by teams shipping sharp work.",
      },
      {
        kind: "text",
        path: "label",
        label: "Small label above the logos",
        placeholder: "Selected partners & collaborations",
      },
      {
        kind: "list",
        path: "items",
        label: "Partner / Client list",
        itemLabel: "Partner",
        itemFields: [
          {
            key: "name",
            label: "Client or Brand Name",
            type: "text",
            placeholder: "Studio North",
          },
          {
            key: "logo",
            label: "Logo image (optional)",
            type: "media",
            accept: "image",
            hint: "Optional. Upload a white/light PNG or SVG logo with a transparent background. If left empty, the brand name and monogram are shown automatically.",
          },
        ],
      },
    ],
  },
  {
    key: "cta",
    step: "08B",
    label: "08B · Bottom Call-to-Action Banner",
    description:
      "The big closing box at the bottom of the home page inviting visitors to start a project with you.",
    liveUrl: "/",
    fields: [
      {
        kind: "textarea",
        path: "title",
        label: "Headline",
        placeholder: "Have footage that needs a story? Let's cut it together.",
      },
      {
        kind: "text",
        path: "buttonLabel",
        label: "Button text",
        placeholder: "Start a conversation",
      },
    ],
  },
  {
    key: "contact",
    step: "09",
    label: "09 · Contact Page Copy",
    description:
      "Headline, intro text, and button labels on the dedicated /contact page. (Your actual email & LinkedIn URL are set in 01 · Header, Name & Contact Info).",
    liveUrl: "/contact",
    fields: [
      {
        kind: "text",
        path: "eyebrow",
        label: "Small top label",
        placeholder: "Contact",
      },
      {
        kind: "textarea",
        path: "title",
        label: "Main headline",
        placeholder: "Tell me about the cut you need.",
      },
      {
        kind: "textarea",
        path: "lede",
        label: "Intro paragraph",
        placeholder: "Share a brief, a rough timeline or a folder of rushes...",
      },
      {
        kind: "text",
        path: "emailLabel",
        label: "Email button text",
        placeholder: "Send an email",
      },
      {
        kind: "text",
        path: "linkedinLabel",
        label: "LinkedIn button text",
        placeholder: "Connect on LinkedIn",
      },
    ],
  },
];

export function getSpec(key: string): SectionSpec | undefined {
  return SECTION_SPECS.find((s) => s.key === key);
}
