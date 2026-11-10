import type { BookingTypeId } from "./booking";
import { bookingTypes } from "./booking";
import { isDemoMode } from "./demo";
import {
  bookingTags,
  calendarIdFor,
  contactTags,
  formatOpportunityName,
  GHL_PIPELINE,
  type GhlLeadPayload,
} from "./ghl";
import {
  cleanMultiline,
  cleanSingleLine,
  isEmailAddress,
  isGuestCount,
  isIsoDate,
  isPersonName,
  isPhoneNumber,
} from "./input";
import {
  guardStateChangingPost,
  isResponse,
  jsonResponse,
  readJsonObject,
} from "./request-guards";

const ENQUIRY_LIMIT = 8;
const ENQUIRY_WINDOW_MS = 10 * 60 * 1000;

export type LeadForward = (payload: GhlLeadPayload) => Promise<{ demo: boolean; forwarded: boolean }>;

const bookingIds = new Set<string>(bookingTypes.map((type) => type.id));

function pipeline() {
  return {
    id: GHL_PIPELINE.id,
    name: GHL_PIPELINE.name,
    stageId: GHL_PIPELINE.stages.newEnquiry,
    stageName: "New enquiry",
  };
}

function person(record: Record<string, unknown>) {
  const firstName = cleanSingleLine(record.firstName, 80);
  const lastName = cleanSingleLine(record.lastName, 80);
  const email = cleanSingleLine(record.email, 254);
  const phone = cleanSingleLine(record.phone, 24);
  if (!isPersonName(firstName) || !isPersonName(lastName)) {
    return "Enter a first and last name.";
  }
  if (!isEmailAddress(email)) return "Enter a valid email address.";
  if (!isPhoneNumber(phone)) return "Enter a valid phone number.";
  return { firstName, lastName, email, phone };
}

export async function handleContactEnquiry(request: Request, forward: LeadForward) {
  const blocked = guardStateChangingPost(request, {
    bucket: "contact",
    limit: ENQUIRY_LIMIT,
    windowMs: ENQUIRY_WINDOW_MS,
  });
  if (blocked) return blocked;

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;

  const who = person(body);
  if (typeof who === "string") return jsonResponse(400, { error: who });
  const notes = cleanMultiline(body.notes, 4000);
  if (notes.length < 1) return jsonResponse(400, { error: "Please complete the form." });

  const opportunityName = formatOpportunityName({
    eventType: "custom",
    lastName: who.lastName,
  }).replace("Custom", "Contact");

  try {
    const result = await forward({
      source: "website",
      form: "contact",
      demoMode: isDemoMode(),
      opportunityName,
      pipeline: pipeline(),
      tags: contactTags(),
      contact: who,
      notes,
      nextAction: "human-reply",
    });
    return jsonResponse(200, {
      ok: true,
      opportunityName,
      demo: result.demo,
      forwarded: result.forwarded,
    });
  } catch {
    console.error("[contact] enquiry forward failed");
    return jsonResponse(502, { error: "Could not send your enquiry. Please try again." });
  }
}

export async function handleBookingEnquiry(request: Request, forward: LeadForward) {
  const blocked = guardStateChangingPost(request, {
    bucket: "book",
    limit: ENQUIRY_LIMIT,
    windowMs: ENQUIRY_WINDOW_MS,
  });
  if (blocked) return blocked;

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;

  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  if (!bookingIds.has(eventType)) {
    return jsonResponse(400, { error: "Please complete occasion and contact details." });
  }
  const who = person(body);
  if (typeof who === "string") {
    return jsonResponse(400, { error: "Please complete occasion and contact details." });
  }

  const eventDate = cleanSingleLine(body.eventDate, 10);
  const guestCount = cleanSingleLine(body.guestCount, 4);
  if (!isIsoDate(eventDate) || !isGuestCount(guestCount)) {
    return jsonResponse(400, { error: "Enter a valid event date and guest count." });
  }

  const companyName = cleanSingleLine(body.companyName, 120);
  const venue = cleanSingleLine(body.venue, 160);
  const location = cleanSingleLine(body.location, 160);
  const dietary = cleanMultiline(body.dietary, 1000);
  const notes = cleanMultiline(body.notes, 4000);

  const opportunityName = formatOpportunityName({
    eventType,
    eventDate,
    guestCount,
    lastName: who.lastName,
    companyName,
  });

  const payload: GhlLeadPayload = {
    source: "website",
    form: "booking-wizard",
    demoMode: isDemoMode(),
    opportunityName,
    pipeline: pipeline(),
    tags: bookingTags(eventType),
    calendarId: calendarIdFor(eventType as BookingTypeId),
    contact: { ...who, companyName },
    event: {
      type: eventType,
      date: eventDate,
      guests: guestCount,
      venue,
      location,
      dietary,
      notes,
    },
    notes,
    nextAction: "discovery-call",
  };

  try {
    const result = await forward(payload);
    return jsonResponse(200, {
      ok: true,
      opportunityName,
      demo: result.demo,
      forwarded: result.forwarded,
    });
  } catch {
    console.error("[book] enquiry forward failed");
    return jsonResponse(502, { error: "Could not send your enquiry. Please try again." });
  }
}
