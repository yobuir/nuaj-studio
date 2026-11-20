/**
 * GSAP setup — import gsap from HERE (not from "gsap") so plugins and
 * the shared easing are always registered.
 *
 *   import { gsap, ScrollTrigger, EASE } from "@/lib/animations/gsap";
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  // Same curves as --ease-weave / --ease-out in styles/tokens.css
  CustomEase.create("weave", "0.65,0,0.35,1");
  CustomEase.create("arrive", "0.16,1,0.3,1");

  gsap.defaults({ ease: "weave", duration: 0.9 });
}

export const EASE = {
  /** In-out: for things that travel (threads, panels, masks). */
  weave: "weave",
  /** Fast-in, soft landing: for things that arrive (text, images). */
  arrive: "arrive",
} as const;

export { gsap, ScrollTrigger };
