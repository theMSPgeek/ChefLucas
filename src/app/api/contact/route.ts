import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { contactTags, formatOpportunityName, GHL_PIPELINE, postToGhl } from "@/lib/ghl";

export async function POST(request: Request) {
  const body = await request.json();
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const notes = String(body.notes || "").trim();

  if (!firstName || !lastName || !email || !phone || !notes) {
    return NextResponse.json({ error: "Please complete the form." }, { status: 400 });
  }

  const opportunityName = formatOpportunityName({
    eventType: "custom",
    lastName,
  }).replace("Custom", "Contact");

  try {
    const result = await postToGhl({
      source: "website",
      form: "contact",
      demoMode: isDemoMode(),
      opportunityName,
      pipeline: {
        id: GHL_PIPELINE.id,
        name: GHL_PIPELINE.name,
        stageId: GHL_PIPELINE.stages.newEnquiry,
        stageName: "New enquiry",
      },
      tags: contactTags(),
      contact: { firstName, lastName, email, phone },
      notes,
      nextAction: "human-reply",
    });
    return NextResponse.json({
      ok: true,
      opportunityName,
      demo: result.demo,
      forwarded: result.forwarded,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 502 },
    );
  }
}
