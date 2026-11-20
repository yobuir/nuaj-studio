"use client";

/**
 * SmoothScroll — starts Lenis (smooth scrolling) and keeps it in sync
 * with GSAP ScrollTrigger. Wraps the whole site in app/layout.tsx.
 *
 * Other code can reach the running instance with `getLenis()`
 * (e.g. to stop scrolling during the preloader, or scroll to an anchor).
 */
import { useEffect } from "react";
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

  return <>{children}</>;
}
