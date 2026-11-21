/**
 * KEYSTATIC — the content editor at /keystatic.
 *
 * Every field the website shows is described here, so it can be edited in
 * a form instead of a code editor. IMPORTANT: Keystatic only keeps the
 * fields listed in this file — if you add a new key to a content file,
 * add it here too or it will be removed the next time someone saves.
 *
 * Storage:
 *  - on your computer (npm run dev) edits are saved straight to the files;
 *  - on the live site, edits are committed to GitHub (repo below) and the
 *    host redeploys automatically. Set up once — see README → "Content editor".
 */
import { collection, config, fields, singleton } from "@keystatic/core";

const REPO = "yobuir/nuaj-studio" as const;

/**
 * "local"    → npm run dev: saves straight to the files on your computer.
 * "github"   → live site, once the GitHub app is connected
 *              (NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG is set): saves via GitHub.
 * "disabled" → live site before that: the editor is switched off.
 */
export function keystaticMode(): "local" | "github" | "disabled" {
  // Setup only: NEXT_PUBLIC_KEYSTATIC_FORCE_GITHUB=1 npm run dev → connect GitHub locally
  if (process.env.NEXT_PUBLIC_KEYSTATIC_FORCE_GITHUB === "1") return "github";
  if (process.env.NODE_ENV === "development") return "local";
  return process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG ? "github" : "disabled";
}

/* ------------------------------------------------------------------ helpers */
const text = (label: string, description?: string) => fields.text({ label, description });
const longText = (label: string, description?: string) => fields.text({ label, description, multiline: true });
const lines = (label: string, description = "Each item is one line of the heading.") =>
  fields.array(fields.text({ label: "Line" }), { label, description, itemLabel: (p) => p.value || "Line" });
const link = (label: string) => fields.object({ label: text("Button / link text"), href: text("Goes to", 'A page like "/work", a section like "#work", or a full URL.') }, { label });
/** Images for a page: stored in public/images/<scope>/… */
const image = (scope: string, label: string, description?: string) =>
  fields.image({ label, description, directory: `public/images/${scope}`, publicPath: `/images/${scope}/` });
const alt = () => text("Image description (alt text)", "Describe the image for people using screen readers and for Google.");
const head = () => ({
  index: text("Section number", 'e.g. "(02)"'),
  label: text("Section label"),
  question: text("Opening question"),
});
const seo = () =>
  fields.object({ title: text("Page title (browser tab / Google)"), description: longText("Description (Google / social previews)") }, { label: "Search & sharing" });
const steps = (label: string) =>
  fields.array(fields.object({ title: text("Title"), text: longText("Text") }), { label, itemLabel: (p) => p.fields.title.value || "Step" });

