/**
 * ABOUT — How I work: three promises, set large on night indigo.
 * Each row is joined by a running stitch; on hover the stitch fills
 * with gold thread and the row's title shifts, like pulling a thread tight.
 *
 * Content: content/about.json → "principles".
 */
import SectionHead from "@/components/ui/SectionHead";
import Reveal from "@/components/ui/Reveal";
import styles from "./Principles.module.css";

type Props = {
  content: { index: string; label: string; question: string; items: { title: string; text: string }[] };
};

export default function Principles({ content }: Props) {
  return (
    <section id="how-i-work" className={styles.principles} data-header="dark" aria-label={content.label}>
      <SectionHead index={content.index} label={content.label} question={content.question} questionAs="h2" className={styles.head} />
      <Reveal as="ul" stagger className={styles.list}>
        {content.items.map((item, i) => (
          <li key={item.title} className={styles.row}>
            <span className={`${styles.num} caps`}>0{i + 1}</span>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.text}>{item.text}</p>
            <span className={styles.stitch} aria-hidden="true" />
          </li>
        ))}
      </Reveal>
    </section>
  );
}
