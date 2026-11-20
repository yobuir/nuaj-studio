"use client";

/**
 * Preloader — first visit only, ~1.8s.
 *
 *  1. A thin thread runs in from the left edge of the screen…
 *  2. …and thickens into the hand-drawn "nuaj" stroke as it is sewn.
 *  3. The dot of the j drops in.
 *  4. The logo flies into its place in the header while the ivory
 *     panel lifts away like cloth, revealing the hero.
 *
 * "First visit" is remembered in localStorage (key below). A tiny script
 * in app/layout.tsx reads it BEFORE the page paints, so returning
 * visitors never see a flash of the preloader.
 * Also skipped for prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from "react";
import { gsap, EASE } from "@/lib/animations/gsap";
import { markIntroDone } from "@/lib/animations/motion";
import { getLenis } from "@/components/providers/SmoothScroll";
import { LOGO_DOT, LOGO_PATH, LOGO_STROKE, LOGO_VIEWBOX } from "@/components/ui/Logo";
import styles from "./Preloader.module.css";

export const VISITED_KEY = "nuaj:visited";

/** Lead-in thread: from far off-screen left, curving into the start of the "n". */
const LEAD_IN = "M-2400 560 C-1500 560 -700 600 -300 560 C-120 540 0 500 22 410";

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;

    const finish = () => {
      html.classList.remove("is-preloading");
      try {
        localStorage.setItem(VISITED_KEY, "1");
      } catch {
        /* private mode etc. — fine, it just plays again next time */
      }
      getLenis()?.start();
      setGone(true);
    };

    // Returning visitor / reduced motion → skip entirely.
    if (!html.classList.contains("is-preloading")) {
      markIntroDone();
      setGone(true);
      return;
    }

    const svg = svgRef.current!;
    const lead = svg.querySelector<SVGPathElement>("[data-lead]")!;
    const stroke = svg.querySelector<SVGPathElement>("[data-logo-stroke]")!;
    const dot = svg.querySelector<SVGCircleElement>("[data-logo-dot]")!;
    // Both paths use pathLength={1000}, so 1000 = the whole length (a big
    // number keeps GSAP's pixel rounding from making the drawing jump).
    // Their hidden starting state is set in CSS (no flash before JS loads).
    gsap.set(dot, { transformOrigin: "50% 50%", y: -120, scale: 0.4 });

    const tl = gsap.timeline({ defaults: { ease: EASE.weave } });

    // 1. thread whips in from the left
    tl.to(lead, { strokeDashoffset: 0, duration: 0.5, ease: "power2.in" }, 0.05)
      // 2. the logo is sewn; the lead-in is pulled through after it
      .to(stroke, { strokeDashoffset: 0, duration: 0.85, ease: "power1.inOut" }, 0.5)
      .to(lead, { strokeDashoffset: -1000, duration: 0.6, ease: "power2.inOut" }, 0.5)
      // 3. the dot drops in
      .to(dot, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: EASE.arrive }, 1.2)
      // 4. hand-off to the header + panel lift
      .add(() => {
        const target = document.querySelector<HTMLElement>("[data-header-logo] svg");
        if (!target) return;
        const from = svg.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        gsap.to(svg, {
          x: to.left - from.left,
          y: to.top - from.top,
          scale: to.width / from.width,
          transformOrigin: "0 0",
          color: getComputedStyle(target).color,
          duration: 0.6,
          ease: EASE.weave,
        });
      }, 1.3)
      .to(rootRef.current, { "--lift": "100%", duration: 0.6, ease: EASE.weave }, 1.3)
      .add(markIntroDone, 1.4)
      .add(finish, 1.9);

    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className={styles.preloader} aria-hidden="true">
      <div className={styles.panel} />
      <svg ref={svgRef} className={styles.logo} viewBox={LOGO_VIEWBOX}>
        <path d={LEAD_IN} pathLength={1000} data-lead fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
        <path
          d={LOGO_PATH}
          pathLength={1000}
          data-logo-stroke
          fill="none"
          stroke="currentColor"
          strokeWidth={LOGO_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle {...LOGO_DOT} data-logo-dot fill="currentColor" />
      </svg>
    </div>
  );
}
