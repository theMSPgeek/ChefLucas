import { isPriceId } from "./input";
import { inventoryWritePermitted } from "./shop-auth";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_INVENTORY_WRITE_VERSION = "v3";
const MAX_QUANTITY = 1_000_000;

export type GhlInventoryWrite = {
  priceId: string;
  availableQuantity: number;
  allowOutOfStockPurchases?: boolean;
};

export class InventoryWriteError extends Error {
  constructor() {
    super("Could not update inventory.");
    this.name = "InventoryWriteError";
  }
}

function privateToken() {
  return (
    process.env.GHL_PRIVATE_API_TOKEN?.trim() ||
    process.env.GHL_PRIVATE_INTEGRATION_TOKEN?.trim() ||
    ""
  );
}

function locationId() {
  return (
    process.env.GHL_LOCATION_ID?.trim() ||
    process.env.NEXT_PUBLIC_GHL_LOCATION_ID?.trim() ||
    "zpGOdJ2JYNkKfMpcko5l"
  );
}

function writesAreWellFormed(items: GhlInventoryWrite[]) {
  return items.every((item) => {
    return (
      isPriceId(item.priceId) &&
      Number.isInteger(item.availableQuantity) &&
      item.availableQuantity >= 0 &&
      item.availableQuantity <= MAX_QUANTITY
    );
  });
}

/**
 * Absolute inventory set. Refuses unless the server flag is on and the
 * caller has already authenticated the operator. Never includes upstream
 * bodies or the token in the thrown error.
 */
export async function commitGhlInventory(
  items: GhlInventoryWrite[],
  authorized: boolean,
  fetchImpl: typeof fetch = fetch,
) {
  if (!items.length) {
    return { status: true as const };
  }
  if (!inventoryWritePermitted(authorized) || !writesAreWellFormed(items)) {
    console.error("[shop/ghl] blocked inventory write");
    throw new InventoryWriteError();
  }

  const token = privateToken();
  if (!token) {
    console.error("[shop/ghl] inventory write failed");
    throw new InventoryWriteError();
  }

  let response: Response;
  try {
    response = await fetchImpl(`${GHL_API}/products/inventory`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Version: GHL_INVENTORY_WRITE_VERSION,
      },
      body: JSON.stringify({
        altId: locationId(),
        altType: "location",
        items: items.map((item) => ({
          priceId: item.priceId,
          availableQuantity: item.availableQuantity,
          allowOutOfStockPurchases: false,
        })),
      }),
    });
  } catch {
    console.error("[shop/ghl] inventory write failed");
    throw new InventoryWriteError();
  }

  if (!response.ok) {
    console.error(`[shop/ghl] inventory write failed (${response.status})`);
    throw new InventoryWriteError();
  }

  let status: boolean | undefined = true;
  try {
    const payload = (await response.json()) as { status?: boolean };
    status = payload.status;
  } catch {
    status = true;
  }
  if (status === false) {
    console.error("[shop/ghl] inventory write rejected");
    throw new InventoryWriteError();
  }
  return { status: true as const };
}
