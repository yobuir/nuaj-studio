/**
 * /work/[slug] — one page per project (content/projects/*.json, edited in
 * Keystatic → Projects). Add a project and its page is generated automatically:
 * cover → facts → chapters (Gather, Cut, Compose, Stitch… or your own)
 * → gallery → next project.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import site from "@/content/site.json";
import { getProjects } from "@/lib/cms";
import { SITE_URL, abs } from "@/lib/seo";
import RevealText from "@/components/ui/RevealText";
import Reveal from "@/components/ui/Reveal";
import SmartLink from "@/components/ui/SmartLink";
import Button from "@/components/ui/Button";
import styles from "./project.module.css";

const projects = () => getProjects();

export async function generateStaticParams() {
  return (await projects()).map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await projects()).find((x) => x.slug === slug);
  if (!p) return {};
  const title = `${p.title}, ${p.year}`;
  return {
    title,
    description: p.intro,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: {
      type: "article",
      url: `/work/${p.slug}`,
      title: `${title} — ${site.brand.name}`,
      description: p.intro,
      images: [{ url: p.image ?? "", alt: p.alt }],
    },
    ...(p.placeholder ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await projects();
  const i = list.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = list[i];
  const next = list[(i + 1) % list.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: p.title,
    url: abs(`/work/${p.slug}`),
    image: [p.image, ...p.gallery.map((g) => g.image)].filter((x): x is string => !!x).map(abs),
    description: p.intro,
    dateCreated: p.year,
    artform: p.kind,
    artMedium: p.materials,
    creator: { "@id": `${SITE_URL}/#artist`, "@type": "Person", name: site.brand.artist },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Cover */}
      <section id="top" className={styles.cover} data-header="dark" aria-label={p.title}>
        <div className={styles.coverMedia}>
          {p.image ? <Image src={p.image} alt={p.alt} fill priority sizes="100vw" className={styles.coverImg} /> : null}
        </div>
        <div className={styles.coverText}>
          <p className="caps">
            <SmartLink href="/work" className={styles.back}>
              ← All work
            </SmartLink>
            <span className={styles.sep}>/</span> {p.category} · {p.year}
            {p.placeholder ? <span className={styles.ph}>Placeholder</span> : null}
          </p>
          <RevealText as="h1" lines={[p.title]} play="intro" className={styles.title} />
        </div>
      </section>

      {/* Facts + intro */}
      <section className={styles.facts} data-header="light" aria-label="About this piece">
        <dl className={styles.factList}>
          {p.facts.map((f) => (
            <div key={f.label}>
              <dt className="caps">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <Reveal className={styles.intro}>
          <p>{p.intro}</p>
        </Reveal>
      </section>

      {/* Chapters */}
      {p.chapters.map((c, n) => (
        <section key={c.title} className={`${styles.chapter} ${n % 2 ? `${styles.alt} graph` : ""}`} data-header="light" aria-label={c.title}>
          <div className={styles.chapterText}>
            <span className={styles.numeral} aria-hidden="true">
              0{n + 1}
            </span>
            <h2 className={styles.chapterTitle}>{c.title}</h2>
            <p>{c.text}</p>
          </div>
          <div className={styles.chapterImages} data-count={c.images.length}>
            {c.images.filter((img) => img.image).map((img) => (
              <Reveal key={img.image} variant="unroll" className={styles.chapterImg}>
                <div data-skew className={styles.fill}>
                  <Image src={img.image!} alt={img.alt} fill sizes="(max-width: 960px) 90vw, 40vw" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      {/* Gallery */}
      {p.gallery.length ? (
        <section className={styles.gallery} data-header="dark" aria-label="Gallery">
          <h2 className={`${styles.galleryTitle} caps`}>The finished piece</h2>
          <div className={styles.galleryGrid}>
            {p.gallery.filter((g) => g.image).map((g) => (
              <Reveal key={g.image} variant="unroll" className={styles.galleryItem}>
                <Image src={g.image!} alt={g.alt} fill sizes="(max-width: 960px) 100vw, 50vw" />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Next + commission */}
      <section className={styles.next} data-header="light" aria-label="Next project">
        <div className={styles.nextCta}>
          <p className={styles.nextQ}>Have a space that needs a story like this?</p>
          <Button href="/commission">Start a commission</Button>
        </div>
        {next && next.slug !== p.slug ? (
          <SmartLink href={`/work/${next.slug}`} className={styles.nextLink} data-cursor="view" data-cursor-label="Next">
            <span className="caps">Next project →</span>
            <span className={styles.nextTitle}>{next.title}</span>
            <span className={styles.nextImg}>
              {next.image ? <Image src={next.image} alt="" fill sizes="30vw" /> : null}
            </span>
          </SmartLink>
        ) : null}
      </section>
    </>
  );
}
