/**
 * PageHero — the opening of every inner page (Work, Commissions, Journal…).
 * Same voice as the homepage: "(label)" + a question, a large threaded title,
 * a short intro, and an optional slot on the right (image, filters…).
 */
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import styles from "./PageHero.module.css";

type Props = {
  label: string;
  question?: string;
  title: string[];
  intro?: string;
  index?: string;
  children?: React.ReactNode;
  tone?: "light" | "dark";
};

export default function PageHero({ label, question, title, intro, index = "(—)", children, tone = "light" }: Props) {
  return (
    <section id="top" className={`${styles.hero} ${tone === "dark" ? styles.dark : ""}`} data-header={tone}>
      <div className={styles.copy}>
        <SectionHead index={index} label={label} question={question} />
        <RevealText as="h1" lines={title} play="intro" className={styles.title} />
        {intro ? <p className={styles.intro}>{intro}</p> : null}
      </div>
      {children ? <div className={styles.aside}>{children}</div> : null}
    </section>
  );
}
