"use client";

/**
 * ABOUT — Story: "From buildings to cloth".
 * Sticky title on the left; paragraphs, the sketchbook collage (woven in
 * as you scroll) and a pull quote from Stephanie's own handwriting.
 *
 * Content: content/about.json → "story".
 */
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import Reveal from "@/components/ui/Reveal";
import WeaveImage, { type WeaveHandle } from "@/components/ui/WeaveImage";
import styles from "./AboutStory.module.css";

type Props = {
  content: {
    index: string;
    label: string;
    question: string;
    title: string[];
    paragraphs: string[];
    quote: string;
    quoteCaption: string;
    image: string;
    imageAlt: string;
  };
};

export default function AboutStory({ content }: Props) {
  const weaveRef = useRef<WeaveHandle>(null);

  useEffect(() => {
    const tl = weaveRef.current?.timeline;
    const el = weaveRef.current?.el;
    if (!tl || !el) return;
    if (prefersReducedMotion()) {
      tl.progress(1);
      return;
    }
    const st = ScrollTrigger.create({ trigger: el, start: "top 90%", end: "top 30%", scrub: true, animation: tl });
    return () => st.kill();
  }, []);

  return (
    <section id="story" className={styles.story} data-header="light" aria-label={content.label}>
      <div className={styles.side}>
        <SectionHead index={content.index} label={content.label} question={content.question} />
        <RevealText as="h2" lines={content.title} className={styles.title} />
      </div>

      <div className={styles.body}>
        <Reveal stagger className={styles.paragraphs}>
          {content.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? styles.lead : undefined}>
              {p}
            </p>
          ))}
        </Reveal>

        <div className={styles.media}>
          <WeaveImage ref={weaveRef} src={content.image} alt={content.imageAlt} cols={6} rows={7} width={1200} className={styles.weave} />
        </div>

        <Reveal as="figure" className={styles.quote}>
          <blockquote>
            <p>“{content.quote}”</p>
          </blockquote>
          <figcaption className="caps">— {content.quoteCaption}</figcaption>
        </Reveal>
      </div>
    </section>
  );
}
