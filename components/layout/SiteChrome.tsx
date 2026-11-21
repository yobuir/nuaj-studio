/**
 * SiteChrome — everything that wraps a public page: skip link, smooth
 * scroll, preloader, header, footer, cursor, grain. Used by
 * app/(site)/layout.tsx and the 404 page (not by the /keystatic editor).
 */
import site from "@/content/site.json";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Header from "@/components/layout/Header";
import Preloader from "@/components/layout/Preloader";
import Cursor from "@/components/ui/Cursor";
import ScrollFx from "@/components/providers/ScrollFx";
import Footer from "@/components/layout/Footer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
