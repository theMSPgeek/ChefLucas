import { NextResponse } from "next/server";
import {
  bookingTypes,
  type BookingDraft,
  type BookingTypeId,
} from "@/lib/booking";
import { isDemoMode } from "@/lib/demo";
import {
  bookingTags,
  calendarIdFor,
  formatOpportunityName,
  GHL_PIPELINE,
  postToGhl,
} from "@/lib/ghl";

function asType(value: unknown): BookingTypeId | "" {
  return bookingTypes.some((type) => type.id === value)
    ? (value as BookingTypeId)
    : "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BookingDraft>;
  const eventType = asType(body.eventType);
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!eventType || !firstName || !lastName || !email || !phone) {
    return NextResponse.json(
      { error: "Please complete occasion and contact details." },
      { status: 400 },
    );
  }

  const opportunityName = formatOpportunityName({
    eventType,
    eventDate: body.eventDate,
    guestCount: body.guestCount,
    lastName,
    companyName: body.companyName,
  });

  const payload = {
    source: "website" as const,
    form: "booking-wizard" as const,
    demoMode: isDemoMode(),
    opportunityName,
    pipeline: {
      id: GHL_PIPELINE.id,
      name: GHL_PIPELINE.name,
      stageId: GHL_PIPELINE.stages.newEnquiry,
      stageName: "New enquiry",
    },
    tags: bookingTags(eventType),
    calendarId: calendarIdFor(eventType),
    contact: {
      firstName,
      lastName,
      email,
      phone,
      companyName: String(body.companyName || "").trim(),
    },
    event: {
      type: eventType,
      date: body.eventDate || "",
      guests: body.guestCount || "",
      venue: body.venue || "",
      location: body.location || "",
      dietary: body.dietary || "",
      notes: body.notes || "",
    },
    notes: body.notes || "",
    nextAction: "discovery-call",
  };

  try {
    const result = await postToGhl(payload);
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
