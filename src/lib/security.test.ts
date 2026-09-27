import assert from "node:assert/strict";
import test from "node:test";
import { handleShopCheckout } from "./checkout-handler.ts";
import { commitGhlInventory } from "./ghl-inventory-write.ts";
import type { GhlLeadPayload } from "./ghl.ts";
import type { Product, ShopCatalogue } from "./products.ts";
import { handleBookingEnquiry, handleContactEnquiry } from "./public-enquiry.ts";
import { isSameOriginRequest, resetRateLimits } from "./request-guards.ts";
import { timingSafeStringEqual } from "./secrets.ts";
import {
  issueOperatorSession,
  inventoryWritePermitted,
  inventoryWritesEnabled,
  OPERATOR_COOKIE,
  operatorSecretMatches,
  verifyOperatorSession,
} from "./shop-auth.ts";
import type { InventoryWriteItem } from "./shop-inventory.ts";

const TOKEN = "super-secret-token";
const OPERATOR_SECRET = "operator-secret-value";

function product(): Product {
  return {
    id: "ember-id",
    priceId: "ember-price",
    name: "Ember burger glaze",
    price: 8,
    currency: "GBP",
    blurb: "",
    details: "",
    image: "",
    tag: "product/ember",
    sku: "EMBER",
    qty: 15,
    trackInventory: true,
    collectionIds: ["chef-lucas-demo"],
  };
}

function catalogue(overrides: Partial<ShopCatalogue> = {}): ShopCatalogue {
  return {
    products: [product()],
    status: "ok",
    reason: `internal ${TOKEN}`,
    generatedAt: "2026-09-27T00:00:00.000Z",
    filter: {
      locationId: "zpGOdJ2JYNkKfMpcko5l",
      collectionName: "Chef Lucas Demo",
      collectionId: "collection-id",
      productIds: [],
    },
    ...overrides,
  };
}

function validCheckout() {
  return {
    contact: {
      firstName: "Ada",
      lastName: "Hartley",
      email: "ada@example.com",
      phone: "07700900123",
    },
    items: [{ id: "ember-id", quantity: 2, priceId: "forged-price", price: 1 }],
  };
}

function checkoutRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/shop/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function withEnv(vars: Record<string, string | undefined>) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("constant-time compare matches equal strings and rejects others", () => {
  assert.equal(timingSafeStringEqual("operator-secret-value", "operator-secret-value"), true);
  assert.equal(timingSafeStringEqual("operator-secret-value", "operator-secret-valuE"), false);
  assert.equal(timingSafeStringEqual("short", "operator-secret-value"), false);
});

test("inventory writes are off unless the flag is exactly true and the caller is authorized", () => {
  const restore = withEnv({ GHL_INVENTORY_WRITES_ENABLED: undefined });
  try {
    assert.equal(inventoryWritesEnabled(), false);
    assert.equal(inventoryWritePermitted(true), false);
  } finally {
    restore();
  }

  const enabled = withEnv({ GHL_INVENTORY_WRITES_ENABLED: "TRUE" });
  try {
    assert.equal(inventoryWritesEnabled(), false);
  } finally {
    enabled();
  }

  const on = withEnv({ GHL_INVENTORY_WRITES_ENABLED: "true" });
  try {
    assert.equal(inventoryWritePermitted(false), false);
    assert.equal(inventoryWritePermitted(true), true);
  } finally {
    on();
  }
});

test("operator secret compare fails closed when unset", () => {
  const restore = withEnv({ SHOP_OPERATOR_SECRET: undefined });
  try {
    assert.equal(operatorSecretMatches(OPERATOR_SECRET), false);
    assert.equal(issueOperatorSession(), null);
  } finally {
    restore();
  }
});

