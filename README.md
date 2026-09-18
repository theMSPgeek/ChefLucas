# Chef Lucas — Michelin-star demo site

Editorial Next.js site for **Chef Lucas Catering Services Ltd**, built as an FKIT demo. It is not a live booking or payments site.

Live photography is pulled from [cheflucas.co.uk](https://cheflucas.co.uk/) and attributed in the footer as a demo.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Framer Motion
- Vercel (production)

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Cinematic hero, Trustpilot strip, services, seasonal plate, book CTA |
| `/services` | Pillars + wildcards (tasting kitchen, sauce club) |
| `/menus` | Seasonal / event menus structured for a later CMS or GHL document |
| `/events` | Gallery storytelling |
| `/book` | Multi-step wizard (wedding, corporate, buffet, private, tasting, custom) |
| `/shop` | Sauce / merch catalogue from HighLevel Products + bag |
| `/shop/checkout` | Checkout stub — **never charges** |
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

Booking, contact, and shop checkout always show a success state. If a webhook is configured they also POST JSON to HighLevel. Stripe keys are read and then ignored — no PaymentIntents are created.

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

Badges: **Sold out** when qty is 0; **Low stock** when 0 < qty < 10. Add to bag is hidden when sold out.

If the collection is empty or env is missing, `/shop` shows a quiet empty pantry instead of fake bottles.

### Vercel env vars (Production)

| Name | Required | Notes |
| --- | --- | --- |
| `GHL_LOCATION_ID` | yes | FKIT sub-account. Example: `zpGOdJ2JYNkKfMpcko5l` |
| `GHL_PRIVATE_API_TOKEN` | yes* | Private Integration Token. Scopes: `products.readonly`, `products/collection.readonly`, `products/prices.readonly` |
| `GHL_PRIVATE_INTEGRATION_TOKEN` | yes* | Alias accepted if `GHL_PRIVATE_API_TOKEN` is unset |
| `GHL_PRODUCT_COLLECTION` | no | Defaults to `Chef Lucas Demo` |
| `GHL_PRODUCT_COLLECTION_ID` | no | Optional stable ID once known |
| `GHL_PRODUCT_IDS` | no | Comma-separated allowlist. **TODO(Alice): ping with product IDs.** Leave empty until then — do not invent IDs |

\*Set **one** of the two token names. Never commit the value.

Server route: `GET /api/shop/products` (cached ~60s).

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
