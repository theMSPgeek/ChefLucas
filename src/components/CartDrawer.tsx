"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";
import { formatGbp, stockBadgeClass, stockBadgeLabel, stockStatus } from "@/lib/products";

export function CartDrawer() {
  const { open, setOpen, detailed, subtotal, setQuantity, remove } = useCart();
  const reduceMotion = useReducedMotion();
  const slide = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close cart"
            className="fixed inset-0 z-[70] bg-ink/40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => setOpen(false)}
            type="button"
          />
          <motion.aside
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "100%" }}
            transition={slide}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col bg-cream text-ink shadow-soft"
            role="dialog"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl">The sauce bag</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-sm">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-6">
              {detailed.length === 0 ? (
                <p className="text-sm text-muted">Nothing bottled yet.</p>
              ) : (
                <ul className="space-y-5">
                  {detailed.map(({ product, quantity }) => {
                    const badge = stockBadgeLabel(stockStatus(product));
                    return (
                    <li key={product.id} className="flex gap-4">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] shrink-0 object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm">{product.name}</p>
                        <p className="text-xs text-muted">
                          {formatGbp(product.price, product.currency)}
                          {badge ? (
                            <>
                              {" "}
                              ·{" "}
                              <span className={stockBadgeClass(stockStatus(product))}>
                                {badge}
                              </span>
                            </>
                          ) : null}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => setQuantity(product.id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(product.id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="ml-auto text-xs text-muted"
                            onClick={() => remove(product.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-line px-6 py-5">
              <p className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatGbp(subtotal)}</span>
              </p>
              <p className="mt-2 text-xs text-muted">
                Demo checkout only — nothing is charged.
              </p>
              <Link
                href="/shop/checkout"
                onClick={() => setOpen(false)}
                className="mt-4 block btn btn-solid text-center"
              >
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
