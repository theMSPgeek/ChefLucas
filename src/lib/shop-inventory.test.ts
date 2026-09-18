import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "./products.ts";
import { planInventoryDecrements } from "./shop-inventory.ts";

function product(
  overrides: Partial<Product> & Pick<Product, "id" | "name" | "priceId">,
): Product {
  return {
    currency: "GBP",
    blurb: "",
    details: "",
    image: "",
    tag: "product/x",
    sku: "",
    trackInventory: true,
    collectionIds: [],
    price: 8,
    qty: 15,
    ...overrides,
  };
}

const ember = product({
  id: "ember-id",
  priceId: "ember-price",
  name: "Ember burger glaze",
  qty: 15,
});

test("decrements to an absolute remaining quantity", () => {
  const plan = planInventoryDecrements([ember], [{ id: ember.id, quantity: 2 }]);
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.deepEqual(plan.writes, [
    { priceId: "ember-price", availableQuantity: 13, allowOutOfStockPurchases: false },
  ]);
  assert.equal(plan.lines[0]?.previousQty, 15);
  assert.equal(plan.lines[0]?.availableQuantity, 13);
});

test("rejects sold-out before any write", () => {
  const mustard = product({
    id: "mustard-id",
    priceId: "mustard-price",
    name: "House mustard",
    qty: 0,
  });
  const plan = planInventoryDecrements([mustard], [{ id: mustard.id, quantity: 1 }]);
  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.status, 409);
  assert.match(plan.error, /sold out/i);
});

test("rejects quantities above remaining stock", () => {
  const plan = planInventoryDecrements([ember], [{ id: ember.id, quantity: 16 }]);
  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.status, 409);
  assert.match(plan.error, /Only 15/);
});

test("ignores products outside the demo catalogue", () => {
  const plan = planInventoryDecrements([ember], [{ id: "not-in-collection", quantity: 1 }]);
  assert.equal(plan.ok, false);
  if (plan.ok) return;
  assert.equal(plan.status, 400);
});

test("aggregates duplicate lines and uses catalogue priceId", () => {
  const plan = planInventoryDecrements(
    [ember],
    [
      { id: ember.id, quantity: 1, priceId: "forged" },
      { id: ember.id, quantity: 3, priceId: "forged" },
    ],
  );
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.writes[0]?.priceId, "ember-price");
  assert.equal(plan.writes[0]?.availableQuantity, 11);
});
