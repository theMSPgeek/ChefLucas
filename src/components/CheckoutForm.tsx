"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatGbp } from "@/lib/products";
import type { InventoryLineResult } from "@/lib/shop-inventory";

export function CheckoutForm() {
  const { detailed, subtotal, clear } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<InventoryLineResult[]>([]);

  if (detailed.length === 0 && status !== "done") {
    return (
      <p className="text-sm text-muted">
        Your bag is empty.{" "}
        <Link className="underline" href="/shop">
          Visit the sauce club
        </Link>
        .
      </p>
    );
  }

  if (status === "done") {
    return (
      <div className="border border-line px-6 py-10">
        <p className="eyebrow">Demo order received</p>
        <h2 className="mt-3 font-display text-3xl">Nothing was charged.</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          {message || "demo order — stock updated in GHL, nothing charged."} We have the bag as{" "}
          <strong>{lines.length ? lines.map((line) => line.name).join(", ") : "your order"}</strong>
          .
        </p>
        {lines.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm text-muted">
            {lines.map((line) => (
              <li key={line.id}>
                {line.name} × {line.quantity}
                {line.trackInventory && line.availableQuantity !== null
                  ? ` — ${line.availableQuantity} left in HighLevel`
                  : null}
              </li>
            ))}
          </ul>
        )}
        <Link href="/shop" className="mt-6 inline-block text-sm underline">
          Back to the shop
        </Link>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const contact = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          items: detailed.map(({ product, quantity }) => ({
            id: product.id,
            name: product.name,
            quantity,
            price: product.price,
            tag: product.tag,
            priceId: product.priceId,
            sku: product.sku,
            qty: product.qty,
          })),
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      clear();
      setMessage(typeof data.message === "string" ? data.message : "");
      setLines(Array.isArray(data.items) ? data.items : []);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="grid gap-5">
        <h2 className="font-display text-3xl">Where should the bottles go?</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
              First name
            </span>
            <input required name="firstName" className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
              Last name
            </span>
            <input required name="lastName" className="field" />
          </label>
        </div>
        <label className="text-sm">
          <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            Email
          </span>
          <input required type="email" name="email" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            Phone
          </span>
          <input required type="tel" name="phone" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            Notes
          </span>
          <textarea name="notes" rows={3} className="field" />
        </label>
        {status === "error" && <p className="text-sm text-red-800">{message}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn btn-solid disabled:opacity-40"
        >
          {status === "sending" ? "Placing demo order…" : "Place demo order"}
        </button>
        <p className="text-xs text-muted">
          Demo order — stock updated in GHL, nothing charged.
        </p>
      </form>
      <aside className="card p-6">
        <p className="eyebrow">Bag</p>
        <ul className="mt-4 space-y-3 text-sm">
          {detailed.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-4">
              <span>
                {product.name} × {quantity}
              </span>
              <span>{formatGbp(product.price * quantity, product.currency)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex justify-between border-t border-line pt-4 text-sm">
          <span>Subtotal</span>
          <span>{formatGbp(subtotal)}</span>
        </p>
      </aside>
    </div>
  );
}
