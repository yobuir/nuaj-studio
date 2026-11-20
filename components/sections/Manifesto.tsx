"use client";

/**
 * MANIFESTO — a short statement in large type.
 *
 * As you scroll, each word fills from an outline to solid ink, and a
 * thread (continuing the hero's hand-off thread) stitches through the
 * lines, passing OVER some letters and UNDER others.
 *
 * Text: content/site.json → "manifesto". Words wrapped in *asterisks*
 * are set in italic cobalt.
 */
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import Note from "@/components/ui/Note";
import styles from "./Manifesto.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question?: string;
    statement: string;
    aside: string;
    note?: string;
    link: { label: string; href: string };
  };
};

/** Split "a *b c* d" into words, remembering which are emphasised. */
function toWords(text: string) {
  let em = false;
  return text.split(/\s+/).map((raw) => {
    const starts = raw.startsWith("*");
    if (starts) em = true;
    const isEm = em;
    if (raw.replace(/[.,;:!?—]+$/, "").endsWith("*")) em = false;
    return { word: raw.replace(/\*/g, ""), em: isEm };
  });
}

// The thread: drops in from the top centre (where the hero's thread
// ended), then meanders across the text block and exits bottom-right.
const THREAD =
  "M500 0 C500 60 480 90 380 110 C200 150 60 150 40 230 C20 320 300 300 520 300 C760 300 980 330 960 430 C940 520 640 520 460 560 C300 600 260 680 420 720 C560 760 900 740 1000 800";

export default function Manifesto({ content }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const words = toWords(content.statement);

  useEffect(() => {
    const root = rootRef.current!;
    const wordEls = root.querySelectorAll<HTMLElement>("[data-word]");
    const threads = root.querySelectorAll<SVGPathElement>("[data-thread]");

    if (prefersReducedMotion()) {
      wordEls.forEach((w) => w.style.setProperty("--p", "1"));
      threads.forEach((t) => (t.style.strokeDashoffset = "0"));
      return;
    }

    const ctx = gsap.context(() => {
      // Words fill one after another across the scroll range
      gsap.to(wordEls, {
        "--p": 1,
        ease: "none",
        stagger: 0.12,
        scrollTrigger: {
          trigger: root.querySelector("[data-statement]"),
          start: "top 78%",
          end: "bottom 45%",
          scrub: true,
        },
      });
      // The thread is sewn in step with the words
      gsap.fromTo(
        threads,
        { strokeDashoffset: 1000 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top 90%", end: "bottom 60%", scrub: true },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="about" className={styles.manifesto} data-header="light" aria-label={content.label}>
      <SectionHead index={content.index} label={content.label} question={content.question} questionAs="h2" className={styles.head} />

      <div className={styles.body}>
        {/* Thread BEHIND the words */}
        <svg className={`${styles.thread} ${styles.back}`} viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true">
          <path d={THREAD} pathLength={1000} data-thread />
        </svg>

        <p className={styles.statement} data-statement>
          {words.map((w, i) => (
            <span key={i} className={`${styles.word} ${w.em ? styles.em : ""}`} data-word>
              {w.word}{" "}
            </span>
          ))}
        </p>

        {/* Same thread IN FRONT, masked into bands → it weaves over/under */}
        <svg className={`${styles.thread} ${styles.front}`} viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <mask id="manifesto-weave" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="800">
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={i * 100} y="0" width="50" height="800" fill="white" />
              ))}
            </mask>
          </defs>
          <path d={THREAD} pathLength={1000} data-thread mask="url(#manifesto-weave)" />
        </svg>
      </div>

      <div className={styles.aside}>
        {content.note ? (
          <Note arrow="down-left" className={styles.note}>
            {content.note}
          </Note>
        ) : null}
        <p>{content.aside}</p>
        <a href={content.link.href} className={styles.link}>
          {content.link.label} <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
