import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { serviceBookType, services, streetFood } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Wedding, corporate, buffet and private dining kitchens, plus tasting menus and a sauce club.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="The work"
        title="Catering with a point of view."
        lede="Not a faceless kitchen. Chefs with humour, a stall that becomes the party, and a tasting menu when the occasion asks for quiet."
        image="/images/dsc-kitchen.jpg"
      />
      <section className="mx-auto max-w-6xl space-y-24 px-5 py-24">
        {services.map((service, index) => (
          <Reveal key={service.slug}>
            <article
              id={service.slug}
              className={`grid items-center gap-10 lg:grid-cols-2 ${
                index % 2 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                <Image
                  src={service.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
              <div>
                <p className="eyebrow">{service.kicker}</p>
                <h2 className="mt-3 font-display text-4xl">{service.title}</h2>
                <p className="mt-4 text-base leading-7 text-muted">{service.blurb}</p>
                <p className="mt-4 text-sm leading-7 text-muted">{service.details}</p>
                <Link
                  href={
                    service.href || `/book?type=${serviceBookType[service.slug] || "custom"}`
                  }
                  className="mt-6 inline-block text-[12px] tracking-[0.16em] uppercase text-gold-deep"
                >
                  Enquire
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
      <section className="bg-parchment/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Stations</p>
          <h2 className="mt-3 font-display text-4xl">Street feasts & wildcards</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {streetFood.map((item) => (
              <Reveal key={item.title}>
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="40vw" />
                </div>
                <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
