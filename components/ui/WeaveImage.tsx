"use client";

/**
 * WeaveImage — an image that arrives the way cloth is woven.
 *
 * The picture is cut into vertical strips (the WARP) and horizontal strips
 * (the WEFT). The weft strips only show on alternate squares, like a plain
 * weave. Warp strips slide in from above/below, weft strips from left/right,
 * and they interlock into the finished image.
 *
 * Progress is a number 0 → 1 you control (usually from scroll):
 *   const ref = useRef<WeaveHandle>(null);
 *   ref.current.timeline  // a paused GSAP timeline — scrub it, or .play() it
 *
 * Props: src, alt, cols (warp count), rows (weft count), width.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { gsap, EASE } from "@/lib/animations/gsap";
import styles from "./WeaveImage.module.css";

export type WeaveHandle = { timeline: gsap.core.Timeline | null; el: HTMLDivElement | null };

type Props = {
  src: string;
  alt: string;
  cols?: number;
  rows?: number;
  /** Pixel width requested from the image service (must be one of Next's sizes). */
  width?: 640 | 828 | 1080 | 1200 | 1920;
  className?: string;
};

const WeaveImage = forwardRef<WeaveHandle, Props>(function WeaveImage(
  { src, alt, cols = 7, rows = 6, width = 1920, className = "" },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // One optimised file from Next's image service (AVIF/WebP, ~1920px wide),
  // shared by the strips and the hidden real <img> so it downloads once.
  const url = `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  const bg = `url("${url}")`;

  useImperativeHandle(ref, () => ({
    get timeline() {
      return tlRef.current;
    },
    get el() {
      return rootRef.current;
    },
  }));

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const warp = root.querySelectorAll("[data-warp]");
    const weft = root.querySelectorAll("[data-weft]");
    const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.weave } });
    tl.fromTo(
      warp,
      { yPercent: (i) => (i % 2 ? 102 : -102) },
      { yPercent: 0, duration: 1, stagger: { each: 0.06, from: "center" } },
      0,
    )
      .fromTo(
        weft,
        { xPercent: (i) => (i % 2 ? 102 : -102) },
        { xPercent: 0, duration: 1, stagger: { each: 0.07, from: "edges" } },
        0.25,
      )
      // the weave "settles": shadow between threads fades away
      .fromTo(root, { "--weave-shadow": 1 }, { "--weave-shadow": 0, duration: 0.5, ease: "none" }, 1.1);
    tlRef.current = tl;
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.weave} ${className}`}
      style={{ "--cols": cols, "--rows": rows } as React.CSSProperties}
    >
      {/* The real image: for screen readers, SEO and no-JS */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className={styles.base} loading="lazy" decoding="async" />

      <div className={styles.warp} aria-hidden="true">
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className={styles.strip} data-warp>
            <span className={styles.slice} style={{ backgroundImage: bg, left: `${-i * 100}%`, width: `${cols * 100}%` }} />
          </span>
        ))}
      </div>
      <div className={styles.weft} aria-hidden="true">
        {Array.from({ length: rows }, (_, j) => (
          <span key={j} className={`${styles.row} ${j % 2 ? styles.odd : ""}`} data-weft>
            <span className={styles.sliceY} style={{ backgroundImage: bg, top: `${-j * 100}%`, height: `${rows * 100}%` }} />
          </span>
        ))}
      </div>
    </div>
  );
});

export default WeaveImage;
