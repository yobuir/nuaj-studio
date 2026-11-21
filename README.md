# Nuaj Studio — website

Homepage for **Nuaj Studio** (textile art by Stephanie Onuaja).
Concept: **cut → compose → stitch.** One continuous thread (the line of the
hand-drawn `nuaj` logo) runs through the whole site.

Built with Next.js (App Router) + TypeScript, GSAP + ScrollTrigger, Lenis
smooth scroll, OGL (lightweight WebGL) and CSS Modules.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (use this to judge performance)
```

Node 20+ recommended.

> **Tip:** the preloader only plays on your first visit. To see it again, open
> DevTools → Application → Local Storage → delete `nuaj:visited`
> (or use a private window).

---

## Where things live

```
app/
  layout.tsx          fonts, SEO meta, header, preloader, cursor, grain
  page.tsx            the homepage: list of sections, in order
  globals.css         reset + global helpers
styles/tokens.css     ALL colours, font sizes, spacing, easing  ← brand tweaks here
content/site.json     brand, hero, manifesto, disciplines, process, commission, footer
content/works.json    Selected work (projects)
content/voices.json   testimonials + press names
content/journal.json  journal posts
components/
  sections/           one file per homepage section (Hero.tsx, …)
  layout/             Header, Preloader
  ui/                 Button (magnetic), Cursor, Logo, RevealText, WeaveImage,
                      Marquee, Note (handwritten), SectionHead
  providers/          SmoothScroll (Lenis ⇄ ScrollTrigger)
lib/
  animations/         gsap.ts (shared easing), motion.ts (reduced-motion, intro signal)
  webgl/fabric/       FabricScene.ts + shaders.ts (the hero cloth)
  webgl/hover/        HoverDistort.ts (ripple on work images)
  canvas/             ProcessField (process steps), ThreadField (commission),
                      LoomGrid (footer)
  content.ts          placeholder filter + date formatting
