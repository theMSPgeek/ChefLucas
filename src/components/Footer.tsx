import Image from "next/image";
import Link from "next/link";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Image
            src="/images/logo.png"
            alt={site.name}
            width={160}
            height={96}
            className="h-14 w-auto"
          />
          <p className="mt-6 max-w-sm text-sm leading-7 text-parchment/80">
            {site.tagline} Polish and European kitchens, nationwide from Burton-on-Trent.
          </p>
        </div>
        <div>
          <p className="eyebrow">Visit</p>
          <ul className="mt-4 space-y-2 text-sm text-parchment/80">
            {nav.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-gold" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="hover:text-gold" href="/book">
                Book
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Studio</p>
          <address className="mt-4 not-italic text-sm leading-7 text-parchment/80">
            {site.address}
            <br />
            <a className="hover:text-gold" href={site.phoneHref}>
              {site.phone}
            </a>
            <br />
            <a className="hover:text-gold" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-[12px] tracking-[0.08em] text-parchment/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Demo site — not live bookings. Imagery attributed as a demo from cheflucas.co.uk.</p>
          <p>
            Powered by{" "}
            <a
              className="text-gold underline-offset-4 hover:underline"
              href={site.fkit}
              rel="noreferrer"
              target="_blank"
            >
              FKIT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
