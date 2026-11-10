import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ShopGrid } from "@/components/ShopGrid";
import { getShopCatalogue } from "@/lib/ghl-products";
import { inventoryWritesEnabled } from "@/lib/shop-auth";

export const metadata: Metadata = {
  title: "Sauce club",
  description: "Demo shop of Chef Lucas house sauces and merch. No live charges.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const catalogue = await getShopCatalogue();
  const writesEnabled = inventoryWritesEnabled();

  return (
    <>
      <PageHero
        eyebrow="Between events"
        title="The sauce club."
        lede={
          writesEnabled
            ? "Bottled house sauces and a little merch from the street-food tents. Nothing is charged. A public checkout is not a live order — stock changes only for a signed-in operator."
            : "Bottled house sauces and a little merch from the street-food tents. Demo only — nothing is charged and checkout is not a live order. Stock is read and left unchanged."
        }
        image="/images/shop-trio.png"
      />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <ShopGrid catalogue={catalogue} />
      </section>
    </>
  );
}
