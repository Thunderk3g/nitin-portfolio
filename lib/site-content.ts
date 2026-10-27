/**
 * Editable site content: types plus the default (seed) values taken from the
 * approved prototype. Each top-level key maps to one row in `site_content`;
 * the admin CMS edits one section at a time and the public pages fall back to
 * these defaults for any missing section or field, so the site never breaks
 * on a content/DB issue. Keep every `[placeholder]` until real content exists.
 */

export type Orientation = "vertical" | "landscape";

export type SiteSection = {
  /** Brand, footer and the ink-reveal hero name (drawn uppercase). */
  name: string;
  /** Browser title of the home page. */
  title: string;
  metaDescription: string;
  email: string;
  linkedin: string;
};

export type HeroSection = {
  role: string;
  tagline: string;
  hint: string;
  /** Colour illustration revealed under the cursor. */
  illustration: string;
  illustrationAlt: string;
  /** Real photo on top. Empty = greyscale stand-in of the illustration. */
  photo: string;
  photoAlt: string;
  aboutEyebrow: string;
  aboutTitle: string;
  bio: string;
  tags: string[];
  primaryCta: string;
  secondaryCta: string;
};

export type Category = {
  slug: string;
  title: string;
  desc: string;
  /** Placeholder tone shown until a thumbnail is uploaded. */
  tone: string;
  orientation: Orientation;
  thumbnail: string;
};

export type CategoriesSection = {
  homeTitle: string;
  pageTitle: string;
  pageLede: string;
  items: Category[];
};

export type ReelItem = {
  kind: string;
  title: string;
  tone: string;
  poster: string;
  href: string;
};

export type AllWorkSection = {
  title: string;
  ctaLabel: string;
  featuredTitle?: string;
  reels: ReelItem[];
  featured: ReelItem[];
};

export type CraftScene = {
  code: string;
  title: string;
  camera: string;
  lut: string;
  beforeImage: string;
  afterImage: string;
  lift: string;
  gamma: string;
  gain: string;
};

export type CraftSection = {
  eyebrow: string;
  title: string;
  scenes: CraftScene[];
};

export type Partner = { name: string; logo: string };

export type PartnersSection = {
  title: string;
  label: string;
  items: Partner[];
};

export type CtaSection = { title: string; buttonLabel: string };

export type ContactSection = {
  eyebrow: string;
  title: string;
  lede: string;
  emailLabel: string;
  linkedinLabel: string;
};

export type SiteContent = {
  site: SiteSection;
  hero: HeroSection;
  categories: CategoriesSection;
  allwork: AllWorkSection;
  craft: CraftSection;
  partners: PartnersSection;
  cta: CtaSection;
  contact: ContactSection;
};

export type SectionKey = keyof SiteContent;

export const SECTION_KEYS: SectionKey[] = [
  "site",
  "hero",
  "categories",
  "allwork",
  "craft",
  "partners",
  "cta",
  "contact",
];

/** A project as the public Projects page renders it. */
export type ProjectCard = {
  id: string;
  title: string;
  role: string;
  video: string;
  poster: string;
  brief: string;
  contribution: string;
  tools: string;
};

