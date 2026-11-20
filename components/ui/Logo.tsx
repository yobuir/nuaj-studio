/**
 * Logo — the hand-drawn "nuaj" mark, redrawn as ONE continuous stroke
 * (plus the dot of the j) so it can be "sewn" with a stroke animation.
 *
 * It uses `currentColor`, so set the colour with CSS `color:`.
 * If the brand ever supplies an official SVG, replace LOGO_PATH below
 * (keep it a single open path if you want the thread animation to work).
 */
import type { SVGProps } from "react";

export const LOGO_VIEWBOX = "0 0 800 763";
export const LOGO_STROKE = 56;
export const LOGO_PATH =
  "M22 410 C18 330 20 250 50 190 C75 145 110 125 135 128 C175 132 192 175 200 230 C210 300 215 360 248 382 C285 405 318 365 330 300 C345 225 375 160 410 125 C445 95 490 95 515 140 C535 175 535 205 500 230 C455 255 410 270 395 320 C385 365 420 400 465 398 C520 395 560 340 568 260 C572 225 590 205 620 195 C665 180 700 155 735 150 C775 150 780 220 784 300 C790 420 790 520 772 610 C758 670 712 700 732 740";
export const LOGO_DOT = { cx: 726, cy: 28, r: 26 };

type LogoProps = SVGProps<SVGSVGElement> & {
  /** Accessible name. Pass "" when the logo is decorative. */
  title?: string;
};

export default function Logo({ title = "Nuaj Studio", ...props }: LogoProps) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d={LOGO_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={LOGO_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-logo-stroke
      />
      <circle {...LOGO_DOT} fill="currentColor" data-logo-dot />
    </svg>
  );
}
