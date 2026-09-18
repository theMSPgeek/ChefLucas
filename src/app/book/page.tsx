import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/BookingWizard";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Book",
  description:
    "Multi-step catering enquiry for weddings, corporate, buffets, private dining and tastings.",
};

export default function BookPage() {
  const embed = process.env.NEXT_PUBLIC_GHL_CALENDAR_EMBED_URL;

  return (
    <>
      <PageHero
        eyebrow="The diary"
        title="Tell us the shape of the day."
        lede="A conversation still comes first. Tell us the occasion, the date, and who to write to — then a chef calls before anything is locked."
        image="/images/dsc-kitchen.jpg"
      />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <Reveal>
          <Suspense fallback={<p className="text-sm text-muted">Loading the enquiry…</p>}>
            <BookingWizard />
          </Suspense>
        </Reveal>
        {embed ? (
          <div className="mt-16">
            <h2 className="font-display text-3xl">Hold a tasting slot</h2>
            <p className="mt-2 text-sm text-muted">
              Choose a time for a tasting. A chef still confirms the hold before the
              day is locked.
            </p>
            <iframe
              title="Chef Lucas tasting calendar"
              src={embed}
              className="mt-6 h-[720px] w-full border border-line"
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
