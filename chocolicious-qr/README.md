# Chocolicious QR Ordering

Self-service QR menu and order flow for **Chocolicious Davangere**.
Customers scan one QR code, browse the menu, place an order (temporary
demo checkout, no payment yet), and get a token. The owner's dashboard
shows real incoming orders from the same database and can mark them
ready with one tap, announcing the token out loud.

## Stack

- **Frontend:** React + Vite (JavaScript), plain CSS, React Router
- **Backend:** Python + Flask, Flask-SQLAlchemy
- **Database:** SQLite (`backend/database/chocolicious.db`)

## How it's connected

```text
React customer UI  ──POST /api/orders──▶  Flask  ──▶  SQLite (source of truth)
React owner UI     ◀──GET /api/owner/*──  Flask  ◀──  SQLite
```

The owner dashboard never talks to the customer UI directly - it only
ever reads what's in the database, via the API, on a short poll (every
7 seconds) plus an immediate refresh right after marking an order
ready.

## Folder structure

```text
chocolicious-qr/
├── backend/
│   ├── .env.example     # Razorpay key names - copy to .env and fill in
│   ├── app/
│   │   ├── models/
│   │   │   ├── category.py, product.py, product_variant.py   # the menu
│   │   │   ├── order.py, order_item.py                        # real orders
│   │   │   └── payment_intent.py                               # bridges Razorpay create → verify
│   │   ├── routes/
│   │   │   ├── menu.py         # GET /api/menu, /api/categories, /api/products
│   │   │   ├── orders.py       # POST /api/orders (gated - see Razorpay section below)
│   │   │   ├── owner.py        # GET/PATCH /api/owner/orders, /api/owner/stats
│   │   │   ├── owner_menu.py   # GET/POST/PATCH /api/owner/menu (Menu Management)
│   │   │   ├── uploads.py      # GET /api/uploads/:filename
│   │   │   └── payments.py     # POST /api/payments/create, /api/payments/verify
│   │   ├── services/
│   │   │   ├── seed_data.py, seed.py     # menu content + loader
│   │   │   ├── order_service.py          # order pricing, tokens, validation
│   │   │   ├── menu_admin_service.py     # menu CRUD, image upload
│   │   │   └── payment_service.py        # Razorpay order creation + signature verification
│   │   ├── static/uploads/  # uploaded product images (gitignored)
│   │   └── __init__.py      # Flask app factory
│   ├── database/           # chocolicious.db lives here (gitignored)
│   ├── init_db.py          # create tables + seed the menu
│   ├── run.py               # dev server entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # routes: "/" → Menu, "/owner" → OwnerDashboard
│   │   ├── components/       # CategoryNav, CategorySection, ProductRow,
│   │   │                     # ProductImage, QuantityControl, CartBar,
│   │   │                     # OrderSummary, OrderTypeSelect, OrderConfirmation,
│   │   │                     # DrizzleDivider (signature visual motif)
│   │   │   └── owner/        # DashboardHeader, StatsCards, OrderList,
│   │   │                     # OwnerOrderCard, OrderDetailSheet, OrderTypeBadge,
│   │   │                     # RecentlyReady, MenuManagement, ProductForm
│   │   ├── pages/
│   │   │   ├── Menu.jsx       # the whole customer screen
│   │   │   └── owner/
│   │   │       ├── OwnerDashboard.jsx   # Orders / Menu tab switcher
│   │   │       └── owner.css  # owner-only styles, scoped away from App.css
│   │   ├── context/          # CartContext (customer), OrderContext (owner)
│   │   ├── services/
│   │   │   ├── api.js               # customer menu fetch + placeOrder()
│   │   │   ├── orderService.js      # owner dashboard's calls to /api/owner/orders
│   │   │   ├── menuAdminService.js  # owner dashboard's calls to /api/owner/menu
│   │   │   └── orderConstants.js    # shared ORDER_TYPES / ORDER_STATUSES
│   │   └── utils/             # formatPrice.js, tokenCaller.js
│   └── vite.config.js        # proxies /api → http://localhost:5000
└── README.md
```

## 1. Install dependencies

**Backend**

```bash
cd backend
pip install -r requirements.txt
```

**Frontend**

```bash
cd frontend
npm install
```

No new dependencies were needed for this update beyond `react-router-dom`
(already in `package.json`).

## 2. Initialize / update the database

```bash
cd backend
python init_db.py
```