public/images/        web-ready images with readable names
scripts/prepare-images.mjs   turns original photos into web images
```

---

## Edit text

Open `content/site.json` and change the words. Examples:

- Hero headline → `hero.headline` (each item is one line; line breaks are deliberate)
- Location shown in the hero → `brand.location`
- Navigation → `nav`
- Search/social preview text → `seo`

Save, and the dev server updates instantly. No animation code needs to change.

## Swap an image

**Easiest:** replace the file in `public/images/` keeping the **same file name**.

**Or** point to a new file in `content/site.json` (e.g. `hero.image.desktop`).

The hero uses four files:

| File | Used for |
|---|---|
| `hero/hero-poster.jpg` | first paint on desktop (wide crop) + fallback |
| `hero/hero-poster-mobile.jpg` | first paint on phones (tall crop) |
| `hero/hero-fabric.webp` | the WebGL cloth texture, desktop (~1920px wide, keep < 800 KB) |
| `hero/hero-fabric-mobile.webp` | the WebGL cloth texture, phones (~900px wide) |

To regenerate everything from the original photos, edit the list at the top of
`scripts/prepare-images.mjs` and run `npm run images`.

Always update the `alt` text too: it describes the image for screen readers and Google.

## Change colours, fonts, spacing, easing

Everything is in `styles/tokens.css`. For example, change `--c-cobalt` and every
cobalt button, thread and focus ring follows.

Fonts are loaded in `app/layout.tsx` (Fraunces + Inter Tight from Google Fonts,
self-hosted at build time). To use a paid font (e.g. PP Editorial New), put the
files in `/public/fonts`, load them with `next/font/local`, and keep the same
`--font-fraunces` variable name.

## Tune the hero cloth

`lib/webgl/fabric/shaders.ts`: every uniform is explained at the top, and the
numbers marked `TUNE` are safe to play with (wind strength, dent depth, light
direction, darkening for text readability).
`lib/webgl/fabric/FabricScene.ts`: overscan, roll thickness, pixel ratio.
`components/sections/Hero.module.css`: `.hero { height: 240svh }` sets how
much scrolling the roll-up takes.

---

## The homepage, section by section

| # | Section | File | Content |
|---|---|---|---|
| 1 | Preloader | `components/layout/Preloader.tsx` | — |
| 2 | Hero (WebGL cloth) | `sections/Hero.tsx` | `site.json → hero` |
| 3 | Manifesto | `sections/Manifesto.tsx` | `site.json → manifesto` (`*words*` = italic cobalt) |
| 4 | Disciplines (horizontal, woven images) | `sections/Disciplines.tsx` | `site.json → disciplines` |
| 5 | Process (Gather → Cut → Compose → Stitch) | `sections/Process.tsx` | `site.json → process` |
| 6 | Selected work | `sections/Works.tsx` | `works.json` |
| 7 | Commission CTA | `sections/Commission.tsx` | `site.json → commission` |
| 8 | Kind words & press | `sections/Voices.tsx` | `voices.json` |
| 9 | Journal | `sections/Journal.tsx` | `journal.json` |
| 10 | Footer | `components/layout/Footer.tsx` | `site.json → footer, brand` |

Every section opens with a **question** (`"question"` in its content), the way
Stephanie's own portfolio does. The handwritten margin notes are the `"note"`
fields: delete a note to remove it.

## All pages

| URL | File | Content |
|---|---|---|
| `/` | `app/page.tsx` | `site.json`, `works.json`, `voices.json`, `journal.json` |
| `/work` | `app/work/page.tsx` | `works.json` (`page` + `items`) |
| `/work/[slug]` | `app/work/[slug]/page.tsx` | one item of `works.json` |
| `/commission` | `app/commission/page.tsx` | `commission.json` |
| `/wearables` | `app/wearables/page.tsx` | `wearables.json` |
| `/about` | `app/about/page.tsx` | `about.json` |
| `/journal` | `app/journal/page.tsx` | `journal.json` |
| `/journal/[slug]` | `app/journal/[slug]/page.tsx` | one post of `journal.json` |
| `/contact` | `app/contact/page.tsx` | `contact.json` + `site.json → brand` (email, socials, location) |
| 404 | `app/not-found.tsx` | — |

Inner pages open with `components/pages/PageHero.tsx`, so they share one voice.

## Forms (email delivery)

Both forms (the one on `/commission`, with photos, and the one on `/contact`, with a
topic choice) post to `app/api/commission/route.ts` and `app/api/contact/route.ts`.
They share `lib/sendEnquiry.ts`, which
validates everything (plus a hidden anti-spam field) and emails the enquiry
with the photos attached via [Resend](https://resend.com). Set on your host:

| Variable | Example |
|---|---|
| `RESEND_API_KEY` | `re_…` |
| `COMMISSION_TO_EMAIL` | the inbox that should receive enquiries |
| `COMMISSION_FROM_EMAIL` (optional) | `Nuaj Studio <studio@your-domain.com>`: domain verified in Resend |

Until these are set, the form says so politely and offers the studio email.
The site must run on a Node host (Vercel/Netlify), not as a static export.

## Add a journal post

Add an entry to `content/journal.json → posts` with `slug`, `title`, `date`
(`YYYY-MM-DD`), `category`, `excerpt`, `image`, `alt` and `body` (a list of
paragraphs). It appears on `/journal`, on the homepage (3 newest), gets its own
page, and is added to the sitemap.

## About page (`/about`)

| Section | File | Content |
|---|---|---|
| Opening: name + lace silhouette | `components/about/AboutHero.tsx` | `about.json → hero` |
| Story: "From buildings to cloth" | `components/about/AboutStory.tsx` | `about.json → story` |
| Influences | `components/about/Influences.tsx` | `about.json → influences` |
| How I work | `components/about/Principles.tsx` | `about.json → principles` |
| The cutting table (photo strip) | `components/about/StudioStrip.tsx` | `about.json → studio` |
| Closing call to action | `components/about/AboutCta.tsx` | `about.json → cta` |

The silhouette is Stephanie's portrait mark used as a **mask**
(`public/images/about/portrait-mask.png`): any photo set in `hero.portrait.fill`
shows through it. Swap the fill to show a different fabric.

Links between pages: use `"/#work"` style links in content. On the
homepage they smooth-scroll; from other pages they navigate home to that
section (`components/ui/SmartLink.tsx`).

> GSAP pinning tip: a pinned section must sit inside a wrapper `<div>` that
> React owns (see `Disciplines.tsx`), or leaving the page will crash.

## Placeholders

Items marked `"placeholder": true` (sample projects, quotes, press, journal
posts) show a dashed **Placeholder** badge. Before launch, set
`"showPlaceholders": false` at the top of `content/site.json`. Placeholder
items then disappear, and a section with nothing real left hides itself.

## Add a new project (work item)

1. Put images in `public/images/works/<project-slug>/`.
2. Add an entry to `content/works.json`:
   ```json
   {
     "slug": "my-new-piece",
     "title": "My New Piece",
     "year": "2026",
     "category": "Commission",
     "materials": "Lace, aso-oke & beads",
     "image": "/images/works/my-new-piece/cover.jpg",
     "alt": "Describe the image for screen readers",
     "size": "large"
   }
   ```
   `size` is `large`, `wide`, `tall` or `small`. It sets the image shape; the
   grid placement pattern repeats every 5 items automatically.
3. Add the project-page fields: `kind`, `intro`, `facts` (pairs like
   `["Year", "2026"]`), `chapters` (each with `title`, `text`, `images`) and
   `gallery`. See *The Mosaic of Our Story* in `works.json` as a template.
4. It appears on the homepage and on `/work`, gets its page at
   `/work/my-new-piece`, and is added to the sitemap.

## Newsletter

The footer form validates the email and shows a thank-you, but isn't
connected to a service yet. Add the call to Mailchimp / ConvertKit /
Buttondown in `onSubmit` in `components/layout/Footer.tsx`.

## Images from Stephanie's portfolio

`public/images/disciplines/wearables-dress.jpg` (her African-print dress
collage) and `public/images/textures/botanical-blue.jpg` (back-cover artwork)
were extracted from her portfolio PDF. Copies are kept in
`../images/portfolio-extracts/`.

## Add a new page

1. Create a folder in `app/` named like the URL, e.g. `app/about/page.tsx`.
2. Export a component:
   ```tsx
   export const metadata = { title: "About" };
   export default function AboutPage() {
     return <section data-header="light">…</section>;
   }
   ```
3. Add it to `nav` in `content/site.json`.

`data-header="light"` / `"dark"` on a section tells the header which colour to
use when that section is behind it.

---

## Accessibility & motion

- `prefers-reduced-motion`: no preloader, no WebGL, no smooth scroll. Text and
  images simply fade in.
- Custom cursor and magnetic effects are off on touch screens.
- Everything is keyboard reachable, with a visible focus ring and a "Skip to content" link.
- If WebGL is unavailable, or the GPU drops the context, the hero falls back to
  the photo, which lifts away on scroll.

## Deploy

Works out of the box on Vercel or Netlify. Set the environment variable
`NEXT_PUBLIC_SITE_URL` (e.g. `https://nuajstudio.com`) so social previews use
absolute URLs.

