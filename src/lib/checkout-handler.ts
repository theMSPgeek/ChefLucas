import { isDemoMode } from "./demo";
import { GHL_PIPELINE, shopTags, type GhlLeadPayload } from "./ghl";
import {
  cleanMultiline,
  cleanSingleLine,
  isEmailAddress,
  isPersonName,
  isPhoneNumber,
  isProductId,
} from "./input";
import type { ShopCatalogue } from "./products";
import {
  guardStateChangingPost,
  isResponse,
  jsonResponse,
  readJsonObject,
} from "./request-guards";
import { inventoryWritePermitted, readOperatorAuth } from "./shop-auth";
import {
  MAX_LINE_QUANTITY,
  planInventoryDecrements,
  type InventoryWriteItem,
} from "./shop-inventory";

export const DEMO_CHECKOUT_MESSAGE =
  "Demo only — nothing was charged and this is not a live order. Stock was checked and left unchanged.";

export const WRITES_DISABLED_MESSAGE =
  "Demo only — nothing was charged and this is not a live order. Inventory writes are turned off, so stock was left unchanged.";

export const LIVE_CHECKOUT_MESSAGE =
  "Operator checkout — HighLevel stock was updated. Nothing was charged.";

const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;
const MAX_LINES = 12;

export type CheckoutDependencies = {
  getCatalogue: () => Promise<ShopCatalogue>;
  writeInventory: (items: InventoryWriteItem[]) => Promise<void>;
  forwardLead: (payload: GhlLeadPayload) => Promise<{ forwarded: boolean; demo: boolean }>;
  revalidateShop: () => void;
};

type CheckoutInput = {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
  };
  items: Array<{ id: string; quantity: number }>;
};

export function parseCheckoutBody(body: Record<string, unknown>): CheckoutInput | string {
  const contact = body.contact;
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) {
    return "Missing checkout details.";
  }
  const record = contact as Record<string, unknown>;
  const firstName = cleanSingleLine(record.firstName, 80);
  const lastName = cleanSingleLine(record.lastName, 80);
  const email = cleanSingleLine(record.email, 254);
  const phone = cleanSingleLine(record.phone, 24);
  const notes = cleanMultiline(record.notes, 2000);

  if (!isPersonName(firstName) || !isPersonName(lastName)) {
    return "Enter a first and last name.";
  }
  if (!isEmailAddress(email)) return "Enter a valid email address.";
  if (!isPhoneNumber(phone)) return "Enter a valid phone number.";

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_LINES) {
    return "Add at least one product from the demo shop.";
  }

  const items: Array<{ id: string; quantity: number }> = [];
  for (const item of body.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return "Each line item needs a product id and quantity.";
    }
    const line = item as Record<string, unknown>;
    const id = typeof line.id === "string" ? line.id.trim() : "";
    if (!isProductId(id)) return "That product is not in the Chef Lucas Demo shop.";
    if (typeof line.quantity !== "number" || !Number.isInteger(line.quantity)) {
      return `Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`;
    }
    if (line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      return `Quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`;
    }
    items.push({ id, quantity: line.quantity });
  }

  return { contact: { firstName, lastName, email, phone, notes }, items };
}

export async function handleShopCheckout(request: Request, deps: CheckoutDependencies) {
  const blocked = guardStateChangingPost(request, {
    bucket: "shop-checkout",
    limit: CHECKOUT_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
  });
  if (blocked) return blocked;

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;

  const parsed = parseCheckoutBody(body);
  if (typeof parsed === "string") {
    return jsonResponse(400, { error: parsed, charged: false });
  }

  const auth = readOperatorAuth(request);
  if (auth.attempted && !auth.authorized) {
    return jsonResponse(401, { error: "Unauthorized.", charged: false });
  }

  const catalogue = await deps.getCatalogue();
  if (catalogue.status === "unconfigured" || catalogue.status === "error") {
    console.error("[shop/checkout] stock read failed");
    return jsonResponse(catalogue.status === "unconfigured" ? 503 : 502, {
      error: "Shop stock could not be checked.",
      charged: false,
    });
  }

  const plan = planInventoryDecrements(catalogue.products, parsed.items);
  if (!plan.ok) {
    return jsonResponse(plan.status, { error: plan.error, charged: false });
  }

  const live = inventoryWritePermitted(auth.authorized);
  if (!live) {
    return jsonResponse(200, {
      ok: true,
      demo: true,
      liveOrder: false,
      forwarded: false,
      charged: false,
      inventoryUpdated: false,
      message: auth.authorized ? WRITES_DISABLED_MESSAGE : DEMO_CHECKOUT_MESSAGE,
      items: plan.lines,
    });
  }

  if (plan.writes.length) {
    try {
      await deps.writeInventory(plan.writes);
    } catch {
      console.error("[shop/checkout] inventory write failed");
      return jsonResponse(502, {
        error: "Could not update inventory.",
        charged: false,
        inventoryUpdated: false,
        liveOrder: false,
      });
    }
    try {
      deps.revalidateShop();
    } catch {
      console.error("[shop/checkout] shop revalidate failed");
    }
  }

  let forwarded = false;
  try {
    const result = await deps.forwardLead({
      source: "website",
      form: "sauce-shop",
      demoMode: isDemoMode(),
      opportunityName: `Shop | ${plan.lines.map((item) => item.id).join("+")} | ${parsed.contact.lastName}`,
      pipeline: {
        id: GHL_PIPELINE.id,
        name: GHL_PIPELINE.name,
        stageId: GHL_PIPELINE.stages.newEnquiry,
        stageName: "New enquiry",
      },
      tags: [...shopTags(), ...plan.lines.map((item) => item.tag)],
      contact: parsed.contact,
      order: {
        items: plan.lines.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tag: item.tag,
          priceId: item.priceId,
          sku: item.sku,
          qty: item.availableQuantity,
          previousQty: item.previousQty,
          ghlProductId: item.id,
        })),
        subtotal: plan.lines.reduce((sum, item) => sum + item.price * item.quantity, 0),
        currency: "GBP",
        stripe: { charged: false },
        inventory: { updated: plan.writes.length > 0 },
      },
      notes: parsed.contact.notes,
      nextAction: "ecommerce-fulfilment",
    });
    forwarded = result.forwarded;
  } catch {
    console.error("[shop/checkout] lead forward failed");
  }

  return jsonResponse(200, {
    ok: true,
    demo: false,
    liveOrder: true,
    forwarded,
    charged: false,
    inventoryUpdated: plan.writes.length > 0,
    message: LIVE_CHECKOUT_MESSAGE,
    items: plan.lines,
  });
}
