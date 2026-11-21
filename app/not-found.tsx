/** 404 — a loose thread. */
import Button from "@/components/ui/Button";
import styles from "./not-found.module.css";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section id="top" className={`${styles.nf} graph`} data-header="light">
      <svg className={styles.thread} viewBox="0 0 600 160" aria-hidden="true">
        <path d="M0 120 C120 120 140 30 240 40 C340 50 300 140 400 120 C470 106 500 60 560 70" pathLength={100} />
        <circle cx="566" cy="72" r="5" />
      </svg>
      <p className="caps">(404)</p>
      <h1 className={styles.title}>A loose thread.</h1>
      <p className={styles.text}>This page has come unstitched — it may have moved, or never existed.</p>
      <div className={styles.actions}>
        <Button href="/">Back to the studio</Button>
        <Button href="/work" variant="ghost">
          See the work
        </Button>
      </div>
    </section>
  );
}
