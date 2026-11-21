/**
 * ABOUT — Influences: "What shapes the work?"
 * Three columns, each with a giant outlined numeral (from Stephanie's
 * portfolio numbering), an image that unrolls in, and a short text.
 * Columns sit at different heights so the row never feels like a template.
 *
 * Content: content/about.json → "influences".
 */
import Image from "next/image";
import SectionHead from "@/components/ui/SectionHead";
import Reveal from "@/components/ui/Reveal";
import styles from "./Influences.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question: string;
    items: { title: string; text: string; image: string; alt: string }[];
  };
};

export default function Influences({ content }: Props) {
  return (
    <section id="influences" className={`${styles.influences} graph`} data-header="light" aria-label={content.label}>
      <SectionHead index={content.index} label={content.label} question={content.question} questionAs="h2" className={styles.head} />

      <ol className={styles.list}>
        {content.items.map((item, i) => (
          <li key={item.title} className={styles.item}>
            <span className={styles.numeral} aria-hidden="true">
              0{i + 1}
            </span>
            <Reveal variant="unroll" className={styles.media}>
              <div data-skew className={styles.skew}>
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 960px) 90vw, 28vw" className={styles.img} />
              </div>
            </Reveal>
            <Reveal className={styles.copy}>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
