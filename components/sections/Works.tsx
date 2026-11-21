"use client";

/**
 * SELECTED WORKS — an uneven, editorial grid (not a masonry).
 *
 * - Each image UNROLLS downward when it scrolls into view, like cloth
 *   coming off a bolt (a rolled edge travels down the picture).
 * - Hover (desktop): the image ripples like touched cloth (WebGL, see
 *   lib/webgl/hover/HoverDistort.ts) and the cursor becomes "View".
 * - Fast scrolling makes the images lean slightly (data-skew).
 * - Each item links to /work/[slug] (pages come later).
 *
 * Content: content/works.json. Placement repeats every 5 items, so you can
 * add as many projects as you like.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, EASE } from "@/lib/animations/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/lib/animations/motion";
import SectionHead from "@/components/ui/SectionHead";
import RevealText from "@/components/ui/RevealText";
import type { HoverDistort } from "@/lib/webgl/hover/HoverDistort";
import { hasFastWebGL } from "@/lib/webgl/support";
import styles from "./Works.module.css";

export type Work = {
  slug: string;
  title: string;
  year: string;
  category: string;
  materials: string;
  image: string;
  alt: string;
  size: string;
  placeholder?: boolean;
};

type Props = {
  content: { index: string; label: string; question?: string; title: string[] };
  items: Work[];
  /** false on /work, where the page has its own heading */
  showHead?: boolean;
};

const SIZES: Record<string, string> = {
  large: "(max-width: 767px) 100vw, 55vw",
  wide: "(max-width: 767px) 100vw, 60vw",
  tall: "(max-width: 767px) 80vw, 34vw",
  small: "(max-width: 767px) 70vw, 26vw",
};

export default function Works({ content, items, showHead = true }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-unroll]").forEach((el) => {
        const img = el.querySelector("img");
        const edge = el.querySelector("[data-edge]");
        if (reduced) {
          gsap.set(el, { clipPath: "inset(0% 0% 0% 0%)" });
          return;
        }
        const tl = gsap.timeline({ paused: true });
        tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.weave }, 0)
          .fromTo(edge, { top: "0%" }, { top: "100%", duration: 1.5, ease: EASE.weave }, 0)
          .to(edge, { opacity: 0, duration: 0.3 }, 1.25)
          .fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 0, duration: 1.9, ease: EASE.arrive }, 0);
        ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tl.play() });
      });

      root.querySelectorAll<HTMLElement>("[data-meta]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 16,
          duration: 1,
          ease: EASE.arrive,
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        });
      });
    }, root);

    // WebGL hover ripple: desktop + real GPU only. Nothing is loaded or
    // created until the visitor first hovers a work image.
    let hd: HoverDistort | null = null;
    let cancelled = false;
    const tiles = root.querySelectorAll<HTMLElement>("[data-distort]");
    const boot = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tiles.forEach((t) => t.removeEventListener("pointerenter", boot));
      if (!hasFastWebGL()) return;
      const tile = e.currentTarget as HTMLElement;
      import("@/lib/webgl/hover/HoverDistort").then(({ HoverDistort }) => {
        if (cancelled) return;
        hd = HoverDistort.create();
        hd?.bind(root);
        hd?.activate(tile, e);
      });
    };
    if (!reduced && !isTouchDevice()) tiles.forEach((t) => t.addEventListener("pointerenter", boot));

    return () => {
      cancelled = true;
      tiles.forEach((t) => t.removeEventListener("pointerenter", boot));
      ctx.revert();
      hd?.destroy();
    };
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section ref={rootRef} id="work" className={`${styles.works} ${showHead ? "" : styles.bare}`} data-header="light" aria-label={content.label}>
      {showHead ? (
      <header className={styles.head}>
        <SectionHead index={content.index} label={content.label} question={content.question} />
        <RevealText as="h2" lines={content.title} className={styles.title} />
        <a href="/work" className={`${styles.count} caps`}>
          All {String(items.length).padStart(2, "0")} pieces →
        </a>
      </header>
      ) : null}

      <ul className={styles.grid}>
        {items.map((w, i) => (
          <li key={w.slug} className={`${styles.item} ${styles[w.size] ?? ""}`}>
            <a href={`/work/${w.slug}`} className={styles.link} data-cursor="view" data-cursor-label="View">
              <div data-skew>
                <div className={styles.media} data-unroll data-distort>
                  <Image src={w.image} alt={w.alt} fill sizes={SIZES[w.size] ?? "50vw"} className={styles.img} />
                  <span className={styles.edge} data-edge aria-hidden="true" />
                  {w.placeholder ? <span className={`${styles.placeholder} caps`}>Placeholder</span> : null}
                </div>
              </div>
              <div className={styles.meta} data-meta>
                <span className={`${styles.num} caps`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.name}>{w.title}</h3>
                <span className={`${styles.details} caps`}>
                  {w.category} · {w.year}
                </span>
                <span className={styles.materials}>{w.materials}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
