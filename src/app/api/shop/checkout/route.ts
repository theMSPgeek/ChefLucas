import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { getShopCatalogue, SHOP_CACHE_TAG, updateGhlInventory } from "@/lib/ghl-products";
import { GHL_PIPELINE, postToGhl, shopTags } from "@/lib/ghl";
import {
  planInventoryDecrements,
  type CheckoutLineInput,
} from "@/lib/shop-inventory";

const DEMO_COPY = "demo order — stock updated in GHL, nothing charged.";

function revalidateShop() {
  revalidateTag(SHOP_CACHE_TAG, "max");
  revalidatePath("/shop");
  revalidatePath("/api/shop/products");
}

export async function POST(request: Request) {
  const body = await request.json();
  const contact = body.contact || {};
  const items = (body.items || []) as CheckoutLineInput[];
  const firstName = String(contact.firstName || "").trim();
  const lastName = String(contact.lastName || "").trim();
  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();

  if (!firstName || !lastName || !email || !phone || items.length === 0) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const catalogue = await getShopCatalogue({ fresh: true });
  if (catalogue.status === "unconfigured") {
    return NextResponse.json(
      { error: catalogue.reason, charged: false },
      { status: 503 },
    );
  }
  if (catalogue.status === "error") {
    return NextResponse.json(
      { error: catalogue.reason, charged: false },
      { status: 502 },
    );
  }

  const plan = planInventoryDecrements(catalogue.products, items);
  if (!plan.ok) {
    return NextResponse.json({ error: plan.error, charged: false }, { status: plan.status });
  }

  try {
    if (plan.writes.length) {
      await updateGhlInventory(plan.writes);
      revalidateShop();
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "HighLevel inventory update failed. Confirm products/prices.write on the Private Integration token.",
        charged: false,
      },
      { status: 502 },
    );
  }

  const opportunityName = `Shop | ${plan.lines.map((item) => item.id).join("+")} | ${lastName}`;
  const tags = [...shopTags(), ...plan.lines.map((item) => item.tag)];

  let forwarded = false;
  let demo = isDemoMode();
  try {
    const result = await postToGhl({
      source: "website",
      form: "sauce-shop",
      demoMode: demo,
      opportunityName,
      pipeline: {
        id: GHL_PIPELINE.id,
        name: GHL_PIPELINE.name,
        stageId: GHL_PIPELINE.stages.newEnquiry,
        stageName: "New enquiry",
      },
      tags,
      contact: {
        firstName,
        lastName,
        email,
        phone,
      },
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
        subtotal: body.subtotal || 0,
        currency: "GBP",
        stripe: {
          publishableKeyPresent: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
          charged: false,
        },
        inventory: {
          updated: plan.writes.length > 0,
          locationId: catalogue.filter.locationId,
        },
      },
      notes: String(contact.notes || ""),
      nextAction: "ecommerce-fulfilment",
    });
    forwarded = result.forwarded;
    demo = result.demo;
  } catch (error) {
    console.warn(
      "[shop/checkout] Inventory updated but webhook forward failed.",
      error instanceof Error ? error.message : error,
    );
  }

  return NextResponse.json({
    ok: true,
    opportunityName,
    demo,
    forwarded,
    charged: false,
    inventoryUpdated: plan.writes.length > 0,
    message: DEMO_COPY,
    items: plan.lines,
  });
}
