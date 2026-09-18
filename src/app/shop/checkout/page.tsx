import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Demo sauce-shop checkout. Stripe is stubbed; no live charges.",
};

export default function CheckoutPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo checkout"
        title="A bag, not a bill."
        lede="We collect the same CRM fields as a catering enquiry so a shop lead can sit in the same pipeline, tagged product/sauce-club."
        image="/images/hero-banner.png"
      />
      <section className="mx-auto max-w-5xl px-5 py-20">
        <CheckoutForm />
      </section>
    </>
  );
}
