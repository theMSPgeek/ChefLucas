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
  /** GHL product media URL only. Empty string → cream placeholder, never local shop stills. */
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
  return "In stock";
}

export function stockBadgeClass(status: StockStatus) {
  if (status === "sold-out") {
    return "border border-charcoal/80 bg-warm/90 text-muted";
  }
  if (status === "low-stock") {
    return "text-gold";
  }
  return "text-muted";
}

/** Accept only remote GHL media. Never map to /images/shop-*.png. */
export function productImageUrl(image?: string | null) {
  const remote = image?.trim() || "";
  if (/^https?:\/\//i.test(remote)) return remote;
  return "";
}

export function firstHttpUrl(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const url = extractHttpUrl(candidate);
    if (url) return url;
  }
  return "";
}

function extractHttpUrl(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractHttpUrl(item);
      if (url) return url;
    }
    return "";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      extractHttpUrl(record.url) ||
      extractHttpUrl(record.image) ||
      extractHttpUrl(record.src) ||
      extractHttpUrl(record.path)
    );
  }
  return "";
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
