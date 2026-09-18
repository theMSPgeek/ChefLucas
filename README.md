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
| `/shop` | Demo sauce / merch catalogue + bag |
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
4. Map sauce-club SKUs with `GHL_PRODUCT_*` env vars. Checkout already sends those IDs when present.

Do **not** take live card details through this demo.

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