This is safe to re-run at any point:

- It always creates the `orders` and `order_items` tables if they don't
  exist yet (via `db.create_all()`, which never touches tables that
  already have data).
- It **wipes and re-seeds** `categories`, `products`, and
  `product_variants` from `seed_data.py` every time - same as before.
- It does **not** delete existing `orders` / `order_items` - real order
  history survives a menu reseed.

**One caveat worth knowing:** re-seeding the menu recreates products
with fresh auto-incrementing IDs, so an old order's stored
`product_id` may no longer point at the same product afterwards. This
doesn't break anything visible - every order item stores its own
`product_name`, `variant_name`, and `unit_price` at the moment it was
ordered, so historical orders remain fully accurate to display. Only
the `product_id` cross-reference itself goes stale.

## 3. Run the backend

```bash
cd backend
python run.py
```

Runs on **http://localhost:5000**. Check it's alive:
`http://localhost:5000/api/health`

## 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Runs on **http://localhost:5173**.

## 5. URLs to open

- **Customer menu:** http://localhost:5173/
- **Owner dashboard:** http://localhost:5173/owner
- API health check: http://localhost:5000/api/health

The owner URL is not linked anywhere in the customer UI - reachable
only by visiting it directly (no auth yet, see "What's not here yet").

---

## The connected order flow

### Customer side

```text
MENU → +/− quantities → SUMMARY → DINE IN / PARCEL → PLACE ORDER → TOKEN SCREEN
```

Still no login, registration, name, phone number, table number, or
address at any point. After picking quantities, the order summary
sheet now also asks Dine In or Parcel, and "Place Order" sends the
cart to the backend. On success, the screen switches to a full-page
confirmation showing the token number; "Order Again" returns to
browsing.

**`PLACE ORDER` is a temporary stand-in for payment.** There is no
Razorpay integration yet - clicking it immediately creates a real,
saved order. This exists purely so the connected system (customer →
database → owner) can be tested and demonstrated. It will be replaced
by a payment step in a later phase (see below).

### Owner side

The dashboard is deliberately minimal, matching how a small
self-service shop actually works - the owner is already preparing food
in real life, so the app doesn't ask them to separately confirm
"started preparing." There are only two states:

```text
ACTIVE  →  (owner taps "Ready & Call Token 🔊")  →  READY
```

- **Current Orders** shows every `ACTIVE` order as a card: token,
  Dine In/Parcel badge, items, total, time.
- One button per card: **Ready & Call Token 🔊**. Tapping it:
  1. Calls the backend (`PATCH /api/owner/orders/:id/ready`) first.
  2. Only once that succeeds, speaks "Token N, your order is ready"
     via the browser's speech synthesis where supported, and always
     shows a visual "✓ Token N Called" confirmation either way.
  3. Moves the order out of Current Orders into a small optional
     **Recently Ready** list (session-only, capped at 5).
- **Today's Orders** / **Today's Sales** are computed from real
  `orders` rows created today - `0` / `₹0` on a fresh database, and
  they only grow when a real order is placed.
- The dashboard polls the backend every 7 seconds, plus refreshes
  immediately after marking an order ready.

### Database schema added

**`orders`**: `id`, `token_number` (unique, sequential), `order_type`
(`DINE_IN` / `PARCEL`), `status` (`ACTIVE` / `READY`), `total_amount`,
`created_at`, `ready_at`.

**`order_items`**: `id`, `order_id`, `product_id` / `variant_id`
(nullable, for traceability only - see the reseeding caveat above),
`product_name`, `variant_name`, `quantity`, `unit_price`, `line_total`
- the last four are a snapshot taken at order time, not a live lookup.

