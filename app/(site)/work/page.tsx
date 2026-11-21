/** /work — every project. Content: content/works.json */
import type { Metadata } from "next";
import works from "@/content/works.json";
import { getProjects } from "@/lib/cms";
import PageHero from "@/components/pages/PageHero";
import WorkIndex from "@/components/pages/WorkIndex";

export const metadata: Metadata = {
  title: works.page.seo.title,
  description: works.page.seo.description,
  alternates: { canonical: "/work" },
  openGraph: { url: "/work", title: `${works.page.seo.title} — Nuaj Studio`, description: works.page.seo.description },
};

export default async function WorkPage() {
  const items = await getProjects();
  return (
    <>
      <PageHero index="(Work)" label={works.page.label} question={works.page.question} title={works.page.title} intro={works.page.intro} />
      <WorkIndex items={items} content={works} />
    </>
  );
}
