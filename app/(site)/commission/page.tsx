/** /commission — how a commission works + the enquiry form. Content: content/commission.json */
import type { Metadata } from "next";
import Image from "next/image";
import c from "@/content/commission.json";
import site from "@/content/site.json";
import { SITE_URL } from "@/lib/seo";
import PageHero from "@/components/pages/PageHero";
import Reveal from "@/components/ui/Reveal";
import Note from "@/components/ui/Note";
import SectionHead from "@/components/ui/SectionHead";
import CommissionForm from "@/components/pages/CommissionForm";
import styles from "./commission.module.css";

export const metadata: Metadata = {
  title: c.seo.title,
  description: c.seo.description,
  alternates: { canonical: "/commission" },
  openGraph: { url: "/commission", title: `${c.seo.title} — ${site.brand.name}`, description: c.seo.description },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}/#commissions`,
  name: "Custom textile art commissions",
  serviceType: "Commissioned textile art",
  provider: { "@id": `${SITE_URL}/#studio` },
  areaServed: site.brand.location,
  description: c.seo.description,
};

export default function CommissionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero index="(Commissions)" label={c.label} question={c.question} title={c.title} intro={c.intro}>
        <Reveal variant="unroll" className={styles.heroImg}>
          <Image src={c.image} alt={c.imageAlt} fill priority sizes="(max-width: 960px) 100vw, 40vw" />
        </Reveal>
      </PageHero>

      <section className={styles.how} data-header="dark" aria-label="How it works">
        <SectionHead index="(01)" label="How it works" question="Three steps, made by hand." questionAs="h2" />
        <Reveal as="ul" stagger className={styles.steps}>
          {c.steps.map((s, i) => (
            <li key={s.title}>
              <span className={styles.num} aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </Reveal>
      </section>

      <section id="form" className={`${styles.formSection} graph`} data-header="light" aria-label={c.form.title}>
        <div className={styles.formSide}>
          <SectionHead index="(02)" label={c.kicker} question="Tell me about your space and your story." />
          <Note arrow="down-right" rotate={-5} className={styles.note}>
            {c.note}
          </Note>
        </div>
        <div className={styles.formWrap}>
          <CommissionForm copy={c.form} email={site.brand.email} />
        </div>
      </section>
    </>
  );
}
