import Image from "next/image";
import { Reveal } from "./Reveal";

export function PageHero({
  eyebrow,
  title,
  lede,
  image,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  image: string;
}) {
  return (
    <section className="relative isolate min-h-[58vh] overflow-hidden bg-ink text-cream">
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover opacity-55"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
      <div className="relative mx-auto flex min-h-[58vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28">
        <Reveal immediate duration={0.65}>
          <p className="eyebrow text-gold">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-parchment/85">
            {lede}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
