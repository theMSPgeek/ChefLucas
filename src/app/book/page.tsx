import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/BookingWizard";
import { PageHero } from "@/components/PageHero";

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
        lede="A conversation still comes first. This wizard captures the fields HighLevel needs — named opportunities, event calendars, tags — so nothing lands as a generic lead."
        image="/images/dsc-kitchen.jpg"
      />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <Suspense fallback={<p className="text-sm text-muted">Loading the enquiry…</p>}>
          <BookingWizard />
        </Suspense>
        {embed ? (
          <div className="mt-16">
            <h2 className="font-display text-3xl">Hold a tasting slot</h2>
            <p className="mt-2 text-sm text-muted">
              Live HighLevel calendar embed. Separate diaries for weddings, corporate,
              buffets and tastings once those calendar IDs are set.
            </p>
            <iframe
              title="Chef Lucas tasting calendar"
              src={embed}
              className="mt-6 h-[720px] w-full border border-line"
            />
          </div>
        ) : (
          <p className="mt-10 text-center text-xs tracking-[0.16em] uppercase text-muted">
            Calendar embed appears here when NEXT_PUBLIC_GHL_CALENDAR_EMBED_URL is set.
          </p>
        )}
      </section>
    </>
  );
}
