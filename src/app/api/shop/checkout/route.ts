import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { GHL_PIPELINE, postToGhl, shopTags } from "@/lib/ghl";

type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tag: string;
  priceId?: string;
  sku?: string;
  qty?: number | null;
};

export async function POST(request: Request) {
  const body = await request.json();
  const contact = body.contact || {};
  const items = (body.items || []) as Item[];
  const firstName = String(contact.firstName || "").trim();
  const lastName = String(contact.lastName || "").trim();
  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();

  if (!firstName || !lastName || !email || !phone || items.length === 0) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const opportunityName = `Shop | ${items.map((item) => item.id).join("+")} | ${lastName}`;
  const tags = [...shopTags(), ...items.map((item) => item.tag)];

  try {
    const result = await postToGhl({
      source: "website",
      form: "sauce-shop",
      demoMode: isDemoMode(),
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
        items: items.map((item) => ({
          ...item,
          ghlProductId: item.id,
        })),
        subtotal: body.subtotal || 0,
        currency: "GBP",
        stripe: {
          publishableKeyPresent: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
          charged: false,
        },
      },
      notes: String(contact.notes || ""),
      nextAction: "ecommerce-fulfilment",
    });

    return NextResponse.json({
      ok: true,
      opportunityName,
      demo: result.demo,
      forwarded: result.forwarded,
      charged: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 502 },
    );
  }
}
