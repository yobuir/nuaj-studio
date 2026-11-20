"use client";

/**
 * RevealText — headline lines that are "threaded" in:
 * a thin thread draws under each line, then the words rise up from
 * behind it.
 *
 *   <RevealText as="h1" lines={["Fabric that", "holds your", "story."]} play="intro" />
 *   <RevealText as="h2" lines={["Have a space", "that needs a story?"]} play="scroll" />
 *
 * play="intro"  → starts when the preloader hands off
 * play="scroll" → starts when the text scrolls into view
 * play="manual" → you control it via the `active` prop
 *
 * Lines come from the content files, so line breaks are always intentional.
 */
import { createElement, useEffect, useRef } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/animations/gsap";
import { onIntro, prefersReducedMotion } from "@/lib/animations/motion";
import styles from "./RevealText.module.css";

type Props = {
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p";
  play?: "intro" | "scroll" | "manual";
  active?: boolean;
  delay?: number;
  /** Show the thread under each line. */
  threads?: boolean;
  className?: string;
  lineClassName?: string;
};

export default function RevealText({
  lines,
  as = "h2",
  play = "scroll",
  active,
  delay = 0,
  threads = true,
  className = "",
  lineClassName = "",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelectorAll<HTMLElement>("[data-line-inner]");
    const thr = el.querySelectorAll<HTMLElement>("[data-line-thread]");

    const tl = gsap.timeline({ paused: true, delay });
    if (prefersReducedMotion()) {
      tl.to(inner, { y: 0, opacity: 1, duration: 0.6, ease: "none" });
      tl.set(thr, { scaleX: 1, opacity: 0.35 }, 0);
    } else {
      tl.to(thr, { scaleX: 1, duration: 0.9, stagger: 0.12, ease: EASE.weave }, 0)
        .to(inner, { y: 0, opacity: 1, duration: 1.25, stagger: 0.12, ease: EASE.arrive }, 0.35)
        // the thread relaxes to a faint hairline once the words are in
        .to(thr, { opacity: 0.28, duration: 0.8, ease: "none" }, 1.1);
    }
    tlRef.current = tl;

    let cleanup = () => {};
    if (play === "intro") cleanup = onIntro(() => tl.play());
    if (play === "scroll") {
      const st = ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => tl.play() });
      cleanup = () => st.kill();
    }
    return () => {
      cleanup();
      tl.kill();
    };
  }, [play, delay]);

  useEffect(() => {
    if (play === "manual" && active) tlRef.current?.play();
  }, [play, active]);

  return createElement(
    as,
    { ref, className: `${styles.root} ${className}`, "aria-label": lines.join(" ") },
    lines.map((line, i) => (
      <span key={i} className={`${styles.line} ${lineClassName}`} aria-hidden="true">
        <span className={styles.mask}>
          <span className={styles.inner} data-line-inner>
            {line}
          </span>
        </span>
        {threads ? <span className={styles.thread} data-line-thread /> : null}
      </span>
    )),
  );
}
