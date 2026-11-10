# Chef Lucas — Michelin-star demo site

Editorial Next.js site for **Chef Lucas Catering Services Ltd**, built as an FKIT demo. It is not a live booking or payments site.

Live photography is pulled from [cheflucas.co.uk](https://cheflucas.co.uk/) and attributed in the footer as a demo.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Framer Motion
- Vercel (production)
- Web Analytics via `@vercel/analytics`; enable in Vercel project → Analytics if needed.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Cinematic hero, Trustpilot strip, services, seasonal plate, book CTA |
| `/services` | Pillars + wildcards (tasting kitchen, sauce club) |
| `/menus` | Seasonal / event menus structured for a later CMS or GHL document |
| `/events` | Gallery storytelling |
| `/book` | Multi-step wizard (wedding, corporate, buffet, private, tasting, custom) |
| `/shop` | Sauce / merch catalogue from HighLevel Products + bag |
| `/shop/checkout` | Demo checkout — **never charges**; does not change stock unless an operator write is explicitly enabled |
| `/about` | Story, brigade, six-step booking |
| `/contact` | Studio details + GHL-shaped form |

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo mode

The gold/black **Demo site — not live bookings** banner stays on until:

1. `NEXT_PUBLIC_DEMO_MODE=false`, and
2. `GHL_WEBHOOK_URL` or `NEXT_PUBLIC_GHL_FORM_URL` is set.

Booking and contact show a success state. If `GHL_WEBHOOK_URL` (or the legacy `NEXT_PUBLIC_GHL_FORM_URL`) is set, those two public enquiry forms POST JSON to HighLevel after validation, same-origin, and rate-limit checks. Stripe keys are read and then ignored — no PaymentIntents are created.

Shop checkout is different. With no extra configuration it is pure demo mode: it may **read** HighLevel stock, then returns a confirmation and performs **no** external write (no inventory update, no shop webhook). Real inventory writes require both `GHL_INVENTORY_WRITES_ENABLED=true` and a server-side operator secret. See [Shop stock](#shop-stock-highlevel-products).

## HighLevel wire-up (managed story)

This site is shaped around the Chef Lucas GHL audit: one messy pipeline with generic opportunity names, a single unsynced calendar, thin contact data, unused documents/payments, and eCommerce as a later chapter.

When you connect the **Chef Lucas** location (not the FKIT agency snapshot), do this:

### 1. Inbound webhook / form

1. In HighLevel, create a workflow triggered by **Inbound Webhook** (or a form).
2. Paste the URL into `GHL_WEBHOOK_URL`.
3. Map the JSON fields below onto Contact + Opportunity.

Payload always includes:

- `contact.firstName` / `lastName` / `email` / `phone` / `companyName`
- snake_case twins (`first_name`, …) for form-style mappings
- `opportunityName`
- `tags` (array + comma string)
- `pipeline` (`FKIT Sales` ids ship as placeholders — swap for the client location)
- `event.type|date|guests|venue|location|dietary|notes` on bookings
- `order.items` + `order.stripe.charged: false` on shop

### 2. Opportunity naming

Stop using generic names. The wizard sends:

```
{Event type} | {D Mon YYYY} | {N}pax | {Last name}
```

Example: `Wedding | 14 Jun 2027 | 120pax | Hartley`

Shop orders: `Shop | aegean+ember | Hartley`

### 3. Tags

Slash taxonomy, matching how FKIT already tags other work:

| Tag | When |
| --- | --- |
| `source/website` | All site leads |
| `source/booking-wizard` | `/book` |
| `source/contact` | `/contact` |
| `source/sauce-shop` | `/shop/checkout` |
| `vertical/catering` | Events |
| `vertical/ecommerce` | Shop |
| `event/wedding` … `event/custom` | Occasion |
| `product/sauce-club` | Shop |
| `stage/new-enquiry` | Always on first capture |
| `demo/mode` | While the demo banner is on |

### 4. Calendars (audit: split the diary)

Create **separate** GHL calendars, sync each to Google Workspace, then set:

```
NEXT_PUBLIC_GHL_CALENDAR_WEDDING=
NEXT_PUBLIC_GHL_CALENDAR_CORPORATE=
NEXT_PUBLIC_GHL_CALENDAR_BUFFET=
NEXT_PUBLIC_GHL_CALENDAR_PRIVATE=
NEXT_PUBLIC_GHL_CALENDAR_TASTING=
NEXT_PUBLIC_GHL_CALENDAR_CUSTOM=
NEXT_PUBLIC_GHL_CALENDAR_EMBED_URL=
```

The booking payload includes `calendarId` for the chosen type. The embed URL renders an iframe on `/book`.

### 5. Pipeline stages

Default mapping (replace IDs with the Chef Lucas pipeline):

`New enquiry` → `Qualified` (the mandatory chat) → `Proposal` → `Won` (20% deposit) → `Lost`

The live six-step service (chat → details → deposit → two-week check-in → event day) should be workflows + documents, not a silent AI reply.

### 6. Stripe later

1. Connect Stripe inside HighLevel Payments.
2. Put the publishable key in `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Use GHL documents/contracts for the booking form and the **20% deposit** invoice from the real process.
4. Shop line items already send the live HighLevel product `_id` as `ghlProductId`. Do not hard-code SKUs.

Do **not** take live card details through this demo.

## Shop stock (HighLevel Products)

`/shop` no longer uses a hard-coded SKU list. Name, price, and quantity come from the HighLevel Products API for the FKIT location. Checkout stays **demo-mode** (nothing is charged).

### How Lois / Lucas update stock

1. In HighLevel: **Payments → Products** (FKIT location).
2. Edit the product in the **Chef Lucas Demo** collection (or the collection named in `GHL_PRODUCT_COLLECTION`).
3. Change **Available quantity** on the price / inventory row.
4. Reload [cheflucas.vercel.app/shop](https://cheflucas.vercel.app/shop). Stock badges refresh within about a minute — **no Next.js deploy**.

Badges: **Sold out** (charcoal outline, stone text) when qty is 0; **Low stock** (soft gold label) when 0 < qty < 10; in-stock is a tiny stone label. Add to bag is hidden when sold out. Product photos come from HighLevel product media URLs — never local `/images/shop-*.png`. Missing media shows a cream placeholder.

If the collection is empty or env is missing, `/shop` shows a quiet empty pantry instead of fake bottles.

### Vercel env vars (Production)

| Name | Required | Notes |
| --- | --- | --- |
| `GHL_LOCATION_ID` | yes | FKIT sub-account. Example: `zpGOdJ2JYNkKfMpcko5l` |
| `GHL_PRIVATE_API_TOKEN` | yes* | Private Integration Token. Scopes: `products.readonly`, `products/collection.readonly`, `products/prices.readonly`. Add **`products/prices.write`** only if an operator will update stock |
| `GHL_PRIVATE_INTEGRATION_TOKEN` | yes* | Alias accepted if `GHL_PRIVATE_API_TOKEN` is unset |
| `GHL_INVENTORY_WRITES_ENABLED` | no | Default **off**. Must be exactly `true` before any inventory write is attempted |
| `SHOP_OPERATOR_SECRET` | no | Server-only operator secret. No default. Never `NEXT_PUBLIC_` |
| `GHL_PRODUCT_COLLECTION` | no | Defaults to `Chef Lucas Demo` |
| `GHL_PRODUCT_COLLECTION_ID` | no | Optional stable ID once known |
| `GHL_PRODUCT_IDS` | no | Comma-separated allowlist. **TODO(Alice): ping with product IDs.** Leave empty until then — do not invent IDs |

\*Set **one** of the two token names. Never commit the value.

Server route: `GET /api/shop/products` (cached ~60s, read only). An operator checkout that actually writes calls `revalidateTag('ghl-shop')` + `revalidatePath('/shop')` so badges can refresh. A public demo checkout does not.

### Demo checkout does not write stock

`POST /api/shop/checkout` does **not** create a PaymentIntent. By default it:

1. Rejects cross-origin requests, non-JSON bodies, and invalid quantities before calling HighLevel.
2. Reads live qty from HighLevel (uncached) for products already in the Chef Lucas Demo collection / `GHL_PRODUCT_IDS` allowlist.
3. Rejects sold-out (`qty === 0`) or insufficient qty with **409**.
4. Returns a demo confirmation. **Nothing is written** — not inventory, and not the shop webhook.
5. Copy on the site says this is a demo, nothing is charged, and it is not a live order.

A HighLevel inventory write happens only when **both** are true:

- `GHL_INVENTORY_WRITES_ENABLED` is exactly `true` (anything else, including unset, stays off).
- The caller is an FKIT operator: `Authorization: Bearer <SHOP_OPERATOR_SECRET>`, or the httpOnly `fkit_operator` cookie from `POST /api/shop/operator/session` (sign in at `/shop/operator`). The secret is compared in constant time. There is no default secret and it must not be a `NEXT_PUBLIC_` variable.

On that path the write is still the absolute set Lois confirmed: `POST https://services.leadconnectorhq.com/products/inventory` with **Version: v3**. `availableQuantity` is `floor(max(0, current − cartQty))`, keyed by the catalogue **`priceId`** (client-supplied price ids are ignored). The shop webhook is forwarded only on this same authorized path.

Body (Lois / marketplace confirmed):

```json
{
  "altId": "zpGOdJ2JYNkKfMpcko5l",
  "altType": "location",
  "items": [
    { "priceId": "<priceId>", "availableQuantity": 14, "allowOutOfStockPurchases": false }
  ]
}
```

Docs: [Update Inventory](https://marketplace.gohighlevel.com/docs/ghl/products/update-inventory). Scope: **`products/prices.write`** plus the existing readonly product scopes.

Public `/book` and `/contact` still forward enquiries when a webhook URL is set. They require same-origin JSON, field validation, and a per-IP rate limit. They do not write inventory. Stripe remains unused.

**Ben — token scope (only if an operator write will be turned on):**

1. HighLevel → Settings → Private Integrations (FKIT location `zpGOdJ2JYNkKfMpcko5l`).
2. Edit the token used as `GHL_PRIVATE_API_TOKEN` and enable **`products/prices.write`**.
3. Set `SHOP_OPERATOR_SECRET` and `GHL_INVENTORY_WRITES_ENABLED=true` in the server environment. Do not put the secret in a `NEXT_PUBLIC_` variable.
4. Redeploy only when you intend writes to go live. Until the flag is exactly `true`, checkout cannot change stock.

### How to test

Automated (no network, no HighLevel writes):

```bash
npm test
```

`src/lib/security.test.ts` covers unauthenticated checkout (no write), cross-origin rejection, bad payloads, and the authorized + `GHL_INVENTORY_WRITES_ENABLED=true` path. `commitGhlInventory` itself refuses to call HighLevel unless that same gate passes, and it does not return upstream bodies or the token.

Manual, against a local server (`npm run dev`):

```bash
# Unauthenticated — demo confirmation, no inventory write
curl -sS -D - http://localhost:3000/api/shop/checkout \
  -H 'content-type: application/json' \
  -H 'origin: http://localhost:3000' \
  --data '{"contact":{"firstName":"Ada","lastName":"Hartley","email":"ada@example.com","phone":"07700900123"},"items":[{"id":"ember-id","quantity":1}]}'

# Cross-origin — 403, no write
curl -sS -D - http://localhost:3000/api/shop/checkout \
  -H 'content-type: application/json' \
  -H 'origin: https://evil.example' \
  --data '{"contact":{"firstName":"Ada","lastName":"Hartley","email":"ada@example.com","phone":"07700900123"},"items":[{"id":"ember-id","quantity":1}]}'

# Bad quantity — 400, no write
curl -sS -D - http://localhost:3000/api/shop/checkout \
  -H 'content-type: application/json' \
  -H 'origin: http://localhost:3000' \
  --data '{"contact":{"firstName":"Ada","lastName":"Hartley","email":"ada@example.com","phone":"07700900123"},"items":[{"id":"ember-id","quantity":2.5}]}'
```

An authorized write also needs the flag on and `Authorization: Bearer <SHOP_OPERATOR_SECRET>` (or a session from `/shop/operator`). House mustard (qty 0) stays **Sold out**; a checkout that includes it is rejected (409) and must not decrement anything. Success copy for a public checkout says nothing was charged and this is not a live order. HighLevel error pages and the private token are not returned to the browser.

## Deploy

Production (preferred for FKIT demos):

```bash
npx vercel --prod --yes
```

Set the env vars in the Vercel project (Production environment). Preview is fine for QA; Ben usually wants the production URL for client walkthroughs.

## Footer

Subtle **Powered by FKIT** → [fk-it.co.uk](https://fk-it.co.uk). Copy also states this is a demo site.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
