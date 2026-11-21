"use client";

/**
 * ABOUT — The cutting table: a sketchbook strip of real studio photos,
 * taped onto graph paper. The strip drifts sideways as you scroll down
 * (desktop); on phones it's a swipeable row.
 *
 * Content: content/about.json → "studio".
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import Note from "@/components/ui/Note";
import styles from "./StudioStrip.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question: string;
    note?: string;
    photos: { image: string; alt: string; caption: string }[];
  };
};

const TILT = [-4, 3, -2, 5, -3];

export default function StudioStrip({ content }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 961px)", () => {
      const track = trackRef.current!;
      gsap.fromTo(
        track,
        { x: () => window.innerWidth * 0.15 },
        {
          x: () => -(track.scrollWidth - window.innerWidth * 0.85),
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} id="studio" className={`${styles.strip} graph`} data-header="light" aria-label={content.label}>
      <div className={styles.head}>
        <SectionHead index={content.index} label={content.label} question={content.question} questionAs="h2" />
        {content.note ? (
          <Note arrow="down-right" rotate={-4} className={styles.note}>
            {content.note}
          </Note>
        ) : null}
      </div>

      <ul ref={trackRef} className={styles.track}>
        {content.photos.map((p, i) => (
          <li key={p.image} className={styles.card} style={{ "--tilt": `${TILT[i % TILT.length]}deg` } as React.CSSProperties}>
            <span className={styles.tape} aria-hidden="true" />
            <div className={styles.photo}>
              <Image src={p.image} alt={p.alt} fill sizes="(max-width: 960px) 70vw, 24vw" />
            </div>
            <p className={styles.caption}>{p.caption}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
