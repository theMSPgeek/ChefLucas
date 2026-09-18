export const bookingTypes = [
  {
    id: "wedding",
    label: "Wedding",
    eyebrow: "Celebrations",
    summary:
      "Day-of dining, grazing, and late-night kitchens for 40–400 guests.",
    nextAction: "Discovery call → proposal → 20% deposit to lock the date",
  },
  {
    id: "corporate",
    label: "Corporate",
    eyebrow: "Hospitality",
    summary:
      "Board lunches, away-days, product launches and staff celebrations.",
    nextAction: "Qualified briefing → menu proposal → deposit invoice",
  },
  {
    id: "buffet",
    label: "Buffet",
    eyebrow: "Gatherings",
    summary:
      "Hot and cold buffets, festive spreads, and fully managed service.",
    nextAction: "Guest count + dietary capture → proposal",
  },
  {
    id: "private",
    label: "Private dining",
    eyebrow: "At home",
    summary:
      "Chef-at-home tasting menus, 5 or 7 courses, plated in your space.",
    nextAction: "Tasting kitchen or menu consult → 20% deposit",
  },
  {
    id: "tasting",
    label: "Tasting kitchen",
    eyebrow: "Wildcard",
    summary:
      "A seated tasting to lock a wedding or private menu before the day.",
    nextAction: "Calendar hold on the tasting diary",
  },
  {
    id: "custom",
    label: "Custom",
    eyebrow: "Bespoke",
    summary:
      "Greek street food, Fiesta Mexicana, burger bars, or a hybrid feast.",
    nextAction: "Concept call → tagged opportunity in New enquiry",
  },
] as const;

export type BookingTypeId = (typeof bookingTypes)[number]["id"];

export type BookingDraft = {
  eventType: BookingTypeId | "";
  eventDate: string;
  guestCount: string;
  venue: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  dietary: string;
  notes: string;
};

export const emptyBooking: BookingDraft = {
  eventType: "",
  eventDate: "",
  guestCount: "",
  venue: "",
  location: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  dietary: "",
  notes: "",
};

export const bookingJourney = [
  {
    step: "01",
    title: "A conversation first",
    body: "Every live booking starts with a call. The wizard captures the fields HighLevel needs so that conversation is already tagged.",
  },
  {
    step: "02",
    title: "New enquiry",
    body: "Opportunity named Event | Date | Guests | Surname, stage New enquiry, calendar matched to the event type.",
  },
  {
    step: "03",
    title: "Proposal & contract",
    body: "Menus, service setup, and a digital booking form. Twenty percent deposit locks the date — Stripe via GHL when connected.",
  },
  {
    step: "04",
    title: "Two-week check-in",
    body: "Final guest count, allergens, and arrival time. Workflows fire the reminder; the chefs still speak to you in person.",
  },
];
