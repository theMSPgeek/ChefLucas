import { bookingTypes, type BookingTypeId } from "./booking";
import { isDemoMode } from "./demo";

export const GHL_PIPELINE = {
  name: "FKIT Sales",
  id: process.env.GHL_PIPELINE_ID || "wbWmW9OBShOhEHUWEhC4",
  stages: {
    newEnquiry:
      process.env.GHL_PIPELINE_STAGE_NEW_ENQUIRY ||
      "ba9f504a-48f4-43f3-aa0a-30984e275e8b",
    qualified: "cba6e3e6-4550-456c-aa59-719c1eac5a84",
    proposal: "6811c04e-5395-421b-82b0-3dd25827bd50",
    won: "6f043d3c-6727-44de-9863-446e6fed44a1",
    lost: "37429b20-e8cf-4c4b-beef-5f45607b27df",
  },
} as const;

const calendarEnv: Record<BookingTypeId, string | undefined> = {
  wedding: process.env.NEXT_PUBLIC_GHL_CALENDAR_WEDDING,
  corporate: process.env.NEXT_PUBLIC_GHL_CALENDAR_CORPORATE,
  buffet: process.env.NEXT_PUBLIC_GHL_CALENDAR_BUFFET,
  private: process.env.NEXT_PUBLIC_GHL_CALENDAR_PRIVATE,
  tasting: process.env.NEXT_PUBLIC_GHL_CALENDAR_TASTING,
  custom: process.env.NEXT_PUBLIC_GHL_CALENDAR_CUSTOM,
};

export function calendarIdFor(type: BookingTypeId) {
  return calendarEnv[type] || "";
}

export function formatOpportunityName(input: {
  eventType: string;
  eventDate?: string;
  guestCount?: string | number;
  lastName?: string;
  companyName?: string;
}) {
  const type =
    bookingTypes.find((t) => t.id === input.eventType)?.label ||
    input.eventType ||
    "Enquiry";
  const date = input.eventDate
    ? new Date(`${input.eventDate}T12:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBC";
  const guests = input.guestCount ? `${input.guestCount}pax` : "TBC";
  const who = (input.lastName || input.companyName || "Website").trim();
  return `${type} | ${date} | ${guests} | ${who}`;
}

export function bookingTags(eventType: string) {
  const tags = [
    "source/website",
    "source/booking-wizard",
    "vertical/catering",
    `event/${eventType || "custom"}`,
    "stage/new-enquiry",
  ];
  if (isDemoMode()) tags.push("demo/mode");
  return tags;
}

export function shopTags() {
  const tags = [
    "source/website",
    "source/sauce-shop",
    "vertical/ecommerce",
    "product/sauce-club",
    "stage/new-enquiry",
  ];
  if (isDemoMode()) tags.push("demo/mode");
  return tags;
}

export function contactTags() {
  const tags = [
    "source/website",
    "source/contact",
    "vertical/catering",
    "stage/new-enquiry",
  ];
  if (isDemoMode()) tags.push("demo/mode");
  return tags;
}

export type GhlLeadPayload = {
  source: "website";
  form: "booking-wizard" | "contact" | "sauce-shop";
  demoMode: boolean;
  opportunityName: string;
  pipeline: { id: string; name: string; stageId: string; stageName: string };
  tags: string[];
  calendarId?: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  event?: Record<string, unknown>;
  order?: Record<string, unknown>;
  notes?: string;
  nextAction: string;
};

export async function postToGhl(payload: GhlLeadPayload) {
  const url =
    process.env.GHL_WEBHOOK_URL || process.env.NEXT_PUBLIC_GHL_FORM_URL;
  if (!url) {
    return { ok: true, demo: true as const, forwarded: false };
  }

  const body = {
    ...payload,
    first_name: payload.contact.firstName,
    last_name: payload.contact.lastName,
    email: payload.contact.email,
    phone: payload.contact.phone,
    company_name: payload.contact.companyName || "",
    opportunity_name: payload.opportunityName,
    tags: payload.tags.join(","),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GHL webhook failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return { ok: true, demo: isDemoMode(), forwarded: true };
}
