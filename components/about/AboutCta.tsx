/**
 * ABOUT — closing call to action.
 * Content: content/about.json → "cta".
 */
import RevealText from "@/components/ui/RevealText";
import Button from "@/components/ui/Button";
import styles from "./AboutCta.module.css";

type Props = {
  content: { title: string[]; primary: { label: string; href: string }; secondary: { label: string; href: string } };
};

export default function AboutCta({ content }: Props) {
  return (
    <section className={styles.cta} data-header="light" aria-label="Work with Nuaj">
      <RevealText as="h2" lines={content.title} className={styles.title} />
      <div className={styles.actions}>
        <Button href={content.primary.href} size="lg">
          {content.primary.label}
        </Button>
        <Button href={content.secondary.href} variant="ghost" size="lg">
          {content.secondary.label}
        </Button>
      </div>
    </section>
  );
}
