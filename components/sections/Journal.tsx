/**
 * JOURNAL — the 3 latest posts (edited in Keystatic → Journal posts).
 * Cards lean with scroll speed and have a quiet hover: the photo eases in,
 * a thread underline draws under the title. Hides itself when empty.
 */
import Image from "next/image";
import SectionHead from "@/components/ui/SectionHead";
import { formatDate } from "@/lib/content";
import styles from "./Journal.module.css";

type Post = {
  slug: string;
  title: string;
  date: string | null;
  category: string;
  excerpt: string;
  image: string | null;
  alt: string;
  placeholder?: boolean;
};
type Props = {
  content: { index: string; label: string; question?: string; title: string };
  posts: Post[];
};

export default function Journal({ content, posts }: Props) {
  const latest = posts.slice(0, 3); // already newest first
  if (!latest.length) return null;

  return (
    <section id="journal" className={`${styles.journal} graph`} data-header="light" aria-label={content.label}>
      <header className={styles.head}>
        <SectionHead index={content.index} label={content.label} question={content.question} />
        <h2 className={styles.title}>{content.title}</h2>
        <a href="/journal" className={styles.all}>
          All entries <span aria-hidden="true">→</span>
        </a>
      </header>

      <ul className={styles.list}>
        {latest.map((post) => (
          <li key={post.slug} className={styles.item}>
            <a href={`/journal/${post.slug}`} className={styles.card}>
              <div data-skew>
                <div className={styles.media}>
                  {post.image ? <Image src={post.image} alt={post.alt} fill sizes="(max-width: 767px) 90vw, 30vw" className={styles.img} /> : null}
                  {post.placeholder ? <span className={`${styles.ph} caps`}>Placeholder</span> : null}
                </div>
              </div>
              <p className={`${styles.meta} caps`}>
                <span>{post.category}</span>
                <span className={styles.dots} aria-hidden="true" />
                {post.date ? <time dateTime={post.date}>{formatDate(post.date)}</time> : null}
              </p>
              <h3 className={styles.postTitle}>
                <span>{post.title}</span>
              </h3>
              <p className={styles.excerpt}>{post.excerpt}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
