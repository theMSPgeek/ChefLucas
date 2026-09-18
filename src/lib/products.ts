export type Product = {
  id: string;
  name: string;
  price: number;
  blurb: string;
  details: string;
  image: string;
  ghlEnv: string;
  tag: string;
};

export const products: Product[] = [
  {
    id: "aegean",
    name: "Aegean lemon & oregano",
    price: 9,
    blurb: "The gyro stall in a bottle. Bright, herbal, generous.",
    details: "Cold-pressed lemon, wild oregano, garlic, olive oil.",
    image: "/images/img-6761.jpg",
    ghlEnv: "GHL_PRODUCT_AEGEAN",
    tag: "product/aegean-lemon",
  },
  {
    id: "ember",
    name: "Ember burger glaze",
    price: 8,
    blurb: "Sticky, smoky, the chalkboard special at home.",
    details: "Reduced onion, dark sugar, chipotle, beef dripping note.",
    image: "/images/smash-2.jpg",
    ghlEnv: "GHL_PRODUCT_EMBER",
    tag: "product/ember-glaze",
  },
  {
    id: "fiesta",
    name: "Fiesta Mexicana hot",
    price: 8,
    blurb: "Heat with citrus. The sombrero sauce, bottled.",
    details: "Guajillo, lime, pickled onion liquor.",
    image: "/images/img-3285.jpg",
    ghlEnv: "GHL_PRODUCT_FIESTA",
    tag: "product/fiesta-hot",
  },
  {
    id: "garden",
    name: "Garden herb aioli",
    price: 7,
    blurb: "For grazing boards, chips, and anything golden.",
    details: "Egg yolk, chive, tarragon, lemon.",
    image: "/images/img-8866.jpg",
    ghlEnv: "GHL_PRODUCT_GARDEN",
    tag: "product/garden-aioli",
  },
  {
    id: "mustard",
    name: "House hot-dog mustard",
    price: 6,
    blurb: "Sharp, floral, built for a loaded bun.",
    details: "Yellow and brown seed, cider vinegar, honey.",
    image: "/images/hotdogs.jpg",
    ghlEnv: "GHL_PRODUCT_MUSTARD",
    tag: "product/house-mustard",
  },
  {
    id: "trio",
    name: "Sauce club seasonal trio",
    price: 24,
    blurb: "Three rotating bottles. The tasting kitchen, posted.",
    details: "A quarterly set — currently lemon, ember, and fiesta.",
    image: "/images/fries-1.jpg",
    ghlEnv: "GHL_PRODUCT_TRIO",
    tag: "product/sauce-trio",
  },
  {
    id: "tote",
    name: "Chef Lucas canvas tote",
    price: 18,
    blurb: "Heavy cream canvas, serif lockup, market-day duty.",
    details: "Demo merch. Shown as a taste of the lockup, not a live dispatch.",
    image: "/images/logo.png",
    ghlEnv: "GHL_PRODUCT_TOTE",
    tag: "product/tote",
  },
  {
    id: "spice",
    name: "Tasting kitchen spice tin",
    price: 16,
    blurb: "The private-dining rub: rosemary, smoked salt, lemon zest.",
    details: "Enough for a tomahawk evening at home.",
    image: "/images/plates.jpg",
    ghlEnv: "GHL_PRODUCT_SPICE",
    tag: "product/spice-tin",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}
