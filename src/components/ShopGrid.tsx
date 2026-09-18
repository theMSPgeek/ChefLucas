"use client";

import Image from "next/image";
import { products, formatGbp } from "@/lib/products";
import { useCart } from "./CartProvider";
import { Reveal } from "./Reveal";

export function ShopGrid() {
  const { add } = useCart();

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <Reveal key={product.id} delay={index * 0.04} className="card flex flex-col overflow-hidden">
          <div className="relative aspect-[4/5] overflow-hidden bg-ink">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 30vw, 90vw"
            />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="eyebrow">{formatGbp(product.price)}</p>
            <h2 className="mt-2 font-display text-2xl">{product.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted">{product.blurb}</p>
            <button
              type="button"
              onClick={() => add(product.id)}
              className="mt-4 self-start text-[12px] tracking-[0.16em] uppercase text-gold"
            >
              Add to bag
            </button>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