test("signed operator session rejects tampering and expiry", () => {
  const restore = withEnv({ SHOP_OPERATOR_SECRET: OPERATOR_SECRET });
  try {
    const token = issueOperatorSession(1_700_000_000_000);
    assert.ok(token);
    assert.equal(verifyOperatorSession(token!, 1_700_000_000_000), true);
    const [payload, signature] = token!.split(".");
    assert.equal(verifyOperatorSession(`${payload}x.${signature}`, 1_700_000_000_000), false);
    assert.equal(verifyOperatorSession(token!, 1_700_000_000_000 + 9 * 60 * 60 * 1000), false);
  } finally {
    restore();
  }
});

test("cross-origin is decided from the request URL, not a spoofed host", () => {
  const evil = new Request("http://localhost:3000/api/shop/checkout", {
    method: "POST",
    headers: {
      origin: "https://evil.example",
      host: "evil.example",
      "x-forwarded-host": "evil.example",
    },
  });
  assert.equal(isSameOriginRequest(evil), false);

  const same = new Request("http://localhost:3000/api/shop/checkout", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
  assert.equal(isSameOriginRequest(same), true);

  const browserCrossSite = new Request("http://localhost:3000/api/shop/checkout", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "sec-fetch-site": "cross-site",
    },
  });
  assert.equal(isSameOriginRequest(browserCrossSite), false);
});

