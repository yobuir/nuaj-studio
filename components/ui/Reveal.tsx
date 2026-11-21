"use client";

/**
 * Reveal — wraps anything that should arrive when it scrolls into view.
 *
 *   <Reveal>…</Reveal>                 fade + rise
 *   <Reveal variant="unroll">…</Reveal> cloth unrolling downward (for images)
 *   <Reveal stagger>…</Reveal>          children arrive one after another
 */
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";

type Props = {
  children: React.ReactNode;
  variant?: "rise" | "unroll";
  stagger?: boolean;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "figure" | "ul" | "li";
};

export default function Reveal({ children, variant = "rise", stagger = false, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const targets = stagger ? Array.from(el.children) : [el];
    const reduced = prefersReducedMotion();
    const from =
      variant === "unroll" && !reduced
        ? { clipPath: "inset(0% 0% 100% 0%)" }
        : { opacity: 0, y: reduced ? 0 : 40 };
    const to =
      variant === "unroll" && !reduced
        ? { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: EASE.weave }
        : { opacity: 1, y: 0, duration: reduced ? 0.5 : 1.1, ease: EASE.arrive };

    gsap.set(targets, from);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(targets, { ...to, delay, stagger: stagger ? 0.12 : 0 }),
    });
    return () => st.kill();
  }, [variant, stagger, delay]);

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
