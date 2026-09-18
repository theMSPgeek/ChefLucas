import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { eventMoments } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Gallery storytelling from Chef Lucas Catering — barns, gardens, festivals.",
};

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Case moments"
        title="Evenings that still taste of the room."
        lede="A few days from the diary. Photography from the live Chef Lucas kitchens, shown here as a demo."
        image="/images/food-1.jpg"
      />
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-16">
          {eventMoments.map((moment, index) => (
            <Reveal key={moment.title}>
              <article
                className={`grid items-center gap-10 lg:grid-cols-2 ${
                  index % 2 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-ink">
                  <Image
                    src={moment.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div>
                  <p className="eyebrow">{moment.location}</p>
                  <h2 className="mt-3 font-display text-4xl">{moment.title}</h2>
                  <p className="mt-4 text-base leading-7 text-muted">{moment.story}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand title="Your evening, next in the book." />
    </>
  );
}
