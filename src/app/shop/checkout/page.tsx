import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageHero } from "@/components/PageHero";
import { inventoryWritesEnabled } from "@/lib/shop-auth";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Demo sauce-shop checkout. Nothing is charged and this is not a live order.",
};

export default function CheckoutPage() {
  const writesEnabled = inventoryWritesEnabled();
  return (
    <>
      <PageHero
        eyebrow="Demo checkout"
        title="A bag, not a bill."
        lede={
          writesEnabled
            ? "Leave your details with the bag. Nothing is charged. This is not a live order unless you are signed in as an operator."
            : "Leave your details with the bag. Demo only — nothing is charged and this is not a live order. Stock is checked and left unchanged."
        }
        image="/images/hero-banner.png"
      />
      <section className="mx-auto max-w-5xl px-5 py-20">
        <CheckoutForm writesEnabled={writesEnabled} />
      </section>
    </>
  );
}
