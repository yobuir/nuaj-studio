/**
 * SEO helpers — one place for the site URL and structured data.
 *
 * SITE URL: set it in content/site.json → seo.siteUrl (e.g. "https://nuajstudio.com")
 * or with the NEXT_PUBLIC_SITE_URL environment variable on your host.
 * Search engines need absolute URLs for the sitemap, canonical tags and
 * social previews, so set this before launch.
 */
import site from "@/content/site.json";
import works from "@/content/works.json";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || site.seo.siteUrl || "http://localhost:3000").replace(/\/$/, "");

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/** Real social profile links only (skips "#" placeholders). */
export const socialProfiles = () => site.brand.social.map((s) => s.href).filter((h) => h.startsWith("http"));

/**
 * JSON-LD structured data for the homepage (schema.org).
 * Tells Google who the studio is, who the artist is, and what the work is —
 * which can unlock richer search results and a knowledge panel.
 */
export function homeJsonLd() {
  const orgId = `${SITE_URL}/#studio`;
  const personId = `${SITE_URL}/#artist`;
  const realWorks = works.items.filter((w) => !("placeholder" in w && w.placeholder));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: site.brand.name,
        description: site.seo.description,
        inLanguage: "en-US",
        publisher: { "@id": orgId },
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: site.brand.name,
        alternateName: "NUAJ",
        url: SITE_URL,
        logo: abs("/icon.svg"),
        image: abs(site.seo.ogImage),
        description: site.seo.description,
        founder: { "@id": personId },
        email: site.brand.email,
        areaServed: site.brand.location,
        knowsAbout: ["Textile art", "Textile design", "Mixed media textile art", "Aso-oke", "Lace", "Beadwork", "Art commissions"],
        sameAs: socialProfiles(),
      },
      {
        "@type": "Person",
        "@id": personId,
        name: site.brand.artist,
        jobTitle: "Textile artist",
        worksFor: { "@id": orgId },
        url: SITE_URL,
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#commissions`,
        name: "Custom textile art commissions",
        serviceType: "Commissioned textile art",
        provider: { "@id": orgId },
        areaServed: site.brand.location,
        description: site.commission.text,
      },
      ...(realWorks.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${SITE_URL}/#work`,
              name: "Selected work",
              itemListElement: realWorks.map((w, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "VisualArtwork",
                  name: w.title,
                  dateCreated: w.year,
                  artform: "Textile art",
                  artMedium: w.materials,
                  image: abs(w.image),
                  creator: { "@id": personId },
                  url: abs(`/work/${w.slug}`),
                },
              })),
            },
          ]
        : []),
    ],
  };
}

