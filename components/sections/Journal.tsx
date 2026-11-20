/**
 * JOURNAL — the 3 latest posts from content/journal.json.
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
  date: string;
  category: string;
  excerpt: string;
  image: string;
  alt: string;
  placeholder?: boolean;
};
type Props = {
  content: { index: string; label: string; question?: string; title: string };
  posts: Post[];
};

export default function Journal({ content, posts }: Props) {
  const latest = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
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
                  <Image src={post.image} alt={post.alt} fill sizes="(max-width: 767px) 90vw, 30vw" className={styles.img} />
                  {post.placeholder ? <span className={`${styles.ph} caps`}>Placeholder</span> : null}
                </div>
              </div>
              <p className={`${styles.meta} caps`}>
                <span>{post.category}</span>
                <span className={styles.dots} aria-hidden="true" />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
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