### API endpoints added

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/orders` | Customer places an order. Body: `{ order_type, items: [{product_id, variant_id, quantity}] }`. Prices/totals are always computed server-side from the database - anything price-like in the request is ignored. |
| `GET` | `/api/owner/orders` | Active (`ACTIVE`) orders, oldest first. |
| `GET` | `/api/owner/stats` | `{ orders_today, sales_today }` from real orders created today. |
| `PATCH` | `/api/owner/orders/:id/ready` | Marks one order `READY`, sets `ready_at`. |

### Token generation

A single globally-increasing sequence (`MAX(token_number) + 1`, not
reset daily), computed on the backend only - the frontend never
invents a token number. This is the simplest reliable option for a
single-shop, low-concurrency demo; it is **not** safe against two
truly simultaneous orders racing each other (would need a DB-level
sequence or row locking for that), which is an acceptable tradeoff at
this stage but worth revisiting before real production load.

### What counts toward "Today's Sales" (temporary assumption)

Every order counts, regardless of `ACTIVE`/`READY` status, and - for
this specific temporary stage - regardless of payment, since there is
no payment step at all yet. Once Razorpay is added, this should be
narrowed to only orders with a verified successful payment.

---

## Testing checklist

**Customer side:**

- [ ] Menu loads at `/` with all 17 categories, correct products and prices
- [ ] Category nav, quantities, variants, cart, sticky cart bar all work
- [ ] Order summary lets you pick Dine In or Parcel
- [ ] "Place Order" is disabled until an order type is chosen and the cart isn't empty
- [ ] Placing an order shows a full-screen confirmation with a token number
- [ ] "Order Again" clears the cart and returns to the menu

**Owner side:**

- [ ] `/owner` loads with **Today's Orders = 0** and **Today's Sales = ₹0** on a fresh database
- [ ] Current Orders shows "No orders yet 🍫" when there's nothing active
- [ ] A real customer order appears in Current Orders within ~7 seconds (or immediately if you reload)
- [ ] The card shows the correct token, Dine In/Parcel badge, items, and total
- [ ] Tapping a card opens the detail sheet with the same information
- [ ] "Ready & Call Token" marks the order ready, announces it (where supported), shows a visual confirmation, and removes it from Current Orders
- [ ] The order then appears under "Recently Ready"
- [ ] Today's Orders / Today's Sales stay correct (unchanged by marking ready, incremented only by new real orders)
- [ ] Placing a second order produces the next sequential token number

**End-to-end flow (mirrors the exact scenario this update was built against):**

1. Open `/owner` - confirm 0 orders, ₹0 sales, empty state.
2. Open `/`, add items, choose Dine In, Place Order - note the token.
3. Open `/owner` - the same token/items/total should appear in Current Orders.
4. Tap "Ready & Call Token" - hear the announcement, see the confirmation, watch it move to Recently Ready.
5. Place a second order - confirm the token increments by 1 and stats accumulate correctly.

**Responsive check**, both `/` and `/owner`, at 360px, 375px, 390px,
414px, 768px, and desktop: no horizontal scrolling, all buttons easy
to tap, token numbers readable.

## Assumptions made from the menu PDF

A few judgment calls were needed to turn the menu artwork into clean
data rows. None of these change any price - they're only about how
items were grouped or where ambiguous layout was resolved:

1. **"Seasonal fruit"** (listed under Sweet Affairs) has no price on
   the page - it varies by season. Left out of the seeded menu rather
   than inventing a price.
2. **"Coffee Mocha with Cashew"** and **"6 Layer Cake with Icecream &
   Strawberry"** each appear on two different pages of the PDF. Each
   was kept as a single product in the clearer-fit category rather
   than duplicated.
3. **Sub-groupings** inside a category (e.g. "Velvet Special" inside
   Natural Ice Cream) are stored as an optional `section` label on the
   product, not a separate table.
4. **Variant naming**: two-price items are stored as "Single"/"Double"
   or "No Bake"/"Baked" variants, matching the labels printed on those
   pages.
5. **Add-on notes** like "Any extra dip +₹30" are shown as a
   description line, not turned into separate priced products.

## Menu redesign + owner Menu Management

### Customer menu redesign

The customer page now leans into the physical Chocolicious menu's
identity: red brush-stroke-style banners behind each category heading
(replacing the plain text headers), and every product card now shows a
photo (or a clean placeholder when none is set yet) alongside the name,
price, and quantity control - so customers unfamiliar with a dessert
can actually see what they're ordering, per the owner's request.

### Availability is now visible, not hidden

Previously, marking a product unavailable removed it from `/api/menu`
entirely. That's fixed: unavailable products now stay in the response
(`is_available: false`) and the customer UI shows them dimmed with an
"Unavailable" pill instead of quantity controls - so people can see the
item exists without being able to add it. The backend also rejects
`POST /api/orders` for any unavailable product server-side, regardless
of what the frontend does.

### Owner Menu Management

`/owner` now has an **Orders / Menu** tab switcher. The Menu tab lets
the owner, from their phone:

- Search products
- See a small image, price, and available/unavailable status per item
- Toggle availability with one tap
- Tap **Edit** to change name, category, price (or variants), image, or description
- **+ Add New Item** to create a new product from scratch

Prices are never hard-coded in React - the customer menu always reflects
whatever's in the database, refreshed on page load.

**Editing the menu never touches historical orders.** Every order item
already stores its own snapshot of the product name, variant name, and
unit price at the moment it was purchased (see `order_items` in the
schema above) - changing a product's name or price afterwards only
affects new orders going forward.

### New/changed API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/menu` | **Changed:** now includes unavailable products too (`is_available: false`), instead of silently dropping them. |
| `GET` | `/api/owner/menu` | Full menu for the owner, including unavailable products, grouped by category. |
| `POST` | `/api/owner/menu` | Create a product. Accepts JSON or `multipart/form-data` (with an `image` file). Either `price` or `variants` (a list of `{name, price}`) is required. |
| `PATCH` | `/api/owner/menu/:id` | Update a product. Same body shape as create; only the fields present are changed. |
| `GET` | `/api/uploads/:filename` | Serves uploaded product images. |

