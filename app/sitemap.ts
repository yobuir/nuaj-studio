/**
 * /sitemap.xml — every page search engines should index.
 * Projects and journal posts are added automatically from the content files
 * (placeholders are skipped).
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getPosts, getProjects } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // placeholders are never listed, even while they show on the site
  const [projects, posts] = await Promise.all([getProjects({ includePlaceholders: false }), getPosts({ includePlaceholders: false })]);
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "monthly" | "yearly" | "weekly" = "monthly", images?: string[]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    ...(images ? { images: images.map((i) => `${SITE_URL}${i}`) } : {}),
  });

  return [
    page("/", 1, "monthly"),
    page("/work", 0.9, "monthly"),
    page("/commission", 0.9, "yearly"),
    page("/about", 0.8, "yearly"),
    page("/wearables", 0.7, "monthly"),
    page("/journal", 0.6, "weekly"),
    page("/contact", 0.6, "yearly"),
    ...projects.map((w) => page(`/work/${w.slug}`, 0.8, "yearly", w.image ? [w.image] : undefined)),
    ...posts.map((p) => ({ ...page(`/journal/${p.slug}`, 0.5, "yearly", p.image ? [p.image] : undefined), lastModified: p.date ? new Date(p.date) : now })),
  ];
}