test("unauthenticated checkout performs no external write", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  let leads = 0;
  try {
    const response = await handleShopCheckout(checkoutRequest(validCheckout()), {
      getCatalogue: async () => catalogue(),
      writeInventory: async () => {
        writes += 1;
      },
      forwardLead: async () => {
        leads += 1;
        return { forwarded: true, demo: false };
      },
      revalidateShop: () => {},
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(writes, 0);
    assert.equal(leads, 0);
    assert.equal(body.inventoryUpdated, false);
    assert.equal(body.liveOrder, false);
    assert.equal(body.charged, false);
    assert.match(body.message, /not a live order/i);
    assert.equal(JSON.stringify(body).includes(TOKEN), false);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("default env (writes flag unset) performs no external write", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: undefined,
    SHOP_OPERATOR_SECRET: undefined,
  });
  let writes = 0;
  const deps = {
    getCatalogue: async () => catalogue(),
    writeInventory: async () => {
      writes += 1;
    },
    forwardLead: async () => {
      throw new Error("lead should not be forwarded");
    },
    revalidateShop: () => {
      throw new Error("shop should not be revalidated");
    },
  };
  try {
    const anonymous = await handleShopCheckout(
      checkoutRequest(validCheckout(), { "x-forwarded-for": "10.1.1.1" }),
      deps,
    );
    assert.equal(anonymous.status, 200);
    const anonymousBody = await anonymous.json();
    assert.equal(anonymousBody.liveOrder, false);
    assert.equal(anonymousBody.forwarded, false);
    assert.equal(anonymousBody.inventoryUpdated, false);

    const bearerWithoutSecret = await handleShopCheckout(
      checkoutRequest(validCheckout(), {
        authorization: `Bearer ${OPERATOR_SECRET}`,
        "x-forwarded-for": "10.1.1.2",
      }),
      deps,
    );
    assert.equal(bearerWithoutSecret.status, 401);
    assert.equal(writes, 0);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("cross-origin checkout is rejected and does not write", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  let reads = 0;
  try {
    const response = await handleShopCheckout(
      checkoutRequest(validCheckout(), {
        origin: "https://evil.example",
        authorization: `Bearer ${OPERATOR_SECRET}`,
        "x-forwarded-host": "evil.example",
      }),
      {
        getCatalogue: async () => {
          reads += 1;
          return catalogue();
        },
        writeInventory: async () => {
          writes += 1;
        },
        forwardLead: async () => {
          writes += 1;
          return { forwarded: true, demo: false };
        },
        revalidateShop: () => {},
      },
    );
    assert.equal(response.status, 403);
    assert.equal(writes, 0);
    assert.equal(reads, 0);
    const body = await response.json();
    assert.match(body.error, /cross-origin/i);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("bad checkout payloads are rejected before any catalogue read or write", async () => {
  resetRateLimits();
  const cases: unknown[] = [
    { contact: { firstName: "Ada" }, items: [{ id: "ember-id", quantity: 1 }] },
    { ...validCheckout(), items: [{ id: "ember-id", quantity: 0 }] },
    { ...validCheckout(), items: [{ id: "ember-id", quantity: 2.5 }] },
    { ...validCheckout(), items: [{ id: "ember-id", quantity: 100 }] },
    { ...validCheckout(), items: [{ id: "../not-a-product", quantity: 1 }] },
    { ...validCheckout(), items: [] },
  ];
  for (const [index, body] of cases.entries()) {
    let reads = 0;
    let writes = 0;
    const response = await handleShopCheckout(
      checkoutRequest(body, { "x-forwarded-for": `10.0.0.${index}` }),
      {
        getCatalogue: async () => {
          reads += 1;
          return catalogue();
        },
        writeInventory: async () => {
          writes += 1;
        },
        forwardLead: async () => ({ forwarded: true, demo: false }),
        revalidateShop: () => {},
      },
    );
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(reads, 0);
    assert.equal(writes, 0);
  }
  resetRateLimits();
});

test("unknown product and upstream errors do not write or leak internals", async () => {
  resetRateLimits();
  let writes = 0;
  const unknown = await handleShopCheckout(
    checkoutRequest({
      ...validCheckout(),
      items: [{ id: "not-in-the-demo-collection", quantity: 1 }],
    }),
    {
      getCatalogue: async () => catalogue(),
      writeInventory: async () => {
        writes += 1;
      },
      forwardLead: async () => ({ forwarded: true, demo: false }),
      revalidateShop: () => {},
    },
  );
  assert.equal(unknown.status, 400);
  assert.equal(writes, 0);

  const broken = await handleShopCheckout(
    checkoutRequest(validCheckout(), { "x-forwarded-for": "10.9.9.9" }),
    {
      getCatalogue: async () => catalogue({ status: "error", products: [] }),
      writeInventory: async () => {
        writes += 1;
      },
      forwardLead: async () => ({ forwarded: true, demo: false }),
      revalidateShop: () => {},
    },
  );
  const brokenBody = await broken.json();
  assert.equal(broken.status, 502);
  assert.equal(writes, 0);
  assert.equal(JSON.stringify(brokenBody).includes(TOKEN), false);
  assert.equal(JSON.stringify(brokenBody).includes("GHL_PRIVATE"), false);
  resetRateLimits();
});

test("a valid operator secret still does not write when the flag is off", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "false",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  try {
    const response = await handleShopCheckout(
      checkoutRequest(validCheckout(), { authorization: `Bearer ${OPERATOR_SECRET}` }),
      {
        getCatalogue: async () => catalogue(),
        writeInventory: async () => {
          writes += 1;
        },
        forwardLead: async () => {
          throw new Error("lead should not be forwarded");
        },
        revalidateShop: () => {},
      },
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(writes, 0);
    assert.equal(body.liveOrder, false);
    assert.match(body.message, /turned off/i);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("authorized and enabled checkout writes the absolute catalogue quantity", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  const writes: InventoryWriteItem[] = [];
  let leads = 0;
  let revalidated = 0;
  try {
    const response = await handleShopCheckout(
      checkoutRequest(validCheckout(), { authorization: `Bearer ${OPERATOR_SECRET}` }),
      {
        getCatalogue: async () => catalogue(),
        writeInventory: async (items) => {
          writes.push(...items);
        },
        forwardLead: async (payload: GhlLeadPayload) => {
          leads += 1;
          assert.equal(payload.order && (payload.order as { stripe?: { charged?: boolean } }).stripe?.charged, false);
          return { forwarded: true, demo: true };
        },
        revalidateShop: () => {
          revalidated += 1;
        },
      },
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(leads, 1);
    assert.equal(revalidated, 1);
    assert.equal(body.liveOrder, true);
    assert.equal(body.inventoryUpdated, true);
    assert.equal(body.charged, false);
    assert.deepEqual(writes, [
      { priceId: "ember-price", availableQuantity: 13, allowOutOfStockPurchases: false },
    ]);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("a valid operator cookie can authorize the enabled write path", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  try {
    const token = issueOperatorSession();
    assert.ok(token);
    const response = await handleShopCheckout(
      checkoutRequest(validCheckout(), { cookie: `${OPERATOR_COOKIE}=${token}` }),
      {
        getCatalogue: async () => catalogue(),
        writeInventory: async () => {
          writes += 1;
        },
        forwardLead: async () => ({ forwarded: true, demo: true }),
        revalidateShop: () => {},
      },
    );
    assert.equal(response.status, 200);
    assert.equal(writes, 1);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("a wrong operator secret does not write", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  let reads = 0;
  try {
    const response = await handleShopCheckout(
      checkoutRequest(validCheckout(), { authorization: "Bearer not-the-secret" }),
      {
        getCatalogue: async () => {
          reads += 1;
          return catalogue();
        },
        writeInventory: async () => {
          writes += 1;
        },
        forwardLead: async () => ({ forwarded: true, demo: false }),
        revalidateShop: () => {},
      },
    );
    assert.equal(response.status, 401);
    assert.equal(writes, 0);
    assert.equal(reads, 0);
  } finally {
    restore();
    resetRateLimits();
  }
});

test("commitGhlInventory does not call HighLevel unless enabled and authorized", async () => {
  const item = { priceId: "ember-price", availableQuantity: 13, allowOutOfStockPurchases: false as const };
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push(`${(init as RequestInit | undefined)?.method || "GET"} ${String(input)}`);
    return new Response(JSON.stringify({ status: true }), { status: 200 });
  };

  const off = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: undefined,
    GHL_PRIVATE_API_TOKEN: TOKEN,
  });
  await assert.rejects(() => commitGhlInventory([item], true, fetchImpl));
  off();
  assert.equal(calls.length, 0);

  const on = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    GHL_PRIVATE_API_TOKEN: TOKEN,
    GHL_LOCATION_ID: "zpGOdJ2JYNkKfMpcko5l",
  });
  await assert.rejects(() => commitGhlInventory([item], false, fetchImpl));
  assert.equal(calls.length, 0);

  const response = await commitGhlInventory(
    [{ ...item, allowOutOfStockPurchases: true }],
    true,
    async (input, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), `Bearer ${TOKEN}`);
      assert.equal(headers.get("version"), "v3");
      assert.equal(init?.method, "POST");
      assert.equal(String(input), "https://services.leadconnectorhq.com/products/inventory");
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.altId, "zpGOdJ2JYNkKfMpcko5l");
      assert.equal(payload.altType, "location");
      assert.deepEqual(payload.items, [
        { priceId: "ember-price", availableQuantity: 13, allowOutOfStockPurchases: false },
      ]);
      calls.push("posted");
      return new Response(JSON.stringify({ status: true }), { status: 200 });
    },
  );
  assert.equal(response.status, true);
  assert.deepEqual(calls, ["posted"]);
  on();
});

test("HighLevel failures do not echo the token or response body", async () => {
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    GHL_PRIVATE_API_TOKEN: TOKEN,
  });
  const logs: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    logs.push(args.map((part) => String(part)).join(" "));
  };
  try {
    await assert.rejects(
      () =>
        commitGhlInventory(
          [{ priceId: "ember-price", availableQuantity: 13 }],
          true,
          async () => new Response(`nope ${TOKEN} products/prices.write`, { status: 401 }),
        ),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message.includes(TOKEN), false);
        assert.equal(error.message.includes("products/prices.write"), false);
        assert.equal(error.message, "Could not update inventory.");
        return true;
      },
    );
    assert.equal(logs.join("\n").includes(TOKEN), false);
  } finally {
    console.error = original;
    restore();
  }
});

