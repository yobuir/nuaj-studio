"use client";

/**
 * Button — a magnetic pill link/button.
 * The button leans toward the cursor when it's close, and the label
 * moves a little further than the pill (gives it depth).
 *
 *   <Button href="#commission">Start a commission</Button>
 *   <Button href="#work" variant="ghost">View the work</Button>
 *
 * variant: "solid" (cobalt) | "light" (ivory) | "ghost" (outline)
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/lib/animations/motion";
import SmartLink from "./SmartLink";
import styles from "./Button.module.css";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "solid" | "light" | "ghost";
  size?: "md" | "lg";
  /** How strongly it follows the cursor (0 = off, 0.4 = default). */
  strength?: number;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export default function Button({
  href,
  children,
  variant = "solid",
  size = "md",
  strength = 0.4,
  className = "",
  onClick,
  type = "button",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !strength || isTouchDevice() || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    const lxTo = gsap.quickTo(labelRef.current, "x", { duration: 0.6, ease: "power3" });
    const lyTo = gsap.quickTo(labelRef.current, "y", { duration: 0.6, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      lxTo(dx * strength * 0.35);
      lyTo(dy * strength * 0.35);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
      lxTo(0);
      lyTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  const cls = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  const inner = (
    <>
      <span className={styles.fill} aria-hidden="true" />
      <span ref={labelRef} className={styles.label}>
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <SmartLink ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={cls} onClick={onClick}>
        {inner}
      </SmartLink>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