export const defaultContent: SiteContent = {
  site: {
    name: "Nitin Wagh",
    title: "Nitin Wagh | Video Editor",
    metaDescription:
      "Nitin Wagh is a video editor with 3+ years of experience across reels, long-form videos, SaaS demos and cinematic content.",
    email: "[Your Email Address]",
    linkedin: "[Your LinkedIn Profile URL]",
  },
  hero: {
    role: "Video Editor | 3+ Years of Experience",
    tagline: "Thoughtful edits. Stories that connect.",
    hint: "Move your cursor to reveal my creative side.",
    illustration: "/assets/hero-left.jpg",
    illustrationAlt: "Anime-style illustration of Nitin Wagh editing video at his desk",
    photo: "",
    photoAlt: "Portrait of Nitin Wagh",
    aboutEyebrow: "About me",
    aboutTitle: "Need an editor who can adapt to your next idea?",
    bio: "I’m Nitin Wagh, a video editor with 3+ years of experience across reels, long-form videos, SaaS demos and cinematic content. Working in different creative environments has taught me versatility. I’m happy to learn what your project needs and use AI to work faster, while making the creative calls myself.",
    tags: [
      "Video editing",
      "Short-form content",
      "Long-form content",
      "Visual storytelling",
      "Pacing",
      "AI-assisted workflows",
    ],
    primaryCta: "View my work",
    secondaryCta: "Let’s talk",
  },
  categories: {
    homeTitle: "Selected work",
    pageTitle: "Projects",
    pageLede: "Pick a category to see more examples of that type of work.",
    items: [
      {
        slug: "short-form",
        title: "Short-form & Reels",
        desc: "Vertical edits for Reels, Shorts and social feeds.",
        tone: "#262f45",
        orientation: "vertical",
        thumbnail: "",
      },
      {
        slug: "long-form",
        title: "Long-form Videos",
        desc: "Longer edits paced to hold attention from start to finish.",
        tone: "#352c36",
        orientation: "landscape",
        thumbnail: "",
      },
      {
        slug: "saas",
        title: "SaaS Demos",
        desc: "Product walkthroughs that make software easy to follow.",
        tone: "#233236",
        orientation: "landscape",
        thumbnail: "",
      },
      {
        slug: "cinematic",
        title: "Cinematic Content",
        desc: "Mood-led edits built on rhythm, sound and colour.",
        tone: "#3a3226",
        orientation: "landscape",
        thumbnail: "",
      },
    ],
  },
  allwork: {
    title: "Work that moves people.",
    ctaLabel: "View my work",
    featuredTitle: "Featured Director Cuts",
    reels: [
      { kind: "Brand film", title: "[Project title one]", tone: "#273049", poster: "", href: "/projects" },
      { kind: "Campaign", title: "[Project title two]", tone: "#3b2c35", poster: "", href: "/projects" },
      { kind: "Documentary", title: "[Project title three]", tone: "#2c3529", poster: "", href: "/projects" },
      { kind: "Live event", title: "[Project title four]", tone: "#3b3424", poster: "", href: "/projects" },
      { kind: "Series", title: "[Project title five]", tone: "#233539", poster: "", href: "/projects" },
      { kind: "Digital", title: "[Project title six]", tone: "#302d3c", poster: "", href: "/projects" },
    ],
    featured: [
      { kind: "Brand film", title: "[Featured project one]", tone: "#1d2539", poster: "", href: "/projects" },
      { kind: "Live event", title: "[Featured project two]", tone: "#2e2129", poster: "", href: "/projects" },
      { kind: "Documentary", title: "[Featured project three]", tone: "#1e2b28", poster: "", href: "/projects" },
    ],
  },
  craft: {
    eyebrow: "06 / EDITOR CRAFT · COLOUR & FINISHING",
    title: "From Raw Log to Final Cut",
    scenes: [
      {
        code: "SCENE 01",
        title: "Midnight Commercial · Anamorphic Grade",
        camera: "ARRI ALEXA MINI LF · LOG-C3",
        lut: "KODAK 2383 + HALATION 18%",
        beforeImage: "",
        afterImage: "",
        lift: "-0.04 EV",
        gamma: "+0.12 EV",
        gain: "5600K · TEAL/AMBER",
      },
      {
        code: "SCENE 02",
        title: "SaaS Flagship Launch · High-Contrast Studio",
        camera: "RED V-RAPTOR 8K VV · R3D RAW",
        lut: "OPTICAL COBALT + DEEP BLACKS",
        beforeImage: "",
        afterImage: "",
        lift: "-0.08 EV",
        gamma: "+0.06 EV",
        gain: "6200K · STUDIO CLEAN",
      },
      {
        code: "SCENE 03",
        title: "Founder Documentary · Warm Tungsten Film",
        camera: "SONY FX6 · S-LOG3 / S-GAMUT3.CINE",
        lut: "16MM KODAK VISION3 500T",
        beforeImage: "",
        afterImage: "",
        lift: "-0.03 EV",
        gamma: "+0.15 EV",
        gain: "3200K · TUNGSTEN",
      },
    ],
  },
  partners: {
    title: "We team up with people who make the work braver and push every idea further.",
    label: "Our partners",
    items: Array.from({ length: 10 }, (_, i) => ({
      name: `[Partner ${String(i + 1).padStart(2, "0")}]`,
      logo: "",
    })),
  },
  cta: {
    title: "Have a story to tell? Let’s make it worth watching.",
    buttonLabel: "Let’s talk",
  },
  contact: {
    eyebrow: "Contact",
    title: "Have a story to tell? Let’s make it worth watching.",
    lede: "For project enquiries and collaborations, connect with me by email or on LinkedIn.",
    emailLabel: "Email me",
    linkedinLabel: "Connect on LinkedIn",
  },
};

/**
 * Placeholder projects shown in a category until it has at least one
 * published project (matches the prototype's six placeholder clips).
 */
export function placeholderProjects(): ProjectCard[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    title: `[Project title ${i + 1}]`,
    role: "[Your role]",
    video: "",
    poster: "",
    brief: "[Short project brief]",
    contribution: "[What you contributed]",
    tools: "[Tools used, optional]",
  }));
}
