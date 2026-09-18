import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan an event with Chef Lucas Catering in Burton-on-Trent.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="The pass"
        title="Write, call, or send the kitchen a note."
        lede="Have a question or ready to book? Send a note and we will come back to you. Until bookings go live, you will see a demo confirmation."
        image="/images/dsc-event.jpg"
      />
      <section className="mx-auto grid max-w-6xl gap-16 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Studio</p>
          <h2 className="mt-3 font-display text-4xl">Burton-on-Trent</h2>
          <address className="mt-6 not-italic text-sm leading-7 text-muted">
            {site.address}
            <br />
            <a className="hover:text-gold-deep" href={site.phoneHref}>
              {site.phone}
            </a>
            <br />
            <a className="hover:text-gold-deep" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </address>
          <div className="mt-8 flex flex-col gap-3 text-[12px] tracking-[0.16em] uppercase">
            <a
              href={site.instagram}
              rel="noreferrer"
              target="_blank"
              aria-label="Instagram @cheflucastoborek"
            >
              Instagram
            </a>
            <a
              href={site.linkedin}
              rel="noreferrer"
              target="_blank"
              aria-label="LinkedIn CLSC Ltd"
            >
              LinkedIn
            </a>
            <a href={site.trustpilot} rel="noreferrer" target="_blank">
              Independent reviews
            </a>
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
