"use client";

/**
 * Marquee — an endless row that drifts slowly and speeds up with scroll
 * velocity. It also follows the scroll direction (reverse = true flips it).
 *
 *   <Marquee speed={40}>…items…</Marquee>
 *
 * Reduced motion: no movement; items simply wrap onto several lines.
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import { scrollState } from "@/components/providers/SmoothScroll";
import styles from "./Marquee.module.css";

type Props = {
  children: React.ReactNode;
  /** Base speed in px per second. */
  speed?: number;
  reverse?: boolean;
  className?: string;
};

export default function Marquee({ children, speed = 40, reverse = false, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const track = trackRef.current!;
    if (prefersReducedMotion()) {
      root.dataset.static = "true";
      return;
    }

    let x = 0;
    let dir = reverse ? 1 : -1;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(root);

    const tick = (_t: number, deltaMs: number) => {
      if (!visible) return;
      const v = scrollState.velocity;
      if (Math.abs(v) > 0.5) dir = (v > 0 ? -1 : 1) * (reverse ? -1 : 1);
      const boost = 1 + Math.min(Math.abs(v) * 0.6, 12); // TUNE: scroll boost
      x += dir * speed * boost * (deltaMs / 1000);
      const half = track.scrollWidth / 2; // content is duplicated once
      if (half > 0) x = gsap.utils.wrap(-half, 0, x);
      track.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [speed, reverse]);

  return (
    <div ref={rootRef} className={`${styles.marquee} ${className}`}>
      <div ref={trackRef} className={styles.track}>
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
