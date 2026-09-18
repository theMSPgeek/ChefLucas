export const site = {
  name: "Chef Lucas Catering",
  legalName: "Chef Lucas Catering Services Ltd",
  tagline: "Fine dining hospitality, brought to your table.",
  description:
    "Polish and European catering by Chef Lucas Toborek — weddings, corporate events, buffets, private dining and tasting kitchens across the UK.",
  url: "https://cheflucas.co.uk",
  email: "Lucas.Toborek@cheflucas.co.uk",
  phone: "07472 813392",
  phoneHref: "tel:+447472813392",
  address: "99 High St, Burton-on-Trent DE14 1LJ",
  instagram: "https://www.instagram.com/cheflucastoborek/",
  facebook: "https://www.facebook.com/cheflucascatering",
  linkedin: "https://www.linkedin.com/company/clsc-ltd",
  trustpilot: "https://uk.trustpilot.com/review/cheflucas.co.uk",
  fkit: "https://fk-it.co.uk",
} as const;

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/menus", label: "Menus" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const assetCredit =
  "Photography sourced from cheflucas.co.uk for this FKIT demo. Not live bookings.";
