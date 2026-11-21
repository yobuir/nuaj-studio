/**
 * /journal/[slug] — one post. Each item in a post's "body" (content/journal.json)
 * becomes a paragraph.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import journal from "@/content/journal.json";
import site from "@/content/site.json";
import { formatDate, visible } from "@/lib/content";
import { SITE_URL, abs } from "@/lib/seo";
import RevealText from "@/components/ui/RevealText";
import Reveal from "@/components/ui/Reveal";
import SmartLink from "@/components/ui/SmartLink";
import styles from "./post.module.css";

const posts = () => [...visible(journal.posts)].sort((a, b) => b.date.localeCompare(a.date));

export function generateStaticParams() {
  return posts().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = posts().find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/journal/${p.slug}` },
    openGraph: { type: "article", url: `/journal/${p.slug}`, title: p.title, description: p.excerpt, publishedTime: p.date, images: [{ url: p.image, alt: p.alt }] },
    ...("placeholder" in p && p.placeholder ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = posts();
  const i = list.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = list[i];
  const next = list[(i + 1) % list.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    datePublished: p.date,
    image: abs(p.image),
    url: abs(`/journal/${p.slug}`),
    author: { "@id": `${SITE_URL}/#artist`, "@type": "Person", name: site.brand.artist },
    publisher: { "@id": `${SITE_URL}/#studio` },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header id="top" className={styles.head} data-header="light">
        <p className={`${styles.meta} caps`}>
          <SmartLink href="/journal" className={styles.back}>
            ← Journal
          </SmartLink>
          <span>{p.category}</span>
          <time dateTime={p.date}>{formatDate(p.date)}</time>
          {"placeholder" in p && p.placeholder ? <span className={styles.ph}>Placeholder</span> : null}
        </p>
        <RevealText as="h1" lines={[p.title]} play="intro" className={styles.title} />
        <p className={styles.excerpt}>{p.excerpt}</p>
      </header>

      <Reveal variant="unroll" className={styles.cover}>
        <Image src={p.image} alt={p.alt} fill priority sizes="100vw" />
      </Reveal>

      <div className={styles.body} data-header="light">
        {p.body.map((para, n) => (
          <p key={n} className={n === 0 ? styles.lead : undefined}>
            {para}
          </p>
        ))}
      </div>

      {next && next.slug !== p.slug ? (
        <nav className={styles.next} data-header="light" aria-label="Next post">
          <SmartLink href={`/journal/${next.slug}`} className={styles.nextLink}>
            <span className="caps">Next entry →</span>
            <span className={styles.nextTitle}>{next.title}</span>
          </SmartLink>
        </nav>
      ) : null}
    </article>
  );
}
