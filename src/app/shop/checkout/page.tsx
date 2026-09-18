import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Demo sauce-shop checkout. Nothing is charged.",
};

export default function CheckoutPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo checkout"
        title="A bag, not a bill."
        lede="Leave your details with the bag. This is a demo checkout — nothing is charged, and a chef still confirms before anything is sent."
        image="/images/hero-banner.png"
      />
      <section className="mx-auto max-w-5xl px-5 py-20">
        <CheckoutForm />
      </section>
    </>
  );
}
