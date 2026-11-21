"use client";

/**
 * /work — all projects with a category filter.
 * The grid is the same component as the homepage's Selected work, so
 * reveals, hover ripple and the "View" cursor all match.
 */
import { useMemo, useState } from "react";
import Works, { type Work } from "@/components/sections/Works";
import styles from "./WorkIndex.module.css";

type Props = {
  items: Work[];
  content: { index: string; label: string; question?: string; title: string[] };
};

export default function WorkIndex({ items, content }: Props) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const [active, setActive] = useState("All");
  const shown = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter work by category">
        {categories.map((c) => {
          const count = c === "All" ? items.length : items.filter((i) => i.category === c).length;
          return (
            <button key={c} type="button" className={styles.filter} aria-pressed={active === c} onClick={() => setActive(c)}>
              {c}
              <sup>{String(count).padStart(2, "0")}</sup>
            </button>
          );
        })}
      </div>
      {/* key → the grid remounts so the unroll reveal plays for the new set */}
      <Works key={active} content={content} items={shown} showHead={false} />
    </>
  );
}
