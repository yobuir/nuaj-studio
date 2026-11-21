/** /contact — general enquiries + studio details. Content: content/contact.json + site.json → brand */
import type { Metadata } from "next";
import contact from "@/content/contact.json";
import site from "@/content/site.json";
import { SITE_URL } from "@/lib/seo";
import PageHero from "@/components/pages/PageHero";
import ContactForm from "@/components/pages/ContactForm";
import SmartLink from "@/components/ui/SmartLink";
import Note from "@/components/ui/Note";
import Reveal from "@/components/ui/Reveal";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: contact.seo.title,
  description: contact.seo.description,
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: `${contact.seo.title} — ${site.brand.name}`, description: contact.seo.description },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact`,
  name: contact.seo.title,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#studio` },
  mainEntity: {
    "@id": `${SITE_URL}/#studio`,
    "@type": "Organization",
    name: site.brand.name,
    email: site.brand.email,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.brand.email, availableLanguage: "English" },
  },
};

export default function ContactPage() {
  const { brand } = site;
  const socials = brand.social;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero index="(Contact)" label={contact.label} question={contact.question} title={contact.title} intro={contact.intro}>
        <div className={styles.commission}>
          <p>{contact.commission.text}</p>
          <SmartLink href={contact.commission.link.href} className={styles.commissionLink}>
            {contact.commission.link.label} <span aria-hidden="true">→</span>
          </SmartLink>
        </div>
      </PageHero>

      <section className={`${styles.body} graph`} data-header="light" aria-label="Contact details and form">
        <Reveal as="div" stagger className={styles.details}>
          <div className={styles.detail}>
            <p className="caps">{contact.details.emailLabel}</p>
            <a href={`mailto:${brand.email}`} className={styles.big}>
              {brand.email}
            </a>
            <p className={styles.small}>{contact.details.reply}</p>
          </div>
          <div className={styles.detail}>
            <p className="caps">{contact.details.socialLabel}</p>
            <ul>
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.detail}>
            <p className="caps">{contact.details.locationLabel}</p>
            <p>{brand.location}</p>
            <p className={styles.small}>{brand.byline}</p>
          </div>
          <Note arrow="down-right" rotate={-4} className={styles.note}>
            {contact.note}
          </Note>
        </Reveal>

        <div className={styles.formWrap}>
          <ContactForm copy={contact.form} email={brand.email} />
        </div>
      </section>
    </>
  );
}
