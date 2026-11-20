/**
 * /sitemap.xml — the list of pages search engines should index.
 * Add new pages here as they're built (project pages, about, journal…).
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/images/og-image.jpg`],
    },
    // When /work/[slug] pages exist, add them from content/works.json:
    // ...works.items.map((w) => ({ url: `${SITE_URL}/work/${w.slug}`, priority: 0.8 })),
  ];
}
