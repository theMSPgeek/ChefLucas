import type { Product } from "./products";

export type CheckoutLineInput = {
  id?: string;
  name?: string;
  quantity?: number;
  price?: number;
  tag?: string;
  priceId?: string;
  sku?: string;
};

export type InventoryWriteItem = {
  priceId: string;
  availableQuantity: number;
  allowOutOfStockPurchases: false;
};

export type InventoryLineResult = {
  id: string;
  name: string;
  priceId: string;
  sku: string;
  tag: string;
  price: number;
  quantity: number;
  previousQty: number | null;
  availableQuantity: number | null;
  trackInventory: boolean;
};

export type InventoryPlan =
  | { ok: true; writes: InventoryWriteItem[]; lines: InventoryLineResult[] }
  | { ok: false; status: 400 | 409; error: string };

function asQuantity(value: unknown) {
  const quantity = Math.floor(Number(value));
  return Number.isFinite(quantity) ? quantity : NaN;
}

/**
 * Read current GHL qty, reject sold-out / insufficient, then compute the
 * **absolute** availableQuantity HighLevel expects (not a delta).
 */
export function planInventoryDecrements(
  catalogue: Product[],
  items: CheckoutLineInput[],
): InventoryPlan {
  const byId = new Map(catalogue.map((product) => [product.id, product]));
  const aggregated = new Map<string, number>();

  for (const item of items) {
    const id = String(item.id || "").trim();
    const quantity = asQuantity(item.quantity);
    if (!id) {
      return { ok: false, status: 400, error: "Each line item needs a product id." };
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return {
        ok: false,
        status: 400,
        error: "Each line item needs a quantity of at least 1.",
      };
    }
    aggregated.set(id, (aggregated.get(id) || 0) + quantity);
  }

  if (!aggregated.size) {
    return { ok: false, status: 400, error: "Bag is empty." };
  }

  const writes: InventoryWriteItem[] = [];
  const lines: InventoryLineResult[] = [];

  for (const [id, quantity] of aggregated) {
    const product = byId.get(id);
    if (!product) {
      return {
        ok: false,
        status: 400,
        error: "That product is not in the Chef Lucas Demo shop.",
      };
    }

    const priceId = product.priceId?.trim() || "";
    if (!priceId) {
      return {
        ok: false,
        status: 400,
        error: `${product.name} is missing a HighLevel priceId.`,
      };
    }

    let availableQuantity: number | null = product.qty;
    const previousQty = product.qty;

    if (product.trackInventory) {
      const current = Math.max(0, Math.floor(Number(product.qty ?? 0)));
      if (current === 0) {
        return {
          ok: false,
          status: 409,
          error: `${product.name} is sold out.`,
        };
      }
      if (quantity > current) {
        return {
          ok: false,
          status: 409,
          error: `Only ${current} of ${product.name} left.`,
        };
      }
      availableQuantity = Math.max(0, Math.floor(current - quantity));
      writes.push({
        priceId,
        availableQuantity,
        allowOutOfStockPurchases: false,
      });
    }

    lines.push({
      id: product.id,
      name: product.name,
      priceId,
      sku: product.sku,
      tag: product.tag,
      price: product.price,
      quantity,
      previousQty,
      availableQuantity,
      trackInventory: product.trackInventory,
    });
  }

  return { ok: true, writes, lines };
}
