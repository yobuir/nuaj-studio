/**
 * HOMEPAGE — sections in order. Each section lives in /components/sections
 * and takes its text/images from /content. (The footer is in app/layout.tsx.)
 *
 * To reorder sections, move the lines below. To hide one, delete its line.
 */
import site from "@/content/site.json";
import works from "@/content/works.json";
import voices from "@/content/voices.json";
import journal from "@/content/journal.json";
import { visible } from "@/lib/content";
import { homeJsonLd } from "@/lib/seo";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Disciplines from "@/components/sections/Disciplines";
import Process from "@/components/sections/Process";
import Works from "@/components/sections/Works";
import Commission from "@/components/sections/Commission";
import Voices from "@/components/sections/Voices";
import Journal from "@/components/sections/Journal";

export default function HomePage() {
  return (
    <>
      {/* Structured data for search engines (schema.org JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c") }}
      />
      <Hero content={site.hero} location={site.brand.location} />
      <Manifesto content={site.manifesto} />
      <Disciplines content={site.disciplines} />
      <Process content={site.process} />
      <Works content={works} items={visible(works.items)} />
      <Commission content={site.commission} />
      <Voices content={voices} testimonials={visible(voices.testimonials)} press={visible(voices.press)} />
      <Journal content={journal} posts={visible(journal.posts)} />
    </>
  );
}
