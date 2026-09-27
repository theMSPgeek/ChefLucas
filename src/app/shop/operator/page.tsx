import type { Metadata } from "next";
import { OperatorSignIn } from "@/components/OperatorSignIn";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Operator",
  description: "FKIT operator sign-in for the Chef Lucas demo shop.",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  return (
    <>
      <PageHero
        eyebrow="FKIT"
        title="Shop operator."
        lede="Sign in to allow this browser to update demo stock. Visitors are never charged, and a public checkout is not a live order."
        image="/images/shop-trio.png"
      />
      <section className="mx-auto max-w-5xl px-5 py-20">
        <OperatorSignIn />
      </section>
    </>
  );
}
