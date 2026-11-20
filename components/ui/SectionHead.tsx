/**
 * SectionHead — "(03) What I make" + the section's question.
 * Every section opens with a question, the way Stephanie's own
 * portfolio does ("Where does inspiration begin?").
 */
import SectionLabel from "./SectionLabel";
import styles from "./SectionHead.module.css";

type Props = {
  index: string;
  label: string;
  question?: string;
  /** Use "h2" when the question is the section's main heading (SEO/outline). */
  questionAs?: "p" | "h2";
  className?: string;
};

export default function SectionHead({ index, label, question, questionAs = "p", className = "" }: Props) {
  const Q = questionAs;
  return (
    <div className={`${styles.head} ${className}`}>
      <SectionLabel index={index} label={label} />
      {question ? <Q className={styles.question}>{question}</Q> : null}
    </div>
  );
}
