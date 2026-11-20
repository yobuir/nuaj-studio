/**
 * VOICES — testimonials + press, as two slow endless marquees that speed
 * up with scroll velocity (and follow the scroll direction).
 * Hides itself if there are no quotes and no press items.
 *
 * Content: content/voices.json
 */
import SectionHead from "@/components/ui/SectionHead";
import Marquee from "@/components/ui/Marquee";
import styles from "./Voices.module.css";

type Props = {
  content: { index: string; label: string; question?: string };
  testimonials: { quote: string; name: string; role: string; placeholder?: boolean }[];
  press: { name: string; placeholder?: boolean }[];
};

export default function Voices({ content, testimonials, press }: Props) {
  if (!testimonials.length && !press.length) return null;

  return (
    <section id="voices" className={styles.voices} data-header="light" aria-label={content.label}>
      <SectionHead index={content.index} label={content.label} question={content.question} questionAs="h2" className={styles.head} />

      {testimonials.length ? (
        <>
          <Marquee speed={36} className={styles.quotes}>
            {testimonials.map((t, i) => (
              <figure key={i} className={styles.quote}>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption className="caps">
                  {t.name} — {t.role}
                  {t.placeholder ? <span className={styles.ph}>Placeholder</span> : null}
                </figcaption>
                <span className={styles.sep} aria-hidden="true" />
              </figure>
            ))}
          </Marquee>
        </>
      ) : null}

      {press.length ? (
        <div className={styles.pressRow}>
          <p className={`${styles.pressLabel} caps`}>As seen in</p>
          <Marquee speed={60} reverse className={styles.press}>
            {press.map((p, i) => (
              <span key={i} className={styles.pressItem}>
                {p.name}
                <span className={styles.star} aria-hidden="true">
                  ✳
                </span>
              </span>
            ))}
          </Marquee>
        </div>
      ) : null}
    </section>
  );
}
