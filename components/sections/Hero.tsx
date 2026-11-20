"use client";

/**
 * HERO — full-screen WebGL fabric.
 *
 * Layers (bottom → top):
 *   1. Poster photo (next/image, loads first — fast LCP, also the fallback)
 *   2. WebGL cloth canvas (fades in over the poster when ready)
 *   3. Text: kicker, headline, intro + buttons, the "sewn label" card
 *
 * Scroll: the section is taller than the screen; its inner frame sticks
 * while you scroll, and the cloth ROLLS UP from the bottom like a blind,
 * revealing the ivory page and a thread that leads into the next section.
 *
 * Mobile: same idea with a lighter cloth (fewer vertices, smaller texture).
 * Reduced motion / no WebGL: the photo stays still and simply lifts away.
 *
 * Text and images come from /content/site.json → "hero".
 */
import { useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import RevealText from "@/components/ui/RevealText";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { gsap, ScrollTrigger, EASE } from "@/lib/animations/gsap";
import { isTouchDevice, onIntro, prefersReducedMotion } from "@/lib/animations/motion";
import type { FabricScene } from "@/lib/webgl/fabric/FabricScene";
import { hasFastWebGL } from "@/lib/webgl/support";
import styles from "./Hero.module.css";

type Link = { label: string; href: string };
export type HeroContent = {
  kicker: string;
  headline: string[];
  intro: string;
  primaryCta: Link;
  secondaryCta: Link;
  image: { desktop: string; mobile: string; textureDesktop: string; textureMobile: string; alt: string };
  label: { eyebrow: string; title: string; year: string; lines: string[]; href: string };
  /** What the rolling cloth uncovers underneath. */
  reveal: { kicker: string; words: { word: string; image: string; alt: string }[]; caption: string };
};

export default function Hero({ content, location }: { content: HeroContent; location: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FabricScene | null>(null);
  const rollRef = useRef(0);
  const [glReady, setGlReady] = useState(false);

  /* ---------- 1. WebGL cloth (lazy-loaded, never blocks first paint) ---------- */
  useEffect(() => {
    // No WebGL cloth for reduced motion or software-only WebGL (poster stays)
    if (prefersReducedMotion() || !hasFastWebGL()) return;
    let cancelled = false;

    const small = window.matchMedia("(max-width: 767px)").matches;
    const touch = isTouchDevice();
    const src = small ? content.image.textureMobile : content.image.textureDesktop;

    // Warm the texture download right away (cheap)…
    const preload = new window.Image();
    preload.src = src;

    // …but only start the GPU work once the preloader has handed off,
    // so shader compiling never makes the preloader stutter.
    // The poster photo covers the gap, then the cloth fades in over it.
    const unsubscribe = onIntro(() => {
      import("@/lib/webgl/fabric/FabricScene").then(({ FabricScene }) => {
        if (cancelled || !glRef.current) return;
        const scene = FabricScene.create(glRef.current, {
          src,
          segments: small ? 40 : touch ? 64 : 110,
          maxDpr: small ? 1 : 1.5,
          interactive: true,
          onReady: () => {
            setGlReady(true);
            scene?.playIntro();
          },
          onLost: () => setGlReady(false),
        });
        if (scene) scene.setRoll(rollRef.current); // page may already be scrolled
        sceneRef.current = scene;
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [content.image.textureDesktop, content.image.textureMobile]);

  /* ---------- 2. Intro: supporting text arrives after the headline ---------- */
  useEffect(() => {
    const el = frameRef.current!;
    const items = el.querySelectorAll("[data-hero-fade]");
    const label = el.querySelector("[data-hero-label]");
    const cue = el.querySelector("[data-hero-cue]");
    const reduced = prefersReducedMotion();

    return onIntro(() => {
      const tl = gsap.timeline({ delay: 0.5 });
      tl.to(items, { opacity: 1, y: 0, duration: reduced ? 0.6 : 1.1, stagger: 0.08, ease: EASE.arrive })
        .to(label, { clipPath: "inset(0% 0% 0% 0%)", rotate: -3, duration: 1.1, ease: EASE.weave }, 0.25)
        .to(cue, { opacity: 1, duration: 0.8 }, 0.6);
    });
  }, []);

  /* ---------- 3. Scroll: roll the cloth up ---------- */
  useEffect(() => {
    const section = sectionRef.current!;
    const frame = frameRef.current!;
    const reduced = prefersReducedMotion();

    const content = frame.querySelector("[data-hero-content]");
    const label = frame.querySelector("[data-hero-label]");
    const handoff = frame.querySelector("[data-hero-handoff]");
    const revealWords = frame.querySelectorAll("[data-reveal-word]");
    const revealPics = frame.querySelectorAll("[data-reveal-pic]");
    const revealMeta = frame.querySelectorAll("[data-reveal-meta]");

    // Text drifts up and away during the first third of the roll,
    // then the words underneath rise as the cloth uncovers them.
    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    tl.to(content, { yPercent: -18, opacity: 0, duration: 0.35 }, 0)
      .to(label, { yPercent: -60, rotate: 4, opacity: 0, duration: 0.3 }, 0.02)
      .fromTo(revealWords, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, stagger: 0.08, ease: "power2.out" }, 0.3)
      .fromTo(revealPics, { clipPath: "inset(100% 0% 0% 0%)", rotate: 0 }, { clipPath: "inset(0% 0% 0% 0%)", rotate: (i) => [-6, 4, -3][i % 3], duration: 0.2, stagger: 0.08, ease: "power2.out" }, 0.4)
      .fromTo(revealMeta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.05 }, 0.55)
      .fromTo(handoff, { scaleY: 0 }, { scaleY: 1, duration: 0.12 }, 0.86);

    let tone = "dark";
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? false : true,
      onUpdate: (self) => {
        const p = self.progress;
        tl.progress(p);
        // cloth rolls between 4% and 92% of the scroll (eased for weight)
        const k = gsap.utils.clamp(0, 1, (p - 0.04) / 0.88);
        const roll = gsap.parseEase("power1.inOut")(k);
        rollRef.current = roll;
        if (sceneRef.current) sceneRef.current.setRoll(roll);
        // Fallback (no WebGL): the photo lifts away like a blind
        if (mediaRef.current) mediaRef.current.style.setProperty("--lift", `${(roll * 100).toFixed(2)}%`);

        // Header: light text over the cloth, dark once the ivory shows
        const next = roll > 0.8 ? "light" : "dark";
        if (next !== tone) {
          tone = next;
          frame.dataset.header = next;
          window.dispatchEvent(new Event("nuaj:header-check"));
        }
      },
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, []);

  /* ---------- Art-directed poster: landscape crop on desktop, tall on mobile ---------- */
  const common = { alt: content.image.alt, fill: true, priority: true, sizes: "100vw", quality: 75 };
  const desktop = getImageProps({ ...common, src: content.image.desktop }).props;
  const mobile = getImageProps({ ...common, src: content.image.mobile }).props;

  return (
    <section ref={sectionRef} id="top" className={styles.hero} aria-label="Introduction">
      <div ref={frameRef} className={styles.frame} data-header="dark">
        {/* Media */}
        <div ref={mediaRef} className={styles.media} data-gl-ready={glReady || undefined}>
          <picture className={styles.poster}>
            <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" />
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img {...desktop} fetchPriority="high" />
          </picture>
          <div ref={glRef} className={styles.gl} />
          <span className={styles.rollEdge} aria-hidden="true" />
        </div>

        {/* Text */}
        <div className={styles.content} data-hero-content>
          <p className={`${styles.kicker} caps`} data-hero-fade>
            <span className={styles.index}>(01)</span> {content.kicker} — {location}
          </p>

          <RevealText as="h1" lines={content.headline} play="intro" className={styles.title} />

          <div className={styles.aside}>
            <p className={styles.intro} data-hero-fade>
              {content.intro}
            </p>
            <div className={styles.actions} data-hero-fade>
              <Button href={content.primaryCta.href} variant="light">
                {content.primaryCta.label}
              </Button>
              <a href={content.secondaryCta.href} className={styles.textLink}>
                {content.secondaryCta.label}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* The sewn-in label — a nod to the real label on the piece */}
        <a href={content.label.href} className={styles.label} data-hero-label data-cursor="view" data-cursor-label="View">
          <Logo title="" className={styles.labelLogo} />
          <span className="caps">{content.label.eyebrow}</span>
          <strong className={styles.labelTitle}>
            {content.label.title}, {content.label.year}
          </strong>
          {content.label.lines.map((l) => (
            <span key={l} className={styles.labelLine}>
              {l}
            </span>
          ))}
        </a>

        <div className={`${styles.cue} caps`} data-hero-cue aria-hidden="true">
          <span>Scroll</span>
          <span className={styles.cueThread} />
        </div>

        {/* Under the cloth: revealed as it rolls away */}
        <div className={styles.under} aria-label={content.reveal.words.map((w) => w.word).join(" ")}>
          <p className={`${styles.underKicker} caps`} data-reveal-meta>
            {content.reveal.kicker}
          </p>
          <p className={styles.underWords} aria-hidden="true">
            {content.reveal.words.map((w, i) => (
              <span key={w.word} className={styles.underItem}>
                <span className={styles.underWord} data-reveal-word>
                  {w.word}
                </span>
                {i < content.reveal.words.length ? (
                  <span className={styles.underPic} data-reveal-pic>
                    <Image src={w.image} alt="" fill sizes="(max-width: 767px) 30vw, 14vw" />
                  </span>
                ) : null}
              </span>
            ))}
          </p>
          <p className={styles.underCaption} data-reveal-meta>
            {content.reveal.caption}
          </p>
        </div>

        {/* Thread that leads into the next section once the cloth is gone */}
        <span className={styles.handoff} data-hero-handoff aria-hidden="true" />
      </div>
    </section>
  );
}