---

## SEO

What's in place:

| Feature | Where |
|---|---|
| Title, description, keywords, canonical URL, robots directives | `app/layout.tsx` (text in `content/site.json → seo`) |
| Open Graph + Twitter/X cards (1200×630 image) | `app/layout.tsx`, image `public/images/og-image.jpg` |
| `robots.txt` | `app/robots.ts` |
| `sitemap.xml` (with image entry) | `app/sitemap.ts` (add new pages here) |
| Structured data (JSON-LD: WebSite, Organization, Person, Service, artworks) | `lib/seo.ts`, rendered in `app/page.tsx` |
| Web app manifest + icons (SVG favicon, Apple touch icon) | `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.png` |
| One `<h1>`, then an `<h2>` per section, `<h3>` per item | the section components |
| Alt text on every meaningful image | `content/*.json` (`alt` fields) |

### Before launch
1. **Set the real domain** in `content/site.json → seo.siteUrl` (or the
   `NEXT_PUBLIC_SITE_URL` env var). Canonical, sitemap, OG and JSON-LD URLs use it.
2. Replace `brand.email` and the `#` social links. Real profile URLs are added
   to the JSON-LD `sameAs` list automatically.
3. Set `"showPlaceholders": false` and write real alt text for every project.
4. Add a Google Search Console verification code in `seo.googleSiteVerification`,
   then submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console.
5. On preview/staging deploys set `NEXT_PUBLIC_NOINDEX=1` so they're never indexed.
6. Optional: a city in `brand.location` helps local search ("textile artist in …").

### Performance notes
- WebGL effects only run on a real GPU. On software-only WebGL (some PCs and
  Google's PageSpeed test machines) the site shows still images instead.
- The first-visit preloader delays when the headline appears (it is the page's
  "Largest Contentful Paint"). Returning visitors skip it.
