"use client";

/**
 * SmartLink — internal links that behave well across pages.
 *  - "/#work" while already on the homepage → smooth-scrolls (Lenis)
 *  - "/about", "/#work" from another page → client-side navigation (next/link)
 *  - "mailto:", "https://…" → a normal link
 */
import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLenis } from "@/components/providers/SmoothScroll";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const SmartLink = forwardRef<HTMLAnchorElement, Props>(function SmartLink({ href, onClick, children, ...rest }, ref) {
  const pathname = usePathname();

  if (!href.startsWith("/") && !href.startsWith("#")) {
    return (
      <a ref={ref} href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  const path = href.startsWith("#") ? pathname : href.split("#")[0] || "/";

  const handle = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    // Same page, no hash (e.g. the logo on the homepage) → glide to the top
    if (!hash && path === pathname) {
      e.preventDefault();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (hash && path === pathname) {
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target as HTMLElement);
      else target.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", hash);
    }
  };

  return (
    <Link ref={ref} href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
});

export default SmartLink;
