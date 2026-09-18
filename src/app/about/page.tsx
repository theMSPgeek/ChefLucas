import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { chefs } from "@/lib/events";

export const metadata: Metadata = {
  title: "About",
  description: "The story of Chef Lucas Catering Services Ltd — Lucas Toborek and his kitchen.",
};

const steps = [
  "A conversation first — if it is not the right fit, we say so.",
  "We learn the room, the people, the music.",
  "Menus and service are written down.",
  "A 20% deposit invoice locks the date.",
  "Two weeks out: guest count, allergens, arrival.",
  "On the day, a chef introduces himself in person.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The story"
        title="Not another faceless catering company."
        lede="Imagine a stall of lemons and flowers, Greek music, and a chef who talks to your guests while he cooks."
        image="/images/dsc-chef.jpg"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Lucas Toborek</p>
          <h2 className="mt-3 font-display text-4xl">Fifteen years in hospitality, then a company.</h2>
          <p className="mt-5 text-base leading-8 text-muted">
            Chef Lucas Catering Services Ltd began as one chef’s wish to gather people around
            proper food. It is now a brigade — Sebatijan, Kieran, Rachel, Grek, Magda, Lucas —
            with more than thirty years of head and sous experience between them.
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            Greek gyros and smash burgers sit next to seven-course private dining. The
            through-line is flavour, humour, and a kitchen that still introduces itself at
            the door.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="relative aspect-[4/5] overflow-hidden bg-ink">
            <Image
              src="/images/img-3304.jpg"
              alt="Chef Lucas at a Fiesta Mexicana stall"
              fill
              className="object-cover"
              sizes="40vw"
            />
          </div>
        </Reveal>
      </section>
      <section className="bg-parchment/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="eyebrow">The brigade</p>
            <h2 className="mt-3 font-display text-4xl">Chefs with personality.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chefs.map((chef) => (
              <Reveal key={chef.name}>
                <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                  <Image src={chef.image} alt={chef.name} fill className="object-cover" sizes="30vw" />
                </div>
                <h3 className="mt-4 font-display text-2xl">{chef.name}</h3>
                <p className="text-xs tracking-[0.16em] uppercase text-muted">{chef.role}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <p className="eyebrow">Six steps, no stress</p>
          <h2 className="mt-3 font-display text-4xl">How a booking actually happens.</h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="border border-line p-6">
                <p className="font-display text-3xl text-gold-deep">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{step}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
      <CtaBand title="Start with that conversation." />
    </>
  );
}