test("public contact enquiry stays same-origin and still forwards when valid", async () => {
  resetRateLimits();
  let forwarded = 0;
  const cross = await handleContactEnquiry(
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      body: JSON.stringify({
        firstName: "Ada",
        lastName: "Hartley",
        email: "ada@example.com",
        phone: "07700900123",
        notes: "A wedding in June.",
      }),
    }),
    async () => {
      forwarded += 1;
      return { demo: true, forwarded: true };
    },
  );
  assert.equal(cross.status, 403);
  assert.equal(forwarded, 0);

  const bad = await handleContactEnquiry(
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.2.2.2",
      },
      body: JSON.stringify({
        firstName: "Ada",
        lastName: "Hartley",
        email: "not-an-email",
        phone: "07700900123",
        notes: "Hello",
      }),
    }),
    async () => {
      forwarded += 1;
      return { demo: true, forwarded: true };
    },
  );
  assert.equal(bad.status, 400);
  assert.equal(forwarded, 0);

  const ok = await handleContactEnquiry(
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.2.2.3",
      },
      body: JSON.stringify({
        firstName: "Ada",
        lastName: "Hartley",
        email: "ada@example.com",
        phone: "07700900123",
        notes: "Can you cook for a Thursday tasting?",
      }),
    }),
    async (payload) => {
      forwarded += 1;
      assert.equal(payload.form, "contact");
      assert.equal(payload.contact.email, "ada@example.com");
      return { demo: true, forwarded: true };
    },
  );
  const body = await ok.json();
  assert.equal(ok.status, 200);
  assert.equal(forwarded, 1);
  assert.equal(body.forwarded, true);
  resetRateLimits();
});

