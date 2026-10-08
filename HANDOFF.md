# Nitin Wagh: video editing portfolio (handoff for Claude Code)

This folder is a **working, approved prototype** of a three-page portfolio site. Open `index.html` in a browser to see it.
Build the production site from it: **match the look, layout and interactions exactly**, and keep every `[placeholder]` as-is unless real content is provided.

```
index.html      Home: hero (ink name + portrait reveal), About, categories, work reel, featured, partners, CTA, footer
projects.html   Projects: 4 categories → gallery (hash routing #slug) → video player modal (#slug/index)
contact.html    Contact: copy + Email / LinkedIn buttons
assets/hero-left.jpg   hero illustration (anime-style portrait)
```

## Suggested prompt to give Claude Code
> Build my portfolio site from the prototype in `nitin-landing/`. Read `HANDOFF.md` first. Recreate the three pages pixel-for-pixel in [Next.js + Tailwind / plain HTML: pick one] as reusable components, keeping both hero interactions (the ink-reveal name and the cursor portrait reveal). Keep all `[placeholder]` content, put the project data in one data file, and make sure it works at phone width and with reduced motion.

## Design tokens
All shared tokens and components live in `assets/site.css` (`:root` variables); each page keeps only its own layout styles.

| Token | Value |
|---|---|
| Background (charcoal) | `--bg #15171c`; surface `--surface #1b1e25`; hairlines `--line rgba(244,239,230,.12)` |
| Text (warm white) | `--ink #f4efe6`; muted `--ink-2 .76` / `--ink-3 .56` alpha |
| Accent blue (one accent, used everywhere incl. the ink) | `--accent #3766e6`, hover `#4c79ee`; accent text on dark `#8ea9f2` |
| Display font | Archivo 800, `font-stretch` 75% (condensed), uppercase (`.display`) |
| Body font | Manrope 400-600 |
| Radius | buttons full pill, media and panels `--r 10px`, tags `--r-tag 4px` |
| Texture | fixed film-grain overlay (`body::after`); placeholders use `.ph` with a muted `--ph` tone |

Both fonts come from Google Fonts (`Archivo:wdth,wght@62..125,100..900`, `Manrope`).

## Tests
`npm install` then `npm test` runs the Playwright suite in `tests/` (desktop 1440x900 and Pixel 7) against a local `python -m http.server`.

## Home: hero interactions (the signature)
1. **Ink-reveal name.** "NITIN WAGH" is drawn on a `<canvas>` and auto-fitted into the empty `#slot` div, so the layout controls its size. Blue liquid "ink" (metaballs) follows the cursor as a smooth trail, but only near the name; nothing runs until the mouse moves, and the ink drains away once the cursor rests. Inside the ink the letters turn into an inflated 3D texture (chrome, gold, candy, cloud); the next texture comes up each time the ink fully drains, and clicking the name swaps it.
   - How it works: an eased follower lays circles along the cursor path inside a padded band around the letters; they are drawn on a 0.75x mask canvas, blurred, then thresholded with a short smooth ramp into an alpha mask with `getImageData`. A layer holding the blue fill and a pre-rendered textured word is clipped to that mask with `destination-in` and drawn over the cream base word.
2. **Portrait reveal.** Two copies of the portrait are stacked. The top copy (currently a greyscale stand-in for the **real photo**) has a CSS `mask-image: radial-gradient(circle var(--r) at var(--x) var(--y), transparent 62%, #000)`. JS eases `--x/--y/--r` toward the cursor, so a soft circle reveals the colour **anime** illustration underneath. The reveal stays inside the portrait box.
   - Hint text: "Move your cursor to reveal my creative side."
   - Touch or small screens: a "See my anime side" button toggles the reveal.
   - `prefers-reduced-motion`: no ink animation and no cursor reveal; the portrait stays still.
3. Layout: on desktop the portrait sits absolutely on the left 60% with a fade to the right, and the About column sits on the right. Below 860px: nav and name, then the portrait, then About and the buttons.

All the hero logic is in the `Component` class at the bottom of `index.html`. A tiny `DCLogic` shim runs it, so port it into a component with a `useEffect`, refs, and cleanup on unmount.

## Home: sections below the hero (in order)
1. **Selected work:** 4 category cards in 2 columns (1 on mobile), linking to `projects.html#<slug>`.
2. **All work:** headline "Work that moves people.", an auto-scrolling marquee of poster cards that pauses on hover, then 3 full-bleed **featured** panels with `position: sticky; top: 0` that stack as you scroll.
3. **Our partners:** a justified headline on a charcoal-to-blue gradient and an auto-scrolling logo marquee (`[Partner 01–10]`). **Only publish real partners the owner has approved.**
4. **CTA:** "Have a story to tell? Let’s make it worth watching." with a button to Contact.
5. **Footer:** Email / LinkedIn / page links, repeated on every page.

Each marquee works by repeating its list twice (the copy is `aria-hidden`) and animating `translateX(-50%)`; motion stops under reduced motion.

## Projects page
- Categories (draft names, **confirm with the owner**): `short-form` Short-form & Reels (vertical 9:16), `long-form` Long-form Videos, `saas` SaaS Demos, `cinematic` Cinematic Content (all landscape 16:9).
- Gallery: a thumbnail grid (4 columns for vertical, 3 for landscape), each card showing title, format and role; "Back to Projects" plus links to the other categories.
- Player: a modal that shows the poster first and **plays only on click** (`<video controls>`), keeping the original aspect ratio. Below it: Brief, My contribution, Tools. Esc or clicking the backdrop closes it.
- Data: the `PROJECTS` object in `projects.html`. Each entry is `{ title, role, video, poster, brief, contribution, tools }`. Move it into a JSON or CMS file.

## Content still needed (do not invent)
- A real portrait photo matching the illustration's pose and crop (replaces the greyscale stand-in in `.nw-real`).
- Videos, posters, titles, roles and briefs for each category; confirmed category names.
- Email address and LinkedIn URL (`[Your Email Address]`, `[Your LinkedIn Profile URL]`).
- Extra skill tags to confirm: SaaS product videos, cinematic editing, motion graphics, sound design, colour grading, cinematography.
- Partner logos (only approved ones), and project titles for the work reel and featured panels.
- Client names and results only when accurate and approved.

## Notes
- The hero image had baked-in text that was digitally erased; check the wall area behind the head for smudges, or supply a clean original.
- Accessibility: real links and buttons, `aria-pressed` on the reveal toggle, visible focus rings, decorative canvas set to `aria-hidden` with the name in a visually hidden `<h1>`.
