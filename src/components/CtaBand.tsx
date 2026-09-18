import Link from "next/link";
import { Reveal } from "./Reveal";

export function CtaBand({
  title = "Shall we cook for you?",
  body = "Tell us the shape of the day. A chef still replies in person — dated, named, and waiting for a human conversation.",
  href = "/book",
  label = "Begin an enquiry",
}: {
  title?: string;
  body?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="bg-ink text-cream">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow text-gold">Invitation</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-parchment/80">{body}</p>
        </div>
          <Link
            href={href}
            className="btn btn-ghost"
          >
            {label}
          </Link>
      </Reveal>
    </section>
  );
}