/* ------------------------------------------------------------------ config */
export default config({
  storage: keystaticMode() === "github" ? { kind: "github", repo: REPO } : { kind: "local" },
  ui: {
    brand: { name: "Nuaj Studio" },
    navigation: {
      "Work & writing": ["projects", "journal"],
      Pages: ["about", "commission", "wearables", "contact", "workPage", "journalPage", "voices"],
      Settings: ["site"],
    },
  },

  collections: {
    /* ---------------- Projects ---------------- */
    projects: collection({
      label: "Projects",
      path: "content/projects/*",
      slugField: "title",
      format: { data: "json" },
      columns: ["category", "year"],
      entryLayout: "form",
      schema: {
        title: fields.slug({ name: { label: "Title" }, slug: { label: "Web address", description: "Used in the link: /work/your-web-address" } }),
        order: fields.integer({ label: "Order", description: "Lower numbers appear first (10, 20, 30…).", defaultValue: 100 }),
        placeholder: fields.checkbox({ label: "Placeholder / draft", description: "Hidden from the live site when “Show placeholders” is off in Site settings." }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Commission", value: "Commission" },
            { label: "Textile design", value: "Textile design" },
            { label: "Wearables", value: "Wearables" },
          ],
          defaultValue: "Commission",
        }),
        year: text("Year"),
        kind: text("Kind of piece", 'e.g. "Mixed media textile art"'),
        materials: text("Materials", 'e.g. "Stitched lace, aso-oke & acrylic beads"'),
        size: fields.select({
          label: "Shape in the grid",
          description: "How the cover image is cropped in the Work grid.",
          options: [
            { label: "Large", value: "large" },
            { label: "Wide", value: "wide" },
            { label: "Tall", value: "tall" },
            { label: "Small", value: "small" },
          ],
          defaultValue: "large",
        }),
        image: fields.image({ label: "Cover image", directory: "public/images/projects", publicPath: "/images/projects/", validation: { isRequired: true } }),
        alt: alt(),
        intro: longText("Introduction", "One or two sentences shown under the facts."),
        facts: fields.array(fields.object({ label: text("Label"), value: text("Value") }), {
          label: "Facts",
          description: "Shown as a list: Type, Year, Medium, Materials…",
          itemLabel: (p) => `${p.fields.label.value}: ${p.fields.value.value}`,
        }),
        chapters: fields.array(
          fields.object({
            title: text("Chapter title", 'e.g. "Gather", "Cut", "Compose", "Stitch"'),
            text: longText("Text"),
            images: fields.array(
              fields.object({ image: fields.image({ label: "Image", directory: "public/images/projects", publicPath: "/images/projects/" }), alt: alt() }),
              { label: "Images (1–3 look best)", itemLabel: (p) => p.fields.alt.value || "Image" },
            ),
          }),
          { label: "Story chapters", itemLabel: (p) => p.fields.title.value || "Chapter" },
        ),
        gallery: fields.array(
          fields.object({ image: fields.image({ label: "Image", directory: "public/images/projects", publicPath: "/images/projects/" }), alt: alt() }),
          { label: "Gallery — the finished piece", itemLabel: (p) => p.fields.alt.value || "Image" },
        ),
      },
    }),

    /* ---------------- Journal ---------------- */
    journal: collection({
      label: "Journal posts",
      path: "content/posts/*",
      slugField: "title",
      format: { contentField: "body" },
      columns: ["date", "category"],
      schema: {
        title: fields.slug({ name: { label: "Title" }, slug: { label: "Web address" } }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        category: text("Category", 'e.g. "Process", "Studio", "Wearables"'),
        excerpt: longText("Short summary", "One line, shown in lists and on Google."),
        image: fields.image({ label: "Cover image", directory: "public/images/journal", publicPath: "/images/journal/" }),
        alt: alt(),
        placeholder: fields.checkbox({ label: "Placeholder / draft" }),
        body: fields.markdoc({ label: "Post", options: { image: { directory: "public/images/journal", publicPath: "/images/journal/" } } }),
      },
    }),
  },

  singletons: {
    /* ---------------- Site settings ---------------- */
    site: singleton({
      label: "Site settings & homepage",
      path: "content/site",
      format: { data: "json" },
      schema: {
        showPlaceholders: fields.checkbox({ label: "Show placeholders", description: "Turn OFF before launch: hides every item marked as placeholder." }),
        brand: fields.object(
          {
            name: text("Studio name"),
            artist: text("Artist name"),
            tagline: text("Tagline"),
            byline: text("Byline (header)"),
            location: text("Location", "City / region shown on the site."),
            email: text("Studio email"),
            social: fields.array(fields.object({ label: text("Name", 'e.g. "Instagram"'), href: text("Profile link (full URL)") }), {
              label: "Social links",
              itemLabel: (p) => p.fields.label.value || "Link",
            }),
          },
          { label: "Studio" },
        ),
        seo: fields.object(
          {
            siteUrl: text("Website address", 'e.g. "https://nuajstudio.com" — needed for Google and social previews.'),
            title: text("Homepage title (Google / browser tab)"),
            titleTemplate: text("Title pattern for other pages", 'Keep "%s" where the page name goes, e.g. "%s — Nuaj Studio".'),
            description: longText("Site description (Google / social previews)"),
            keywords: fields.array(fields.text({ label: "Keyword" }), { label: "Keywords", itemLabel: (p) => p.value }),
            ogImage: image("site", "Social preview image", "Shown when the site is shared. 1200 × 630 px."),
            ogImageAlt: text("Social preview image description"),
            locale: text("Locale", 'e.g. "en_US"'),
            twitterHandle: text("X / Twitter handle (optional)", 'e.g. "@nuajstudio"'),
            googleSiteVerification: text("Google Search Console code (optional)"),
          },
          { label: "Search & sharing" },
        ),
        nav: fields.array(fields.object({ label: text("Label"), href: text("Goes to") }), { label: "Menu", itemLabel: (p) => p.fields.label.value }),
        cta: link("Header button"),
        hero: fields.object(
          {
            kicker: text("Small line above the headline"),
            headline: lines("Headline"),
            intro: longText("Introduction"),
            primaryCta: link("Main button"),
            secondaryCta: link("Second link"),
            image: fields.object(
              {
                desktop: image("site", "Photo — wide screens", "Landscape crop, about 1920 px wide."),
                mobile: image("site", "Photo — phones", "Portrait crop, about 1000 px wide."),
                textureDesktop: image("site", "Moving fabric texture — wide screens", "The image used for the 3D cloth. WebP, about 1920 px wide, under 800 KB."),
                textureMobile: image("site", "Moving fabric texture — phones", "WebP, about 900 px wide."),
                alt: alt(),
              },
              { label: "Hero fabric" },
            ),
            label: fields.object(
              {
                eyebrow: text("Small label"),
                title: text("Piece title"),
                year: text("Year"),
                lines: fields.array(fields.text({ label: "Line" }), { label: "Lines", itemLabel: (p) => p.value }),
                href: text("Links to"),
              },
              { label: "Sewn label card" },
            ),
            reveal: fields.object(
              {
                kicker: text("Small label"),
                words: fields.array(fields.object({ word: text("Word"), image: image("site", "Image"), alt: alt() }), {
                  label: "Words",
                  itemLabel: (p) => p.fields.word.value,
                }),
                caption: text("Caption"),
              },
              { label: "Under the cloth (revealed on scroll)" },
            ),
          },
          { label: "Homepage — hero" },
        ),
        manifesto: fields.object(
          {
            ...head(),
            statement: longText("Statement", "Wrap words in *asterisks* to set them in blue italics."),
            aside: longText("Paragraph"),
            note: text("Handwritten note (optional)"),
            link: link("Link"),
          },
          { label: "Homepage — manifesto" },
        ),
        disciplines: fields.object(
          {
            ...head(),
            items: fields.array(
              fields.object({
                number: text("Number"),
                title: text("Title"),
                text: longText("Text"),
                image: image("site", "Image"),
                alt: alt(),
                note: text("Handwritten note (optional)"),
                link: link("Link"),
              }),
              { label: "Disciplines", itemLabel: (p) => p.fields.title.value },
            ),
          },
          { label: "Homepage — what I make" },
        ),
        process: fields.object(
          {
            ...head(),
            title: lines("Title"),
            finalImage: image("site", "Finished artwork (shown at the end)"),
            canvasImage: image("site", "Colour source for the animation", "A smaller copy of the artwork (about 760 px wide)."),
            steps: fields.array(
              fields.object({ title: text("Title"), text: longText("Text"), image: image("site", "Photo card"), alt: alt() }),
              { label: "Steps", itemLabel: (p) => p.fields.title.value },
            ),
          },
          { label: "Homepage — process" },
        ),
        commission: fields.object(
          {
            ...head(),
            title: lines("Title"),
            text: longText("Text"),
            note: text("Handwritten note (optional)"),
            steps: steps("Steps"),
            cta: link("Button"),
          },
          { label: "Homepage — commission section" },
        ),
        footer: fields.object(
          {
            question: text("Question"),
            headline: text("Headline"),
            texture: image("site", "Background artwork"),
            newsletter: fields.object(
              {
                title: text("Title"),
                text: longText("Text"),
                placeholder: text("Email field placeholder"),
                button: text("Button"),
                success: text("Thank-you message"),
              },
              { label: "Newsletter" },
            ),
          },
          { label: "Footer" },
        ),
      },
    }),

    /* ---------------- About ---------------- */
    about: singleton({
      label: "About page",
      path: "content/about",
      format: { data: "json" },
      schema: {
        seo: seo(),
        hero: fields.object(
          {
            label: text("Label"),
            question: text("Opening question"),
            name: lines("Name (large)"),
            role: text("Role"),
            intro: longText("Introduction"),
            portrait: fields.object(
              {
                mask: image("about", "Silhouette shape (PNG with transparency)"),
                fill: image("about", "Fabric shown inside the silhouette"),
                alt: alt(),
              },
              { label: "Portrait" },
            ),
            note: text("Handwritten note (optional)"),
          },
          { label: "Opening" },
        ),
        story: fields.object(
          {
            ...head(),
            title: lines("Title"),
            paragraphs: fields.array(fields.text({ label: "Paragraph", multiline: true }), { label: "Paragraphs", itemLabel: (p) => p.value.slice(0, 60) }),
            quote: longText("Pull quote"),
            quoteCaption: text("Quote caption"),
            image: image("about", "Image"),
            imageAlt: alt(),
          },
          { label: "Story" },
        ),
        influences: fields.object(
          {
            ...head(),
            items: fields.array(fields.object({ title: text("Title"), text: longText("Text"), image: image("about", "Image"), alt: alt() }), {
              label: "Influences",
              itemLabel: (p) => p.fields.title.value,
            }),
          },
          { label: "Influences" },
        ),
        principles: fields.object({ ...head(), items: steps("Principles") }, { label: "How I work" }),
        studio: fields.object(
          {
            ...head(),
            note: text("Handwritten note (optional)"),
            photos: fields.array(fields.object({ image: image("about", "Photo"), alt: alt(), caption: text("Handwritten caption") }), {
              label: "Photos",
              itemLabel: (p) => p.fields.caption.value || "Photo",
            }),
          },
          { label: "The cutting table" },
        ),
        cta: fields.object({ title: lines("Title"), primary: link("Main button"), secondary: link("Second button") }, { label: "Closing" }),
      },
    }),

    /* ---------------- Commission ---------------- */
    commission: singleton({
      label: "Commission page",
      path: "content/commission",
      format: { data: "json" },
      schema: {
        seo: seo(),
        label: text("Label"),
        question: text("Opening question"),
        title: lines("Title"),
        kicker: text("Form section label"),
        intro: longText("Introduction"),
        image: image("commission", "Image"),
        imageAlt: alt(),
        note: text("Handwritten note (optional)"),
        steps: steps("How it works"),
        form: fields.object(
          {
            title: text("Form title"),
            name: text("Name field label"),
            email: text("Email field label"),
            message: text("Message field label"),
            messageHint: text("Message hint"),
            photos: text("Photos field label"),
            photosHint: text("Photos hint"),
            button: text("Send button"),
            success: longText("Thank-you message"),
            notConfigured: longText("Message if email isn't set up"),
            error: longText("Error message"),
          },
          { label: "Form texts" },
        ),
      },
    }),

    /* ---------------- Wearables ---------------- */
    wearables: singleton({
      label: "Wearables page",
      path: "content/wearables",
      format: { data: "json" },
      schema: {
        seo: seo(),
        label: text("Label"),
        question: text("Opening question"),
        title: lines("Title"),
        intro: longText("Introduction"),
        image: image("wearables", "Main image"),
        imageAlt: alt(),
        quote: longText("Quote"),
        story: fields.array(fields.text({ label: "Paragraph", multiline: true }), { label: "Story", itemLabel: (p) => p.value.slice(0, 60) }),
        details: fields.array(fields.object({ image: image("wearables", "Image"), alt: alt() }), { label: "Detail photos", itemLabel: (p) => p.fields.alt.value }),
        notify: fields.object({ title: text("Title"), text: longText("Text"), button: text("Button"), href: text("Button goes to") }, { label: "Get notified" }),
      },
    }),

    /* ---------------- Contact ---------------- */
    contact: singleton({
      label: "Contact page",
      path: "content/contact",
      format: { data: "json" },
      schema: {
        seo: seo(),
        label: text("Label"),
        question: text("Opening question"),
        title: lines("Title"),
        intro: longText("Introduction"),
        note: text("Handwritten note (optional)"),
        commission: fields.object({ text: text("Prompt"), link: link("Link") }, { label: "Commission prompt" }),
        details: fields.object(
          { emailLabel: text("Email label"), socialLabel: text("Social label"), locationLabel: text("Location label"), reply: text("Reply time note") },
          { label: "Details labels" },
        ),
        form: fields.object(
          {
            title: text("Form title"),
            name: text("Name field label"),
            email: text("Email field label"),
            topic: text("Topic question"),
            topics: fields.array(fields.text({ label: "Topic" }), { label: "Topics", itemLabel: (p) => p.value }),
            message: text("Message field label"),
            messageHint: text("Message hint"),
            button: text("Send button"),
            success: longText("Thank-you message"),
            notConfigured: longText("Message if email isn't set up"),
            error: longText("Error message"),
          },
          { label: "Form texts" },
        ),
      },
    }),

    /* ---------------- Work & Journal page texts ---------------- */
    workPage: singleton({
      label: "Work page & homepage grid",
      path: "content/works",
      format: { data: "json" },
      schema: {
        ...head(),
        title: lines("Homepage section title"),
        page: fields.object(
          { seo: seo(), label: text("Label"), question: text("Opening question"), title: lines("Title"), intro: longText("Introduction") },
          { label: "/work page" },
        ),
      },
    }),
    journalPage: singleton({
      label: "Journal page & homepage section",
      path: "content/journal",
      format: { data: "json" },
      schema: {
        ...head(),
        title: text("Homepage section title"),
        page: fields.object(
          { seo: seo(), label: text("Label"), question: text("Opening question"), title: lines("Title"), intro: longText("Introduction") },
          { label: "/journal page" },
        ),
      },
    }),

    /* ---------------- Testimonials & press ---------------- */
    voices: singleton({
      label: "Kind words & press",
      path: "content/voices",
      format: { data: "json" },
      schema: {
        ...head(),
        testimonials: fields.array(
          fields.object({
            quote: longText("Quote"),
            name: text("Name"),
            role: text("Role / project"),
            placeholder: fields.checkbox({ label: "Placeholder" }),
          }),
          { label: "Testimonials", itemLabel: (p) => p.fields.name.value || "Quote" },
        ),
        press: fields.array(fields.object({ name: text("Name"), placeholder: fields.checkbox({ label: "Placeholder" }) }), {
          label: "Press & exhibitions",
          itemLabel: (p) => p.fields.name.value,
        }),
      },
    }),
  },
});
