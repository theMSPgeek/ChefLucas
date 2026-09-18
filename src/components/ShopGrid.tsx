"use client";

import Image from "next/image";
import { useLayoutEffect } from "react";
import {
  formatGbp,
  stockBadgeLabel,
  stockStatus,
  type Product,
  type ShopCatalogue,
} from "@/lib/products";
import { useCart } from "./CartProvider";
import { Reveal } from "./Reveal";

function ProductPhoto({ product }: { product: Product }) {
  const remote = product.image.startsWith("http");
  if (remote) {
    return (
      // GHL-hosted stills — hostnames vary; skip the optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <Image
      src={product.image}
      alt={product.name}
      fill
      className="object-cover"
      sizes="(min-width: 1024px) 30vw, 90vw"
    />
  );
}

export function ShopGrid({ catalogue }: { catalogue: ShopCatalogue }) {
  const { add, hydrateCatalogue } = useCart();

  useLayoutEffect(() => {
    hydrateCatalogue(catalogue.products);
  }, [catalogue.products, hydrateCatalogue]);

  if (!catalogue.products.length) {
    return (
      <div className="mx-auto max-w-xl border border-line bg-warm px-8 py-14 text-center">
        <p className="eyebrow">The pantry</p>
        <h2 className="mt-3 font-display text-3xl">Nothing bottled just yet.</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          Stock is read live from HighLevel Products. When Lois lists bottles in the
          Chef Lucas Demo collection, they appear here — no site deploy needed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {catalogue.products.map((product, index) => {
        const status = stockStatus(product);
        const badge = stockBadgeLabel(status);
        const soldOut = status === "sold-out";

        return (
          <Reveal
            key={product.id}
            delay={index * 0.04}
            className="card flex flex-col overflow-hidden"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-ink">
              <ProductPhoto product={product} />
              {badge ? (
                <span className="absolute left-3 top-3 border border-line bg-warm/95 px-2 py-1 text-[10px] tracking-[0.16em] uppercase text-charcoal">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="eyebrow">{formatGbp(product.price, product.currency)}</p>
              <h2 className="mt-2 font-display text-2xl">{product.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{product.blurb}</p>
              {soldOut ? (
                <p className="mt-4 self-start text-[12px] tracking-[0.16em] uppercase text-muted">
                  Unavailable
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => add(product.id)}
                  className="mt-4 self-start text-[12px] tracking-[0.16em] uppercase text-gold"
                >
                  Add to bag
                </button>
              )}
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
