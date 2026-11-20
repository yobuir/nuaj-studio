"use client";

/**
 * PROCESS — Gather → Cut → Compose → Stitch.
 *
 * A tall section with a sticky frame. As you scroll, one canvas visual
 * changes shape step by step (see lib/canvas/ProcessField.ts) and the
 * matching step text lights up beside a vertical thread that fills.
 *
 * Content: content/site.json → "process".
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScrollTrigger } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import type { ProcessField as Field } from "@/lib/canvas/ProcessField";
import styles from "./Process.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question?: string;
    title: string[];
    finalImage: string;
    /** Small pre-made file the canvas samples its colours from. */
    canvasImage: string;
    steps: { title: string; text: string; image: string; alt: string }[];
  };
};

export default function Process({ content }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const steps = content.steps;

  useEffect(() => {
    const section = sectionRef.current!;
    const items = section.querySelectorAll<HTMLElement>("[data-step]");
    const photos = section.querySelectorAll<HTMLElement>("[data-photo]");
    const reduced = prefersReducedMotion();
    let cancelled = false;
    let progress = reduced ? steps.length - 1 : 0;

    const small = window.matchMedia("(max-width: 767px)").matches;
    // Load the canvas code only when the section gets close
    const loader = ScrollTrigger.create({
      trigger: section,
      start: "top 150%",
      once: true,
      onEnter: () => {
        import("@/lib/canvas/ProcessField").then(({ ProcessField }) => {
          if (cancelled || !canvasRef.current) return;
          const src = content.canvasImage;
          fieldRef.current = new ProcessField(canvasRef.current, {
            src,
            density: small ? 28 : 44,
            onReady: () => !cancelled && setCanvasReady(true),
          });
          fieldRef.current.setProgress(progress);
        }).catch(() => {
          /* canvas code failed to load → the still photo stays visible */
        });
      },
    });

    const setActive = (p: number) => {
      const active = Math.min(steps.length - 1, Math.round(p));
      items.forEach((el, i) => {
        el.dataset.state = i < active ? "done" : i === active ? "active" : "next";
      });
      photos.forEach((el, i) => {
        el.dataset.active = i === active ? "true" : "false";
      });
    };
    setActive(progress);

    const st = reduced
      ? null
      : ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            // hold a little at the start and end of the scroll
            const k = Math.min(1, Math.max(0, (self.progress - 0.06) / 0.86));
            progress = k * (steps.length - 1);
            fieldRef.current?.setProgress(progress);
            if (fillRef.current) fillRef.current.style.transform = `scaleY(${k})`;
            setActive(progress);
          },
        });
    if (reduced && fillRef.current) fillRef.current.style.transform = "scaleY(1)";

    return () => {
      cancelled = true;
      loader.kill();
      st?.kill();
      fieldRef.current?.destroy();
    };
  }, [content.canvasImage, steps.length]);

  return (
    <section ref={sectionRef} id="process" className={styles.process} data-header="light" aria-label={content.label}>
      <div className={`${styles.frame} graph`}>
        <div className={styles.copy}>
          <SectionHead index={content.index} label={content.label} question={content.question} />
          <RevealText as="h2" lines={content.title} className={styles.title} />

          <div className={styles.steps}>
            <span className={styles.track} aria-hidden="true">
              <span className="stitch-y" />
              <span ref={fillRef} className={styles.fill} />
            </span>
            <ol className={styles.list}>
            {steps.map((s, i) => (
              <li key={s.title} className={styles.step} data-step data-state="next">
                <span className={styles.knot} aria-hidden="true" />
                <span className={`${styles.num} caps`}>0{i + 1}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </li>
            ))}
            </ol>
          </div>
        </div>

        <figure className={styles.visual} data-ready={canvasReady || undefined}>
          {/* Still photo underneath: shown until (or if) the canvas is ready */}
          <Image
            src={content.finalImage}
            alt="Detail of The Mosaic of Our Story: cobalt lace strips stitched over gold aso-oke"
            fill
            sizes="(max-width: 960px) 80vw, 40vw"
            className={styles.still}
          />
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

          {/* Pinned photo card: the real moment of each step */}
          <div className={styles.photos}>
            <span className={styles.tape} aria-hidden="true" />
            {steps.map((s, i) => (
              <div key={s.title} className={styles.photo} data-photo data-active={i === 0 ? "true" : "false"}>
                <Image src={s.image} alt={s.alt} fill sizes="(max-width: 960px) 40vw, 16vw" />
                <span className={`${styles.photoLabel} caps`}>
                  0{i + 1} — {s.title}
                </span>
              </div>
            ))}
          </div>
          <figcaption className={`${styles.caption} caps`}>
            Detail — The Mosaic of Our Story, 2025
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
