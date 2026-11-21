/**
 * ABOUT PAGE — /about
 * Sections in order; text and images come from content/about.json.
 */
import type { Metadata } from "next";
import about from "@/content/about.json";
import site from "@/content/site.json";
import { SITE_URL, abs } from "@/lib/seo";
import AboutHero from "@/components/about/AboutHero";
import AboutStory from "@/components/about/AboutStory";
import Influences from "@/components/about/Influences";
import Principles from "@/components/about/Principles";
import StudioStrip from "@/components/about/StudioStrip";
import AboutCta from "@/components/about/AboutCta";

export const metadata: Metadata = {
  title: about.seo.title,
  description: about.seo.description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    url: "/about",
    title: `${about.seo.title} — ${site.brand.name}`,
    description: about.seo.description,
    images: [{ url: site.seo.ogImage, width: 1200, height: 630, alt: site.seo.ogImageAlt }],
  },
};

/** Structured data: an AboutPage describing the artist. */
function aboutJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: abs("/about"),
    name: about.seo.title,
    description: about.seo.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@id": `${SITE_URL}/#artist`,
      "@type": "Person",
      name: site.brand.artist,
      jobTitle: "Textile artist",
      description: about.hero.intro,
      worksFor: { "@id": `${SITE_URL}/#studio` },
      knowsAbout: ["Textile art", "Architecture", "Fashion design", "Aso-oke", "Lace", "Beadwork"],
    },
  };
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd()).replace(/</g, "\\u003c") }}
      />
      <AboutHero content={about.hero} />
      <AboutStory content={about.story} />
      <Influences content={about.influences} />
      <Principles content={about.principles} />
      <StudioStrip content={about.studio} />
      <AboutCta content={about.cta} />
    </>
  );
}
