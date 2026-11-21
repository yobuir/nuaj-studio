"use client";

/**
 * SmoothScroll — starts Lenis (smooth scrolling) and keeps it in sync
 * with GSAP ScrollTrigger. Wraps the whole site in app/layout.tsx.
 *
 * Other code can reach the running instance with `getLenis()`
 * (e.g. to stop scrolling during the preloader, or scroll to an anchor).
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

/** Scroll velocity (px per frame), smoothed. Used for skew/marquee effects. */
export const scrollState = { velocity: 0 };

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Reduced motion → keep native scrolling, but still feed ScrollTrigger.
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.1, // lower = floatier, higher = snappier
      wheelMultiplier: 1,
      // Let anchor links (#work, #commission…) scroll smoothly too.
      anchors: { offset: 0 },
    });
    lenisInstance = lenis;
    // The preloader is still playing → hold the page still until it ends.
    if (document.documentElement.classList.contains("is-preloading")) lenis.stop();

    lenis.on("scroll", (l: Lenis) => {
      scrollState.velocity = l.velocity;
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  // Client-side page change: start the new page at the top (or at its #hash),
  // and let ScrollTrigger re-measure the new layout.
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const lenis = getLenis();
    const hash = window.location.hash;
    const target = hash ? document.querySelector(hash) : null;
    if (target) {
      requestAnimationFrame(() => (lenis ? lenis.scrollTo(target as HTMLElement, { immediate: true }) : target.scrollIntoView()));
    } else {
      lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
    }
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      window.dispatchEvent(new Event("nuaj:header-check"));
    });
  }, [pathname]);

  return <>{children}</>;
}