### Image storage

Uploaded images are saved to `backend/app/static/uploads/` on local
disk (not in SQLite) and served through `/api/uploads/<filename>` -
this keeps the request path inside `/api`, so it works through the
same Vite dev proxy as everything else without extra config. All the
image-saving logic lives in one function
(`save_uploaded_image()` in `menu_admin_service.py`), so swapping this
for S3/Cloudinary/etc. at deploy time means changing that one function,
not any route or frontend code. Accepted formats: PNG, JPG, JPEG, WEBP,
up to 5MB.

## Razorpay Test Mode payments

Orders are now created only after a real (Test Mode) Razorpay payment
is verified server-side. The old direct "Place Order" endpoint still
exists in the code but is **disabled by default**.

### One-time setup (manual - required before this works)

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com), toggle **Test Mode** on (top right).
2. Settings → API Keys → Generate Test Key.
3. Copy `backend/.env.example` to `backend/.env` and fill in the two values it asks for:
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
4. `backend/.env` is gitignored - never commit it, never use live (non-test) keys at this stage.
5. Install the two new backend dependencies (already in `requirements.txt`): `pip install -r requirements.txt`.

### The flow

```
Customer taps "Pay ₹X & Place Order"
  → POST /api/payments/create   { order_type, items }
      prices the cart from the database (same logic as before - never
      trusts a client-sent amount), opens a Razorpay order for that
      amount, stores a PaymentIntent row remembering what was priced
  → Razorpay Checkout modal opens (test mode - use a Razorpay test card)
  → POST /api/payments/verify   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
      verifies the signature server-side using the key secret
      (never exposed to the frontend), then creates the real order
      (token included) via the same create_order() used before -
      using the items captured at /payments/create time, not
      anything the client resends
  → same order shape as before flows into the existing confirmation screen
```

A repeated `/payments/verify` call for the same payment (e.g. a retry)
returns the same order instead of creating a duplicate - see
`payment_service.verify_and_create_order`.

### The old `POST /api/orders` endpoint

Still present, not deleted, but returns `403` by default now. It can
be re-enabled for local testing only by setting
`ALLOW_DIRECT_ORDER_CREATION=true` in `backend/.env` - never do this in
a real deployment, since it creates an order with no payment at all.

### What's still missing before this is production-ready

- **Webhooks.** Right now, a payment is only recorded if the customer's
  browser stays on the page long enough for `/payments/verify` to run.
  If they close the tab right after paying, Razorpay would have their
  money with no corresponding order. A webhook (`payment.captured`) as
  a second, server-driven source of truth is the standard fix -
  deliberately out of scope for this step, per the plan.
- **Test Mode only.** No live credentials, no real charges are possible yet.
- Razorpay Test Mode card numbers are in
  [their docs](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
  - use those to complete a real Test Mode checkout end-to-end.

## What's intentionally *not* here yet

- **Live Razorpay payments.** Test Mode only right now (see above) -
  going live needs real credentials, a production HTTPS domain, and a
  webhook, none of which are set up yet.
- **Authentication** on `/owner` (or anywhere).
- SMS/email notifications, Socket.IO/real-time push (polling is used
  instead), inventory or employee management, detailed analytics,
  multi-status kitchen workflows (`PREPARING`/`ACCEPTED`/`CANCELLED`
  were deliberately left out - see the product philosophy above).
