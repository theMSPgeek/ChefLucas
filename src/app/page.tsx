import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-ink text-cream">
        <Image
          src="/images/dsc-pour.jpg"
          alt="Slow-cooked lamb shank with tenderstem broccoli"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-20 pt-32">
          <p className="eyebrow text-gold">Burton-on-Trent · Nationwide</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
            Fine dining, brought to your table.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-parchment/85">
            Chef Lucas Catering — Polish and European kitchens for weddings, boardrooms,
            buffets and private rooms. Restaurant care. Festival heart.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/book"
              className="btn btn-solid"
            >
              Begin an enquiry
            </Link>
            <Link
              href="/menus"
              className="btn btn-ghost"
            >
              Seasonal menus
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-4">
          {[
            { k: "Trustpilot", v: "Independent reviews", href: site.trustpilot },
            { k: "30+ years", v: "Combined chef experience" },
            { k: "20–2,000", v: "Guests, same standard" },
            { k: "Nationwide", v: "From Burton-on-Trent" },
          ].map((item) => (
            <div key={item.k}>
              {item.href ? (
                <a
                  href={item.href}
                  className="font-display text-2xl hover:text-gold-deep"
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.k}
                </a>
              ) : (
                <p className="font-display text-2xl">{item.k}</p>
              )}
              <p className="mt-1 text-xs tracking-[0.14em] uppercase text-muted">
                {item.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <p className="eyebrow">The kitchen</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">
            Pillars for the diary, and a couple of wildcards.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.06}>
              <Link href={service.href || "/services"} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(min-width: 768px) 30vw, 100vw"
                  />
                </div>
                <p className="mt-4 eyebrow">{service.kicker}</p>
                <h3 className="mt-2 font-display text-3xl">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{service.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/dsc-table.jpg"
                alt="Buttermilk panna cotta with strawberry"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow text-gold">In season</p>
            <h2 className="mt-4 font-display text-5xl">
              Buttermilk panna cotta, wood sorrel, late strawberry.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-parchment/80">
              The tasting kitchen changes with the market. This plate is the autumn
              pudding on the British fine-dining menu — light enough for a wedding,
              considered enough for a chef-at-home evening.
            </p>
            <Link
              href="/menus"
              className="mt-8 inline-block text-[12px] tracking-[0.18em] uppercase text-gold"
            >
              Read the menus
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
