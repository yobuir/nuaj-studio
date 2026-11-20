"use client";

/**
 * Note — a handwritten margin note, like the notes in Stephanie's sketchbook.
 * It "writes itself" left to right when it scrolls into view, and can
 * point somewhere with a small hand-drawn arrow.
 *
 *   <Note arrow="down-left">made by hand, always</Note>
 *
 * Use sparingly: one per section at most.
 */
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import styles from "./Note.module.css";

type Arrow = "down-left" | "down-right" | "left" | "none";

const ARROWS: Record<Exclude<Arrow, "none">, string> = {
  "down-left": "M58 4 C50 26 34 40 8 46 M8 46 L20 36 M8 46 L22 50",
  "down-right": "M4 4 C12 26 28 40 54 46 M54 46 L42 36 M54 46 L40 50",
  left: "M58 20 C42 12 24 14 6 24 M6 24 L18 14 M6 24 L19 31",
};

export default function Note({
  children,
  arrow = "none",
  className = "",
  rotate = -4,
}: {
  children: React.ReactNode;
  arrow?: Arrow;
  className?: string;
  rotate?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (prefersReducedMotion()) {
      el.style.setProperty("--reveal", "100%");
      return;
    }
    const tl = gsap.timeline({ paused: true });
    tl.to(el, { "--reveal": "100%", duration: 1.4, ease: "power2.inOut" });
    const path = el.querySelector("path");
    if (path) tl.fromTo(path, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" }, 1.1);
    const st = ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => tl.play() });
    return () => {
      st.kill();
      tl.kill();
    };
  }, []);

  return (
    <p ref={ref} className={`${styles.note} ${className}`} style={{ "--rot": `${rotate}deg` } as React.CSSProperties}>
      <span className={styles.text}>{children}</span>
      {arrow !== "none" ? (
        <svg className={styles.arrow} data-dir={arrow} viewBox="0 0 62 54" aria-hidden="true">
          <path d={ARROWS[arrow]} pathLength={100} />
        </svg>
      ) : null}
    </p>
  );
}
