"use client";

/**
 * COMMISSION CTA — "Have a space that needs a story?"
 *
 * Night-indigo section with slow drifting threads (canvas, lean away from
 * the cursor), the three steps of how a commission works, and a big
 * magnetic disc button.
 *
 * Content: content/site.json → "commission". The button currently opens
 * an email; point "cta.href" to /commission once that page exists.
 */
import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import Button from "@/components/ui/Button";
import Note from "@/components/ui/Note";
import type { ThreadField } from "@/lib/canvas/ThreadField";
import styles from "./Commission.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question?: string;
    title: string[];
    text: string;
    note?: string;
    steps: { title: string; text: string }[];
    cta: { label: string; href: string };
  };
};

export default function Commission({ content }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = prefersReducedMotion();
    let field: ThreadField | null = null;
    let cancelled = false;
    import("@/lib/canvas/ThreadField").then(({ ThreadField }) => {
      if (cancelled || !canvasRef.current) return;
      const small = window.matchMedia("(max-width: 767px)").matches;
      field = new ThreadField(canvasRef.current, { count: small ? 12 : 22, speed: reduced ? 0 : 1 });
    });

    const ctx = gsap.context(() => {
      const steps = root.querySelectorAll("[data-step]");
      gsap.from(steps, {
        opacity: 0,
        y: 30,
        duration: reduced ? 0.4 : 1.1,
        stagger: 0.12,
        ease: EASE.arrive,
        scrollTrigger: { trigger: root.querySelector("[data-steps]"), start: "top 85%", once: true },
      });
      if (!reduced) {
        gsap.fromTo(
          root.querySelector("[data-stitch]"),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: root.querySelector("[data-steps]"), start: "top 85%", end: "bottom 60%", scrub: true },
          },
        );
      }
    }, root);

    return () => {
      cancelled = true;
      field?.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} id="commission" className={styles.commission} data-header="dark" aria-label={content.label}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.inner}>
        <SectionHead index={content.index} label={content.label} question={content.question} className={styles.head} />

        <RevealText as="h2" lines={content.title} className={styles.title} />

        <div className={styles.side}>
          <p className={styles.text}>{content.text}</p>
          {content.note ? (
            <Note arrow="down-right" rotate={-5} className={styles.note}>
              {content.note}
            </Note>
          ) : null}
        </div>

        <div className={styles.cta}>
          <Button href={content.cta.href} size="lg" strength={0.55} className={styles.disc}>
            {content.cta.label}
          </Button>
        </div>

        <div className={styles.steps} data-steps>
          <span className={styles.stitch} data-stitch aria-hidden="true">
            <span className="stitch-x" />
          </span>
          <ol>
            {content.steps.map((s, i) => (
              <li key={s.title} data-step>
                <span className={styles.knot} aria-hidden="true" />
                <span className={`${styles.stepNum} caps`}>Step 0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
