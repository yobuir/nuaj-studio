"use client";

/**
 * ScrollFx — global scroll-velocity effect.
 * Writes the current (smoothed) scroll speed to two CSS variables on <html>:
 *   --skew   e.g. "1.8deg"  → used by [data-skew] (images lean when you scroll fast)
 *   --speed  0…1           → free to use anywhere
 * Any element with the data-skew attribute leans automatically (see globals.css).
 * Don't put data-skew on an element GSAP also transforms — wrap it instead.
 */
import { useEffect } from "react";
import { gsap } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import { scrollState } from "./SmoothScroll";

export default function ScrollFx() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = document.documentElement;
    let skew = 0;
    let last = "";
    const tick = () => {
      const target = gsap.utils.clamp(-3.5, 3.5, scrollState.velocity * 0.12); // TUNE strength
      skew += (target - skew) * 0.1;
      const value = Math.abs(skew) < 0.01 ? "0" : skew.toFixed(2);
      if (value !== last) {
        last = value;
        root.style.setProperty("--skew", `${value}deg`);
        root.style.setProperty("--speed", Math.min(Math.abs(skew) / 3.5, 1).toFixed(3));
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return null;
}
