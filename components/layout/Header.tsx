"use client";

/**
 * Header — logo, navigation and the commission button.
 *
 * Colour switching: any section can say what's behind the header with
 *   data-header="dark"  (dark background → light header text)
 *   data-header="light" (light background → dark header text)
 * The header checks which section sits under it while you scroll.
 */
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { getLenis } from "@/components/providers/SmoothScroll";
import styles from "./Header.module.css";

type NavItem = { label: string; href: string; note?: string };
type Props = {
  nav: NavItem[];
  cta: { label: string; href: string };
  tagline: string;
};

export default function Header({ nav, cta, tagline }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

  // Work out which section is behind the header
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = (ref.current?.offsetHeight ?? 60) / 2;
      const stack = document.elementsFromPoint(window.innerWidth / 2, y);
      for (const el of stack) {
        if (ref.current?.contains(el)) continue;
        const host = el.closest<HTMLElement>("[data-header]");
        if (host) {
          setTone(host.dataset.header === "dark" ? "dark" : "light");
          return;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Sections can also ask for a re-check when they change data-header themselves
    window.addEventListener("nuaj:header-check", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("nuaj:header-check", onScroll);
    };
  }, []);

  // Mobile menu: lock scroll + close on Escape
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header ref={ref} className={styles.header} data-tone={open ? "dark" : tone} data-open={open || undefined}>
      <a href="#top" className={styles.logo} aria-label="Nuaj Studio — back to top" data-header-logo>
        <Logo title="" />
      </a>

      <p className={`${styles.tagline} caps`}>{tagline}</p>

      <nav className={styles.nav} aria-label="Main">
        <ul>
          {nav.map((item) => (
            <li key={item.href + item.label}>
              <a href={item.href} className={styles.link}>
                <span className={styles.linkText} data-text={item.label}>
                  {item.label}
                </span>
                {item.note ? <sup className={styles.note}>{item.note}</sup> : null}
              </a>
            </li>
          ))}
        </ul>
        <Button href={cta.href} variant={tone === "dark" ? "light" : "solid"} strength={0.3}>
          {cta.label}
        </Button>
      </nav>

      <button
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="caps">{open ? "Close" : "Menu"}</span>
        <span className={styles.menuThreads} aria-hidden="true" />
      </button>

      <div id="mobile-menu" className={styles.mobileMenu} hidden={!open}>
        <ul>
          {nav.map((item, i) => (
            <li key={item.href + item.label} style={{ "--i": i } as React.CSSProperties}>
              <a href={item.href} onClick={() => setOpen(false)}>
                {item.label}
                {item.note ? <sup>{item.note}</sup> : null}
              </a>
            </li>
          ))}
        </ul>
        <Button href={cta.href} variant="light" size="lg" strength={0} onClick={() => setOpen(false)}>
          {cta.label}
        </Button>
      </div>
    </header>
  );
}
