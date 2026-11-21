"use client";

/**
 * ABOUT — opening.
 * Stephanie's silhouette (the Nuaj portrait mark) is used as a window:
 * her own lace shows through it. On load the lace "unrolls" into the
 * silhouette; afterwards the cloth drifts inside the shape with the
 * cursor and with scroll.
 *
 * Content: content/about.json → "hero".
 */
import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/lib/animations/gsap";
import { isTouchDevice, onIntro, prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import Note from "@/components/ui/Note";
import styles from "./AboutHero.module.css";

type Props = {
  content: {
    label: string;
    question: string;
    name: string[];
    role: string;
    intro: string;
    note?: string;
    portrait: { mask: string; fill: string; alt: string };
  };
};

export default function AboutHero({ content }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const portrait = root.querySelector<HTMLElement>("[data-portrait]")!;
    const fill = root.querySelector<HTMLElement>("[data-fill]")!;
    const fades = root.querySelectorAll("[data-fade]");
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const off = onIntro(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          portrait,
          { clipPath: reduced ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: reduced ? 0 : 1.6, ease: EASE.weave },
        )
          .fromTo(fill, { scale: reduced ? 1.12 : 1.45 }, { scale: 1.12, duration: reduced ? 0 : 2.2, ease: EASE.arrive }, 0)
          .to(fades, { opacity: 1, y: 0, duration: reduced ? 0.5 : 1.1, stagger: 0.1, ease: EASE.arrive }, 0.5);
      });

      if (!reduced) {
        // the lace drifts inside the silhouette as you scroll past
        gsap.to(fill, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      }
      return off;
    }, root);

    // …and follows the cursor a little, like cloth under a hand
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (!reduced && !isTouchDevice()) {
      const xTo = gsap.quickTo(fill, "x", { duration: 1.2, ease: "power3" });
      const rTo = gsap.quickTo(fill, "rotate", { duration: 1.4, ease: "power3" });
      onMove = (e: PointerEvent) => {
        const k = e.clientX / window.innerWidth - 0.5;
        xTo(k * -40);
        rTo(k * 3);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    return () => {
      ctx.revert();
      if (onMove) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={rootRef} id="top" className={styles.hero} data-header="light" aria-label="About Stephanie Onuaja">
      <div className={styles.copy}>
        <SectionHead index="(About)" label={content.label} question={content.question} />
        <RevealText as="h1" lines={content.name} play="intro" className={styles.name} />
        <p className={`${styles.role} caps`} data-fade>
          {content.role}
        </p>
        <p className={styles.intro} data-fade>
          {content.intro}
        </p>
      </div>

      <figure className={styles.figure}>
        <div
          className={styles.portrait}
          data-portrait
          role="img"
          aria-label={content.portrait.alt}
          style={{ "--mask": `url(${content.portrait.mask})` } as React.CSSProperties}
        >
          <div className={styles.fill} data-fill style={{ backgroundImage: `url(/_next/image?url=${encodeURIComponent(content.portrait.fill)}&w=1080&q=75)` }} />
        </div>
        {content.note ? (
          <Note arrow="down-right" rotate={-6} className={styles.note}>
            {content.note}
          </Note>
        ) : null}
      </figure>
    </section>
  );
}
