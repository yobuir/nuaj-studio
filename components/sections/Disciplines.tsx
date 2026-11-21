"use client";

/**
 * DISCIPLINES — Textile design / Wearables / Commissions.
 *
 * Desktop: the section pins and scrolls sideways. Each panel's image is
 * WOVEN in (warp + weft strips interlock) as the panel slides into view.
 * A running-stitch progress line runs along the bottom.
 *
 * Mobile/tablet: panels stack vertically; each image weaves in as you scroll.
 * Reduced motion: no pinning, images shown straight away.
 *
 * Content: content/site.json → "disciplines".
 */
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import SectionHead from "@/components/ui/SectionHead";
import WeaveImage, { type WeaveHandle } from "@/components/ui/WeaveImage";
import Note from "@/components/ui/Note";
import styles from "./Disciplines.module.css";

type Item = {
  number: string;
  title: string;
  status?: string;
  text: string;
  image: string;
  alt: string;
  note?: string;
  link: { label: string; href: string };
};
type Props = {
  content: { index: string; label: string; question?: string; items: Item[] };
};

export default function Disciplines({ content }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const weaveRefs = useRef<(WeaveHandle | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current!;
    const track = trackRef.current!;
    const panels = Array.from(track.querySelectorAll<HTMLElement>("[data-panel]"));
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 961px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 960px) and (prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { desktop, mobile, reduced } = ctx.conditions as Record<string, boolean>;
        const timelines = weaveRefs.current.map((w) => w?.timeline ?? null);

        if (reduced) {
          timelines.forEach((tl) => tl?.progress(1));
          return;
        }

        if (desktop) {
          const distance = () => track.scrollWidth - window.innerWidth;
          const scrollTween = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              pin: true,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => gsap.set(barRef.current, { scaleX: self.progress }),
            },
          });

          panels.forEach((panel, i) => {
            const tl = timelines[i];
            if (!tl) return;
            ScrollTrigger.create({
              trigger: panel,
              containerAnimation: scrollTween,
              start: "left 100%",
              end: "left 35%",
              scrub: true,
              animation: tl,
            });
            // the giant numeral drifts slower than the panel (parallax depth)
            const num = panel.querySelector("[data-numeral]");
            if (num) {
              gsap.fromTo(
                num,
                { xPercent: 40 },
                {
                  xPercent: -30,
                  ease: "none",
                  scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left right", end: "right left", scrub: true },
                },
              );
            }
          });
        }

        if (mobile) {
          panels.forEach((panel, i) => {
            const tl = timelines[i];
            const el = weaveRefs.current[i]?.el;
            if (!tl || !el) return;
            ScrollTrigger.create({ trigger: el, start: "top 90%", end: "top 30%", scrub: true, animation: tl });
          });
        }
      },
    );

    return () => mm.revert();
  }, []);

  // The wrapper <div> belongs to React; GSAP's pin-spacer goes INSIDE it.
  // Without it, leaving the page crashes (React can't find the section
  // where it left it, because pinning moved it into a spacer).
  return (
    <div className={styles.pinWrap}>
    <section ref={sectionRef} id="disciplines" className={styles.section} data-header="light" aria-label={content.label}>
      <div ref={trackRef} className={styles.track}>
        {/* Intro card */}
        <div className={styles.intro}>
          <SectionHead index={content.index} label={content.label} />
          <h2 className={styles.introTitle}>{content.question}</h2>
          <div className={`${styles.introStitch} stitch-x`} aria-hidden="true" />
          <ol className={styles.index}>
            {content.items.map((item) => (
              <li key={item.number}>
                <span>{item.number}</span> {item.title}
                {item.status ? <em> — {item.status}</em> : null}
              </li>
            ))}
          </ol>
        </div>

        {content.items.map((item, i) => (
          <article
            key={item.number}
            className={`${styles.panel} ${styles[`layout${i % 3}`]}`}
            data-panel
            aria-labelledby={`discipline-${item.number}`}
          >
            <span className={styles.numeral} data-numeral aria-hidden="true">
              {item.number}
            </span>

            <WeaveImage
              ref={(h) => {
                weaveRefs.current[i] = h;
              }}
              src={item.image}
              alt={item.alt}
              cols={i === 1 ? 6 : 7}
              rows={i === 1 ? 7 : 6}
              className={styles.image}
            />

            <p className={`${styles.vertical} caps`} aria-hidden="true">
              {item.number} / {item.title}
            </p>

            <div className={styles.copy}>
              <h3 id={`discipline-${item.number}`} className={styles.title}>
                {item.title}
                {item.status ? <span className={`${styles.status} caps`}>{item.status}</span> : null}
              </h3>
              <p className={styles.text}>{item.text}</p>
              <a href={item.link.href} className={styles.link}>
                {item.link.label} <span aria-hidden="true">→</span>
              </a>
              {item.note ? (
                <Note arrow="left" rotate={-3} className={styles.note}>
                  {item.note}
                </Note>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.progress} aria-hidden="true">
        <span className="stitch-x" />
        <span ref={barRef} className={styles.bar} />
      </div>
    </section>
    </div>
  );
}
