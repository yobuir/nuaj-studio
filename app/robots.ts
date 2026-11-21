/**
 * /robots.txt — tells search engines what they may crawl.
 * Preview/staging deploys: set NEXT_PUBLIC_NOINDEX=1 to block indexing.
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_NOINDEX === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    // Don't block /_next/ — Google needs its CSS, JS and optimised images to render the page.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/keystatic"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
