import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ShopGrid } from "@/components/ShopGrid";

export const metadata: Metadata = {
  title: "Sauce club",
  description: "Demo shop of Chef Lucas house sauces and merch. No live charges.",
};

export default function ShopPage() {
  return (
    <>
      <PageHero
        eyebrow="Between events"
        title="The sauce club."
        lede="Bottled house sauces and a little merch from the street-food tents. Demo only. Nothing is charged."
        image="/images/shop-trio.png"
      />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <ShopGrid />
      </section>
    </>
  );
}
