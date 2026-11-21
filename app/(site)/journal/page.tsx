/** /journal — all posts, newest first. Content: content/journal.json */
import type { Metadata } from "next";
import Image from "next/image";
import journal from "@/content/journal.json";
import site from "@/content/site.json";
import { formatDate } from "@/lib/content";
import { getPosts } from "@/lib/cms";
import PageHero from "@/components/pages/PageHero";
import Reveal from "@/components/ui/Reveal";
import SmartLink from "@/components/ui/SmartLink";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: journal.page.seo.title,
  description: journal.page.seo.description,
  alternates: { canonical: "/journal" },
  openGraph: { url: "/journal", title: `${journal.page.seo.title} — ${site.brand.name}`, description: journal.page.seo.description },
};

export default async function JournalPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHero index="(Journal)" label={journal.page.label} question={journal.page.question} title={journal.page.title} intro={journal.page.intro} />
      <section className={`${styles.list} graph`} data-header="light" aria-label="All posts">
        {posts.length === 0 ? <p className={styles.empty}>New entries are on the cutting table.</p> : null}
        <Reveal as="ul" stagger className={styles.rows}>
          {posts.map((p) => (
            <li key={p.slug}>
              <SmartLink href={`/journal/${p.slug}`} className={styles.row} data-cursor="view" data-cursor-label="Read">
                <time className="caps" dateTime={p.date}>
                  {formatDate(p.date)}
                </time>
                <span className={`${styles.cat} caps`}>{p.category}</span>
                <span className={styles.title}>
                  {p.title}
                  {p.placeholder ? <span className={styles.ph}>Placeholder</span> : null}
                </span>
                <span className={styles.excerpt}>{p.excerpt}</span>
                <span className={styles.thumb} aria-hidden="true">
                  {p.image ? <Image src={p.image} alt="" fill sizes="20vw" /> : null}
                </span>
              </SmartLink>
            </li>
          ))}
        </Reveal>
      </section>
    </>
  );
}
