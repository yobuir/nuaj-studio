/**
 * SectionLabel — the small "(03) What I make" marker used at the top of
 * each section. Keeps the numbering style identical everywhere.
 */
import styles from "./SectionLabel.module.css";

export default function SectionLabel({ index, label, className = "" }: { index: string; label: string; className?: string }) {
  return (
    <p className={`${styles.label} caps ${className}`}>
      <span className={styles.index}>{index}</span>
      <span className={styles.stitch} aria-hidden="true" />
      {label}
    </p>
  );
}
