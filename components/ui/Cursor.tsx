"use client";

/**
 * Cursor — a small dot + a ring that trails behind it.
 *
 * How it reacts (add these attributes to any element):
 *   data-cursor="link"   → ring grows (auto for <a> and <button>)
 *   data-cursor="view"   → ring becomes a filled disc with a label
 *   data-cursor-label="View"  → the text shown in "view" mode
 *   data-cursor="hide"   → cursor hides (e.g. over a video)
 *
 * Disabled on touch devices and when reduced motion is on.
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { isTouchDevice, prefersReducedMotion } from "@/lib/animations/motion";
import styles from "./Cursor.module.css";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isTouchDevice() || prefersReducedMotion()) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    // quickTo = cheap, smooth following. Dot is near-instant, ring lags.
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    let visible = false;
    let state = "";

    const setState = (next: string, label = "") => {
      if (next === state) return;
      state = next;
      ring.dataset.state = next;
      dot.dataset.state = next;
      if (labelRef.current) labelRef.current.textContent = label;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      // Work out what we're hovering
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-cursor], a, button, input, textarea, label") as HTMLElement | null;
      if (!el) return setState("");
      const kind = el.dataset.cursor;
      if (kind === "view") return setState("view", el.dataset.cursorLabel ?? "View");
      if (kind === "hide") return setState("hide");
      if (kind === "text" || el.matches("input, textarea")) return setState("text");
      setState("link");
    };

    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
    };
    const onDown = () => ring.classList.add(styles.pressed);
    const onUp = () => ring.classList.remove(styles.pressed);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className={styles.cursor} aria-hidden="true">
      <div ref={ringRef} className={styles.ring}>
        <span ref={labelRef} className={styles.label} />
      </div>
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
