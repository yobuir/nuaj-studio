/** /wearables — garments from Nuaj textiles. Content: content/wearables.json */
import type { Metadata } from "next";
import Image from "next/image";
import w from "@/content/wearables.json";
import site from "@/content/site.json";
import PageHero from "@/components/pages/PageHero";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import styles from "./wearables.module.css";

export const metadata: Metadata = {
  title: w.seo.title,
  description: w.seo.description,
  alternates: { canonical: "/wearables" },
  openGraph: { url: "/wearables", title: `${w.seo.title} — ${site.brand.name}`, description: w.seo.description, images: [{ url: w.image, alt: w.imageAlt }] },
};

export default function WearablesPage() {
  return (
    <>
      <PageHero index="(Wearables)" label={w.label} question={w.question} title={w.title} intro={w.intro}>
        <Reveal variant="unroll" className={styles.heroImg}>
          <Image src={w.image} alt={w.imageAlt} fill priority sizes="(max-width: 960px) 100vw, 40vw" />
        </Reveal>
      </PageHero>

      <section className={styles.story} data-header="light" aria-label="The story">
        <Reveal as="figure" className={styles.quote}>
          <blockquote>
            <p>“{w.quote}”</p>
          </blockquote>
          <figcaption className="caps">— {site.brand.artist}</figcaption>
        </Reveal>
        <Reveal stagger className={styles.text}>
          {w.story.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
      </section>

      <section className={`${styles.details} graph`} data-header="light" aria-label="Materials">
        <ul className={styles.detailList}>
          {w.details.map((d, i) => (
            <li key={d.image} style={{ "--tilt": `${[-4, 3, -2][i % 3]}deg` } as React.CSSProperties}>
              <Reveal variant="unroll" className={styles.detailImg}>
                <Image src={d.image} alt={d.alt} fill sizes="(max-width: 960px) 80vw, 28vw" />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.notify} data-header="dark" aria-label={w.notify.title}>
        <h2>{w.notify.title}</h2>
        <p>{w.notify.text}</p>
        <Button href={w.notify.href} variant="light" size="lg">
          {w.notify.button}
        </Button>
      </section>
    </>
  );
}
