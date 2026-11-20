/** Web app manifest — name, colours and icons for "Add to Home Screen". */
import type { MetadataRoute } from "next";
import site from "@/content/site.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brand.name,
    short_name: "Nuaj",
    description: site.seo.description,
    start_url: "/",
    display: "browser",
    background_color: "#f2eee6",
    theme_color: "#0f1736",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
