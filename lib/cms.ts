/**
 * CMS loader — reads projects and journal posts edited in Keystatic.
 * Server-only (it reads files). Page texts are still plain JSON imports
 * from /content, which Keystatic edits in place.
 *
 *   const projects = await getProjects();     // sorted by "order", drafts filtered
 *   const post = await getPost("my-slug");     // includes the Markdoc body
 */
import "server-only";
import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import config from "@/keystatic.config";
import site from "@/content/site.json";

const reader = createReader(process.cwd(), config);
const showPlaceholders = () => site.showPlaceholders;

export type Project = Awaited<ReturnType<typeof reader.collections.projects.readOrThrow>> & { slug: string };
export type PostMeta = Omit<Awaited<ReturnType<typeof reader.collections.journal.readOrThrow>>, "body"> & { slug: string };

/** All projects, ordered. Placeholders only while "Show placeholders" is on. */
export const getProjects = cache(async (opts: { includePlaceholders?: boolean } = {}) => {
  const all = await reader.collections.projects.all();
  const include = opts.includePlaceholders ?? showPlaceholders();
  return all
    .map(({ slug, entry }) => ({ ...entry, slug }))
    .filter((p) => include || !p.placeholder)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title)) as Project[];
});

/** Journal posts (without bodies), newest first. */
export const getPosts = cache(async (opts: { includePlaceholders?: boolean } = {}) => {
  const all = await reader.collections.journal.all();
  const include = opts.includePlaceholders ?? showPlaceholders();
  return all
    .map(({ slug, entry }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body, ...meta } = entry;
      return { ...meta, slug };
    })
    .filter((p) => include || !p.placeholder)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")) as PostMeta[];
});

/** One post with its body rendered to a Markdoc tree (render with <MarkdocBody>). */
export const getPost = cache(async (slug: string) => {
  const entry = await reader.collections.journal.read(slug);
  if (!entry) return null;
  const { node } = await entry.body();
  const errors = Markdoc.validate(node);
  if (errors.length) console.warn("[journal] markdoc issues in", slug, errors);
  const content: RenderableTreeNode = Markdoc.transform(node);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...meta } = entry;
  return { ...meta, slug, content };
});
