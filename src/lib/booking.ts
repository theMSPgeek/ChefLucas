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
    nextAction: "Briefing → menu proposal → deposit invoice",
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
    nextAction: "Concept call → we write it down as a custom enquiry",
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
    body: "Every booking starts with a call. These notes mean that conversation already knows the day.",
  },
  {
    step: "02",
    title: "The enquiry",
    body: "We keep the occasion, date, guest count, and who to write to — so nothing arrives as a nameless message.",
  },
  {
    step: "03",
    title: "Proposal & contract",
    body: "Menus, service setup, and a booking form. Twenty percent deposit locks the date.",
  },
  {
    step: "04",
    title: "Two-week check-in",
    body: "Final guest count, allergens, and arrival time. The chefs still speak to you in person.",
  },
];
