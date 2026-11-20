import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a test build go to a separate folder (NEXT_DIST_DIR=.next-test)
  // so it never clashes with a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // next/image serves AVIF first, then WebP, to browsers that support them.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
