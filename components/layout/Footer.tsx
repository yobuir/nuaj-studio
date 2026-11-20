"use client";

/**
 * FOOTER — big sewn "nuaj" mark, contact, social links, newsletter.
 * Background: a loom grid (warp + weft threads) that bends around the
 * cursor, over a faint wash of Stephanie's blue botanical artwork.
 *
 * Newsletter: the form has no service connected yet — it validates the
 * email and shows a thank-you. Connect Mailchimp/ConvertKit/Buttondown in
 * `onSubmit` below when ready (see README).
 *
 * Content: content/site.json → "brand", "footer", "nav".
 */
import { useEffect, useRef, useState } from "react";
import site from "@/content/site.json";
import { gsap } from "@/lib/animations/gsap";
import { prefersReducedMotion } from "@/lib/animations/motion";
import { LOGO_DOT, LOGO_PATH, LOGO_STROKE, LOGO_VIEWBOX } from "@/components/ui/Logo";
import type { LoomGrid } from "@/lib/canvas/LoomGrid";
import styles from "./Footer.module.css";

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
  const { brand, footer, nav } = site;

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = prefersReducedMotion();
    let grid: LoomGrid | null = null;
    let cancelled = false;
    import("@/lib/canvas/LoomGrid").then(({ LoomGrid }) => {
      if (cancelled || !canvasRef.current) return;
      grid = new LoomGrid(canvasRef.current, { still: reduced });
    });

    // the big mark is sewn as the footer comes into view
    const ctx = gsap.context(() => {
      const stroke = root.querySelector("[data-mark-stroke]");
      const dot = root.querySelector("[data-mark-dot]");
      if (reduced) {
        gsap.set(stroke, { strokeDashoffset: 0 });
        gsap.set(dot, { opacity: 1 });
        return;
      }
      gsap
        .timeline({ scrollTrigger: { trigger: root.querySelector("[data-mark]"), start: "top 95%", end: "bottom bottom", scrub: true } })
        .fromTo(stroke, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, ease: "none", duration: 1 })
        .fromTo(dot, { opacity: 0, y: -80 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.15 });
    }, root);

    return () => {
      cancelled = true;
      grid?.destroy();
      ctx.revert();
    };
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email")?.toString().trim() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    // TODO: send `email` to your newsletter service here.
    setStatus("done");
    e.currentTarget.reset();
  };

  return (
    <footer ref={rootRef} className={styles.footer} data-header="dark">
      <div className={styles.texture} style={{ backgroundImage: `url(${footer.texture})` }} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.loom} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.top}>
          <p className={styles.question}>{footer.question}</p>
          <p className={styles.headline}>{footer.headline}</p>
          <a href={site.commission.cta.href} className={styles.mail}>
            {brand.email}
          </a>
        </div>

        <div className={styles.cols}>
          <div id="newsletter" className={styles.newsletter}>
            <h2 className="caps">{footer.newsletter.title}</h2>
            <p>{footer.newsletter.text}</p>
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <label htmlFor="newsletter-email" className="visually-hidden">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={footer.newsletter.placeholder}
                aria-invalid={status === "error" || undefined}
                aria-describedby="newsletter-status"
                required
              />
              <button type="submit">
                {footer.newsletter.button} <span aria-hidden="true">→</span>
              </button>
            </form>
            <p id="newsletter-status" className={styles.status} role="status" aria-live="polite">
              {status === "done" ? footer.newsletter.success : status === "error" ? "Please enter a valid email address." : ""}
            </p>
          </div>

          <nav className={styles.col} aria-label="Footer">
            <h2 className="caps">Studio</h2>
            <ul>
              {nav.map((n) => (
                <li key={n.label}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
              <li>
                <a href="#journal">Journal</a>
              </li>
            </ul>
          </nav>

          <div className={styles.col}>
            <h2 className="caps">Follow</h2>
            <ul>
              {brand.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h2 className="caps">Based in</h2>
            <p>{brand.location}</p>
            <p className={styles.byline}>{brand.byline}</p>
          </div>
        </div>

        <svg className={styles.mark} viewBox={LOGO_VIEWBOX} data-mark role="img" aria-label={brand.name}>
          <path
            d={LOGO_PATH}
            pathLength={1000}
            data-mark-stroke
            fill="none"
            stroke="currentColor"
            strokeWidth={LOGO_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle {...LOGO_DOT} data-mark-dot fill="currentColor" />
        </svg>

        <div className={`${styles.bottom} caps`}>
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
