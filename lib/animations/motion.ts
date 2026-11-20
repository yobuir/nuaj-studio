/**
 * Small helpers shared by every animation.
 */

/** True when the visitor asked their OS for less motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on touch-first devices (phones, most tablets). */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/* ------------------------------------------------------------------
   Intro signal
   The preloader calls `markIntroDone()` when it finishes (or straight
   away for returning visitors). Sections call `onIntro(fn)` to start
   their entrance animations at exactly the right moment.
   ------------------------------------------------------------------ */
let introDone = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (introDone) return;
  introDone = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

/** Runs `fn` once the intro is done. Returns an unsubscribe function. */
export function onIntro(fn: () => void): () => void {
  if (introDone) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}
