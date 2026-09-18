export type StockStatus = "in-stock" | "low-stock" | "sold-out";

export type Product = {
  /** HighLevel product `_id` — never a local SKU slug. */
  id: string;
  priceId: string;
  name: string;
  price: number;
  currency: string;
  blurb: string;
  details: string;
  image: string;
  tag: string;
  sku: string;
  /** Available quantity from GHL inventory. `null` when inventory is not tracked. */
  qty: number | null;
  trackInventory: boolean;
  collectionIds: string[];
};

export type ShopCatalogueStatus =
  | "ok"
  | "unconfigured"
  | "empty"
  | "error";

export type ShopCatalogue = {
  products: Product[];
  status: ShopCatalogueStatus;
  reason: string;
  generatedAt: string;
  filter: {
    locationId: string;
    collectionName: string;
    collectionId: string;
    productIds: string[];
  };
};

const stillFallbacks: { test: RegExp; image: string }[] = [
  { test: /aegean|lemon|oregano/i, image: "/images/shop-aegean.png" },
  { test: /ember|glaze|burger/i, image: "/images/shop-ember.png" },
  { test: /fiesta|mexicana/i, image: "/images/shop-fiesta.png" },
  { test: /garden|aioli|herb/i, image: "/images/shop-garden.png" },
  { test: /mustard|hot[- ]?dog/i, image: "/images/shop-mustard.png" },
  { test: /trio|seasonal/i, image: "/images/shop-trio.png" },
  { test: /spice|tin|rub/i, image: "/images/shop-spice.png" },
  { test: /tote|canvas|bag/i, image: "/images/logo-alt.png" },
];

const remembered = new Map<string, Product>();

export function rememberProducts(products: Product[]) {
  for (const product of products) remembered.set(product.id, product);
}

export function getProduct(id: string) {
  return remembered.get(id);
}

export function formatGbp(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
  }).format(value);
}

export function stockStatus(product: Pick<Product, "qty" | "trackInventory">): StockStatus {
  if (!product.trackInventory || product.qty === null) return "in-stock";
  if (product.qty === 0) return "sold-out";
  if (product.qty > 0 && product.qty < 10) return "low-stock";
  return "in-stock";
}

export function stockBadgeLabel(status: StockStatus) {
  if (status === "sold-out") return "Sold out";
  if (status === "low-stock") return "Low stock";
  return null;
}

export function fallbackStill(name: string, image?: string | null) {
  const remote = image?.trim();
  if (remote && /^https?:\/\//i.test(remote)) return remote;
  if (remote && remote.startsWith("/")) return remote;
  const match = stillFallbacks.find((entry) => entry.test.test(name));
  return match?.image || "/images/shop-trio.png";
}

export function slugTag(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug ? `product/${slug}` : "product/sauce-club";
}

export function emptyCatalogue(
  status: ShopCatalogueStatus,
  reason: string,
  filter: ShopCatalogue["filter"],
): ShopCatalogue {
  return {
    products: [],
    status,
    reason,
    generatedAt: new Date().toISOString(),
    filter,
  };
}
