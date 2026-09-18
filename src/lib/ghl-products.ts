import "server-only";

import {
  emptyCatalogue,
  firstHttpUrl,
  productImageUrl,
  slugTag,
  type Product,
  type ShopCatalogue,
} from "./products";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_READ_VERSION = "2021-07-28";
/** Lois / marketplace docs: POST /products/inventory requires Version: v3. */
const GHL_INVENTORY_WRITE_VERSION = "v3";
const REVALIDATE_SECONDS = 60;
const DEFAULT_LOCATION_ID = "zpGOdJ2JYNkKfMpcko5l";
const DEFAULT_COLLECTION_NAME = "Chef Lucas Demo";
export const SHOP_CACHE_TAG = "ghl-shop";

/**
 * Private Integration Token env names (never commit values).
 * Prefer `GHL_PRIVATE_API_TOKEN`; `GHL_PRIVATE_INTEGRATION_TOKEN` is the
 * HighLevel-docs alias and is accepted as a fallback.
 */
export const GHL_TOKEN_ENV_NAMES = [
  "GHL_PRIVATE_API_TOKEN",
  "GHL_PRIVATE_INTEGRATION_TOKEN",
] as const;

type GhlCollection = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

type GhlProduct = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  image?: string;
  slug?: string;
  collectionIds?: string[];
  availableInStore?: boolean;
  medias?: unknown;
};

type GhlPrice = {
  _id?: string;
  id?: string;
  name?: string;
  amount?: number;
  currency?: string;
  type?: string;
  sku?: string;
  trackInventory?: boolean;
  availableQuantity?: number;
  allowOutOfStockPurchases?: boolean;
  product?: string;
};

type GhlInventoryItem = {
  _id?: string;
  product?: string;
  productName?: string;
  name?: string;
  availableQuantity?: number;
  sku?: string;
  allowOutOfStockPurchases?: boolean;
  image?: string;
};

export function ghlPrivateToken() {
  for (const name of GHL_TOKEN_ENV_NAMES) {
    const value = process.env[name]?.trim();
    if (value) return { name, value };
  }
  return null;
}

export function ghlLocationId() {
  return (
    process.env.GHL_LOCATION_ID?.trim() ||
    process.env.NEXT_PUBLIC_GHL_LOCATION_ID?.trim() ||
    DEFAULT_LOCATION_ID
  );
}

export function ghlCollectionName() {
  return process.env.GHL_PRODUCT_COLLECTION?.trim() || DEFAULT_COLLECTION_NAME;
}

export function ghlCollectionIdEnv() {
  return process.env.GHL_PRODUCT_COLLECTION_ID?.trim() || "";
}

/**
 * TODO(Alice): ping with product IDs once Lois has created the GHL SKUs.
 * Comma-separated allowlist. When empty, we filter by collection name
 * (`GHL_PRODUCT_COLLECTION`, default "Chef Lucas Demo") or
 * `GHL_PRODUCT_COLLECTION_ID`. Do not hard-code fake product IDs.
 */
