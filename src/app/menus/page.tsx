import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { menus } from "@/lib/menus";

export const metadata: Metadata = {
  title: "Menus",
  description: "Seasonal and event menus structured for a later CMS or HighLevel document.",
};

export default function MenusPage() {
  return (
    <>
      <PageHero
        eyebrow="On paper"
        title="Menus that can move into a client portal."
        lede="Static for now, shaped for HighLevel documents later — tasting notes, guest counts, and dietary variants sitting beside the contract."
        image="/images/plates.jpg"
      />
      <section className="mx-auto max-w-6xl space-y-20 px-5 py-24">
        {menus.map((menu) => (
          <Reveal key={menu.id}>
            <article className="grid gap-10 border-b border-line pb-20 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="eyebrow">{menu.season}</p>
                <h2 className="mt-3 font-display text-4xl">{menu.title}</h2>
                <p className="mt-3 text-sm text-muted">{menu.serves}</p>
                <div className="relative mt-8 aspect-[4/5] overflow-hidden bg-ink">
                  <Image src={menu.image} alt="" fill className="object-cover" sizes="40vw" />
                </div>
              </div>
              <div>
                {menu.courses.map((course) => (
                  <div key={course.name} className="border-b border-line py-6">
                    <h3 className="text-[12px] tracking-[0.18em] uppercase text-gold-deep">
                      {course.name}
                    </h3>
                    <ul className="mt-3 space-y-2 font-display text-2xl">
                      {course.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="mt-6 text-sm leading-7 text-muted">{menu.note}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
      <CtaBand title="Want this written for your day?" />
    </>
  );
}
