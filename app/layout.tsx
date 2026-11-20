import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Inter_Tight } from "next/font/google";
import site from "@/content/site.json";
import { SITE_URL } from "@/lib/seo";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Header from "@/components/layout/Header";
import Preloader from "@/components/layout/Preloader";
import Cursor from "@/components/ui/Cursor";
import ScrollFx from "@/components/providers/ScrollFx";
import Footer from "@/components/layout/Footer";
import "./globals.css";

/* Fonts are self-hosted by Next.js at build time (no layout shift, no
   request to Google from the visitor's browser). */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
/* Handwriting — used sparingly for margin notes, like the notes in
   Stephanie's sketchbook. Swap for a font made from her own handwriting later. */
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: site.seo.title, template: site.seo.titleTemplate },
  description: site.seo.description,
  keywords: site.seo.keywords,
  applicationName: site.brand.name,
  authors: [{ name: site.brand.artist, url: SITE_URL }],
  creator: site.brand.artist,
  publisher: site.brand.name,
  category: "art",
  alternates: { canonical: "/" },
  robots:
    process.env.NEXT_PUBLIC_NOINDEX === "1"
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
        },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.brand.name,
    locale: site.seo.locale,
    title: site.seo.title,
    description: site.seo.description,
    images: [{ url: site.seo.ogImage, width: 1200, height: 630, alt: site.seo.ogImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: [{ url: site.seo.ogImage, alt: site.seo.ogImageAlt }],
    ...(site.seo.twitterHandle ? { creator: site.seo.twitterHandle, site: site.seo.twitterHandle } : {}),
  },
  ...(site.seo.googleSiteVerification ? { verification: { google: site.seo.googleSiteVerification } } : {}),
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1736",
};

/* Runs before the page paints:
   - adds "js" (so hidden-until-animated styles only apply with JS)
   - decides whether the preloader plays (first visit, motion allowed) */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var seen=localStorage.getItem('nuaj:visited');var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;d.classList.add(seen||calm?'skip-preloader':'is-preloading')}catch(e){d.classList.add('skip-preloader')}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable} ${caveat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <Preloader />
          <Header nav={site.nav} cta={site.cta} tagline={site.brand.byline} />
          <main id="main">{children}</main>
          <Footer />
          <ScrollFx />
        </SmoothScroll>
        <Cursor />
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