test("public booking enquiry validates before forwarding", async () => {
  resetRateLimits();
  let forwarded = 0;
  const missing = await handleBookingEnquiry(
    new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.4.4.4",
      },
      body: JSON.stringify({
        eventType: "wedding",
        firstName: "Ada",
        lastName: "Hartley",
        email: "ada@example.com",
        phone: "07700900123",
      }),
    }),
    async () => {
      forwarded += 1;
      return { demo: true, forwarded: true };
    },
  );
  assert.equal(missing.status, 400);
  assert.equal(forwarded, 0);

  const ok = await handleBookingEnquiry(
    new Request("http://localhost:3000/api/book", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.4.4.5",
      },
      body: JSON.stringify({
        eventType: "wedding",
        eventDate: "2027-06-14",
        guestCount: "80",
        firstName: "Ada",
        lastName: "Hartley",
        email: "ada@example.com",
        phone: "07700900123",
        venue: "The barn",
        notes: "Outdoor if dry.",
      }),
    }),
    async (payload) => {
      forwarded += 1;
      assert.equal(payload.form, "booking-wizard");
      assert.equal(payload.event && (payload.event as { type?: string }).type, "wedding");
      return { demo: true, forwarded: true };
    },
  );
  assert.equal(ok.status, 200);
  assert.equal(forwarded, 1);
  resetRateLimits();
});

test("checkout rate limit trips before another write", async () => {
  resetRateLimits();
  const restore = withEnv({
    GHL_INVENTORY_WRITES_ENABLED: "true",
    SHOP_OPERATOR_SECRET: OPERATOR_SECRET,
  });
  let writes = 0;
  try {
    const deps = {
      getCatalogue: async () => catalogue(),
      writeInventory: async () => {
        writes += 1;
      },
      forwardLead: async () => ({ forwarded: true, demo: true }),
      revalidateShop: () => {},
    };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await handleShopCheckout(
        checkoutRequest(validCheckout(), {
          authorization: `Bearer ${OPERATOR_SECRET}`,
          "x-forwarded-for": "10.8.8.8",
        }),
        deps,
      );
      assert.equal(response.status, 200);
    }
    const blocked = await handleShopCheckout(
      checkoutRequest(validCheckout(), {
        authorization: `Bearer ${OPERATOR_SECRET}`,
        "x-forwarded-for": "10.8.8.8",
      }),
      deps,
    );
    assert.equal(blocked.status, 429);
    assert.equal(writes, 10);
  } finally {
    restore();
    resetRateLimits();
  }
});
