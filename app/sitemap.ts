/**
 * /sitemap.xml — every page search engines should index.
 * Projects and journal posts are added automatically from the content files
 * (placeholders are skipped).
 */
import type { MetadataRoute } from "next";
import works from "@/content/works.json";
import journal from "@/content/journal.json";
import { SITE_URL } from "@/lib/seo";

const real = <T extends { placeholder?: boolean }>(items: T[]) => items.filter((i) => !i.placeholder);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "monthly" | "yearly" | "weekly" = "monthly", images?: string[]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    ...(images ? { images: images.map((i) => `${SITE_URL}${i}`) } : {}),
  });

  return [
    page("/", 1, "monthly", ["/images/og-image.jpg"]),
    page("/work", 0.9, "monthly"),
    page("/commission", 0.9, "yearly"),
    page("/about", 0.8, "yearly", ["/images/about/portrait-mask.png"]),
    page("/wearables", 0.7, "monthly", ["/images/disciplines/wearables-dress.jpg"]),
    page("/journal", 0.6, "weekly"),
    page("/contact", 0.6, "yearly"),
    ...real(works.items).map((w) => page(`/work/${w.slug}`, 0.8, "yearly", [w.image])),
    ...real(journal.posts).map((p) => ({ ...page(`/journal/${p.slug}`, 0.5, "yearly", [p.image]), lastModified: new Date(p.date) })),
  ];
}