export function parseProductIdAllowlist(raw = process.env.GHL_PRODUCT_IDS) {
  return (raw || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function shopFilter(overrides?: Partial<ShopCatalogue["filter"]>): ShopCatalogue["filter"] {
  return {
    locationId: ghlLocationId(),
    collectionName: ghlCollectionName(),
    collectionId: ghlCollectionIdEnv(),
    productIds: parseProductIdAllowlist(),
    ...overrides,
  };
}

type GhlCallOptions = {
  method?: "GET" | "POST";
  search?: Record<string, string | string[] | undefined>;
  body?: unknown;
  version?: string;
  cache?: RequestCache;
};

async function ghlCall<T>(path: string, options: GhlCallOptions = {}) {
  const token = ghlPrivateToken();
  if (!token) {
    throw new Error("HighLevel private integration token is not configured.");
  }

  const url = new URL(path.startsWith("http") ? path : `${GHL_API}${path}`);
  for (const [key, value] of Object.entries(options.search || {})) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, value);
    }
  }

  const method = options.method || "GET";
  const cache = options.cache ?? (method === "GET" ? "force-cache" : "no-store");
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token.value}`,
    Version: options.version || GHL_READ_VERSION,
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method,
    headers,
    cache,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  if (cache === "force-cache" || cache === "default") {
    init.next = { revalidate: REVALIDATE_SECONDS, tags: [SHOP_CACHE_TAG] };
  }

  const res = await fetch(url, init);

  const text = await res.text();
  let json: T | null = null;
  try {
    json = text ? (JSON.parse(text) as T) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const hint =
      res.status === 401 || res.status === 403
        ? " Confirm the Private Integration token includes products/prices.write (and the existing readonly product scopes), then redeploy Production."
        : "";
    throw new Error(
      `GHL ${method} ${url.pathname} failed (${res.status}): ${text.slice(0, 240) || res.statusText}.${hint}`,
    );
  }

  return (json ?? {}) as T;
}

async function ghlFetch<T>(
  path: string,
  search: Record<string, string | string[] | undefined>,
  cache?: RequestCache,
) {
  return ghlCall<T>(path, { search, cache });
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  if (value.length && Array.isArray(value[0])) {
    return (value as unknown[][]).flat().filter(isRecord);
  }
  return value.filter(isRecord);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function idOf(value: { _id?: string; id?: string } | string | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function listCollectionsByName(locationId: string, name: string, cache?: RequestCache) {
  const rows = await fetchCollections(locationId, name, cache);
  const needle = name.trim().toLowerCase();
  const exact = rows.filter((row) => (row.name || "").trim().toLowerCase() === needle);
  return exact.length
    ? exact
    : rows.filter((row) => (row.name || "").toLowerCase().includes(needle));
}

async function fetchCollections(locationId: string, name: string, cache?: RequestCache) {
  const attempts: Array<"LOCATION" | "location"> = ["LOCATION", "location"];
  let lastError: unknown;
  for (const altType of attempts) {
    try {
      const payload = await ghlFetch<{ data?: unknown; collections?: unknown }>(
        "/products/collections",
        {
          altId: locationId,
          altType,
          name,
          limit: "100",
        },
        cache,
      );
      return asRecords(payload.data ?? payload.collections) as GhlCollection[];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Collection lookup failed.");
}

async function listProducts(
  locationId: string,
  options: {
    productIds?: string[];
    collectionIds?: string[];
  },
  cache?: RequestCache,
) {
  const products: GhlProduct[] = [];
  let offset = 0;
  const limit = 100;

  do {
    const payload = await ghlFetch<{ products?: unknown; total?: unknown }>(
      "/products/",
      {
        locationId,
        limit: String(limit),
        offset: String(offset),
        productIds: options.productIds,
        collectionIds: options.collectionIds?.join(","),
      },
      cache,
    );
    const page = asRecords(payload.products) as GhlProduct[];
    products.push(...page);
    if (page.length < limit) break;
    offset += limit;
  } while (offset < 500);

  return products;
}

async function listInventory(locationId: string, cache?: RequestCache) {
  const attempts: Array<"LOCATION" | "location"> = ["LOCATION", "location"];
  for (const altType of attempts) {
    try {
      const payload = await ghlFetch<{ inventory?: unknown }>(
        "/products/inventory",
        {
          altId: locationId,
          altType,
          limit: "100",
        },
        cache,
      );
      return asRecords(payload.inventory) as GhlInventoryItem[];
    } catch (error) {
      console.warn(
        `[shop/ghl] Inventory list failed (altType=${altType});`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  console.warn("[shop/ghl] Inventory list failed; falling back to price.availableQuantity.");
  return [];
}

async function listPrices(locationId: string, productId: string, cache?: RequestCache) {
  const payload = await ghlFetch<{ prices?: unknown }>(
    `/products/${productId}/price`,
    { locationId, limit: "50" },
    cache,
  );
  return asRecords(payload.prices) as GhlPrice[];
}

function pickPrice(prices: GhlPrice[]) {
  return (
    prices.find((price) => price.type === "one_time") ||
    prices[0] ||
    null
  );
}

function mapProduct(
  product: GhlProduct,
  price: GhlPrice | null,
  inventory: GhlInventoryItem[],
): Product | null {
  const id = idOf(product);
  if (!id || !product.name) return null;

  const priceId = idOf(price || undefined);
  const inventoryRows = inventory.filter((row) => row.product === id);
  const matchingRow =
    inventoryRows.find((row) => idOf(row) === priceId) || inventoryRows[0];

  const trackInventory = Boolean(
    price?.trackInventory || matchingRow?.availableQuantity !== undefined,
  );
  let qty: number | null = null;
  if (trackInventory) {
    const raw =
      matchingRow?.availableQuantity ??
      price?.availableQuantity ??
      (inventoryRows.length
        ? inventoryRows.reduce((sum, row) => sum + (row.availableQuantity || 0), 0)
        : 0);
    qty = Number.isFinite(raw) ? Math.max(0, raw) : 0;
  }

  const description = stripHtml(product.description || "");
  const image = productImageUrl(
    firstHttpUrl(product.image, product.medias, matchingRow?.image),
  );

  return {
    id,
    priceId,
    name: product.name,
    price: Number(price?.amount ?? 0),
    currency: (price?.currency || "GBP").toUpperCase(),
    blurb: description.slice(0, 180) || "From the Chef Lucas pantry.",
    details: description || "Listed from HighLevel Products.",
    image,
    tag: slugTag(product.slug || product.name),
    sku: matchingRow?.sku || price?.sku || "",
    qty,
    trackInventory,
    collectionIds: product.collectionIds || [],
  };
}

export async function getShopCatalogue(options?: { fresh?: boolean }): Promise<ShopCatalogue> {
  const locationId = ghlLocationId();
  const collectionName = ghlCollectionName();
  const allowlist = parseProductIdAllowlist();
  const token = ghlPrivateToken();
  const cache: RequestCache | undefined = options?.fresh ? "no-store" : undefined;

  if (!token) {
    const reason =
      "HighLevel token missing. Set GHL_PRIVATE_API_TOKEN (or GHL_PRIVATE_INTEGRATION_TOKEN) on Vercel.";
    console.warn(`[shop/ghl] ${reason}`);
    return emptyCatalogue("unconfigured", reason, shopFilter());
  }

  try {
    let collectionId = ghlCollectionIdEnv();
    const productIds = allowlist;

    if (productIds.length) {
      console.info(
        `[shop/ghl] Using GHL_PRODUCT_IDS allowlist (${productIds.length} ids). Collection filter skipped.`,
      );
    } else {
      // TODO(Alice): replace name lookup with a stable collection ID when Lois confirms it.
      if (!collectionId) {
        const matches = await listCollectionsByName(locationId, collectionName, cache);
        collectionId = idOf(matches[0]);
        if (!collectionId) {
          const reason = `Collection "${collectionName}" not found on location ${locationId}. Waiting for Alice/Lois product IDs (GHL_PRODUCT_IDS) or GHL_PRODUCT_COLLECTION_ID.`;
          console.warn(`[shop/ghl] ${reason}`);
          return emptyCatalogue("empty", reason, shopFilter());
        }
        console.info(
          `[shop/ghl] Resolved collection "${collectionName}" → ${collectionId}.`,
        );
      }
    }

    const rawProducts = await listProducts(
      locationId,
      {
        productIds: productIds.length ? productIds : undefined,
        collectionIds: productIds.length ? undefined : collectionId ? [collectionId] : undefined,
      },
      cache,
    );

    const filtered = productIds.length
      ? rawProducts.filter((product) => productIds.includes(idOf(product)))
      : rawProducts;

    if (!filtered.length) {
      const reason = productIds.length
        ? "GHL_PRODUCT_IDS set but none of those products were returned by HighLevel."
        : `No products in collection "${collectionName}" (${collectionId || "unresolved"}).`;
      console.warn(`[shop/ghl] ${reason}`);
      return emptyCatalogue("empty", reason, shopFilter({ collectionId, productIds }));
    }

    const [inventory, prices] = await Promise.all([
      listInventory(locationId, cache),
      Promise.all(
        filtered.map(async (product) => {
          const id = idOf(product);
          try {
            return await listPrices(locationId, id, cache);
          } catch (error) {
            console.warn(
              `[shop/ghl] Price list failed for ${id}.`,
              error instanceof Error ? error.message : error,
            );
            return [] as GhlPrice[];
          }
        }),
      ),
    ]);

    const products = filtered
      .map((product, index) => mapProduct(product, pickPrice(prices[index]), inventory))
      .filter((product): product is Product => Boolean(product));

    return {
      products,
      status: products.length ? "ok" : "empty",
      reason: products.length
        ? `Loaded ${products.length} product(s) from HighLevel.`
        : "HighLevel returned products without names/ids.",
      generatedAt: new Date().toISOString(),
      filter: shopFilter({ collectionId, productIds }),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "HighLevel Products request failed.";
    console.error("[shop/ghl]", reason);
    return emptyCatalogue("error", reason, shopFilter());
  }
}

/**
 * Absolute inventory set (not a delta). Marketplace:
 * POST /products/inventory · Version: v3 · scope products/prices.write
 * https://marketplace.gohighlevel.com/docs/ghl/products/update-inventory
 */
export async function updateGhlInventory(
  items: Array<{
    priceId: string;
    availableQuantity: number;
    allowOutOfStockPurchases: boolean;
  }>,
) {
  if (!items.length) {
    return { status: true, message: "No inventory writes." };
  }

  const payload = await ghlCall<{ status?: boolean; message?: string }>(
    "/products/inventory",
    {
      method: "POST",
      version: GHL_INVENTORY_WRITE_VERSION,
      cache: "no-store",
      body: {
        altId: ghlLocationId(),
        altType: "location",
        items,
      },
    },
  );

  if (payload.status === false) {
    throw new Error(payload.message || "HighLevel inventory update was rejected.");
  }

  return payload;
}
