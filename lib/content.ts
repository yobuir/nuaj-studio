/**
 * Content helpers.
 *
 * Placeholders: any item with "placeholder": true is shown only while
 * "showPlaceholders" is true in content/site.json. Set it to false before
 * launch, and sections with no real items left hide themselves.
 */
import site from "@/content/site.json";

export function visible<T extends { placeholder?: boolean }>(items: T[]): T[] {
  return site.showPlaceholders ? items : items.filter((i) => !i.placeholder);
}

/** "2026-11-01" → "Nov 2026" */
export function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
