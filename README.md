# LAUREN — فروشگاه آنلاین

Storefront preview for **Lauren / لارن** — men's clothing, Tabriz
(Valiasr, Atlas shopping centre, GC floor · [@lauren\_\_ir](https://instagram.com/lauren__ir)).

Persian RTL, installable as an app. Static — no server, no build step, no
dependencies, no external requests. Everything runs in the browser.

## The design, in three rules

**شب — a dark room with the clothes lit.**

1. **The photograph is the page.** Full bleed, edge to edge, no frame, no mount,
   no white well. Type sits on the image or directly beneath it. Nothing is
   capped at 400px any more — and that single change is what the whole redesign
   rests on. v2 was light, small-image and photo-free in the hero *because* the
   only pictures were ~740px phone grabs that fell apart when enlarged. Give the
   page real frames and the argument for hiding them disappears.

2. **Two voices, and they never blur.** A display voice — Persian, large, heavy,
   tight-leaded, and *never tracked* — against a label voice: Latin monospace,
   uppercase, positively tracked, for every number, size, price, piece number
   and nav item. The mono is what makes the page read as equipment rather than
   a brochure, and it is the part that was missing before: Latin and Persian
   used to be set in the same family at the same weight, so nothing had a
   hierarchy. Persian never takes the mono and never takes the tracking; its
   label voice is weight and colour instead (`.eyebrow`), because Persian has
   no uppercase and letter-spacing breaks its joins in both directions.

3. **One accent, and it means "now".** `#FF6B35` marks the live thing — the
   selected tab, the price about to be paid, the size still in stock. Never
   decoration. On this ground it measures 6.3:1, so unlike v2's `#C2410C` it is
   finally legal for small text as well as fills.

The simulated bank gateway stays light on purpose: real Iranian PSP pages are
light, and a dark one would be the least convincing thing on the site.

---

## The photography is placeholder — read this before showing anyone

Every image in `assets/photos/` is a **free stock photograph from Pexels**,
pulled by `scripts/fetch_photos.py`. **They are not Lauren's garments.** They
are here so the design can be judged with real frames instead of phone grabs.

The Pexels License permits commercial use without attribution, so nothing is
being infringed — but a shopper looking at «پولوشرت پیکه نواردوزی ۳٬۴۵۰٬۰۰۰
تومان» over a stranger's polo shirt is being shown a garment the shop does not
sell. That is fine for a direction preview and **not** fine for a live shop.
Replace all sixteen with a real shoot before this takes a real order.

The sixteen frames are graded to a common look on the way in — desaturated,
flattened slightly, settled on a cool lifted black. Sixteen photographers'
grades side by side is what makes a stock grid look bought; one grade is what
makes it look art-directed. `grade()` in `fetch_photos.py` is that pass, and a
real shoot should go through it too.

Each garment gets two views from one frame: the full shot and a `--closeup`,
cropped in on the cloth. A real shoot would supply three or four.

---

## What's in it

| Area | What works |
| --- | --- |
| **Catalogue** | 12 products across 3 categories, filter, sort, live search, colourway cross-links |
| **Product** | Stacked gallery + lightbox, size picker with low-stock markers, size guide, spec accordions |
| **Bag** | Slide-in drawer, quantity control, free-shipping progress, persists across sessions |
| **Checkout** | Contact + address with validation, three shipping options, coupons, credit redemption |
| **Payment** | Shaparak-style gateway — card grouping, expiry mask, dynamic OTP, 5-minute countdown |
| **Account** | Phone + 4-box OTP, credit wallet with a ledger, orders, wishlist, address |
| **Wallet** | Toman credit back on every order, 3 tiers by 12-month spend, redeemable at checkout |
| **PWA** | Installs to the home screen, works offline, app shortcuts, maskable icons |
| **Navigation** | Dark frosted top bar, floating glass tab pill with a spring indicator, Back dismisses overlays |
| **Search** | Its own route, matches Persian name / colour / fabric / piece number, tolerant of ی-ي and ک-ك |
| **Orders** | Order detail + receipt, derived delivery stages, reorder, cancel, exchange request |
| **Pickup** | Collect at Atlas as a real checkout option — skips the address it doesn't need |
| **Reviews** | Written only by someone whose order was delivered, keyed to the garment, honest empty state |
| **Identity** | A footer band naming who the shop is, with slots that stay empty until the certificates are real |

### What the site does not claim

A preview that cannot send an SMS should not say it will. Every promise the
static build cannot keep was removed, and where the honest answer was a *place*
rather than a message, the place was built:

- A sold-out size no longer says «خبرتان می‌کنیم». It records the request and
  opens a pre-written WhatsApp message, and `#/wishlist` now lists everything
  you are waiting on — because a request nobody can answer is not a feature.
- The order stages are derived from elapsed time, so every screen that shows
  them says so.
- The sign-in code is generated and printed on screen, and says that too.
- `#/thanks` celebrates only the payment that just happened. `pay.js` stamps
  the order id in `sessionStorage`; every other arrival — a bookmark, a shared
  link, a week later — redirects to `#/order/:id`, which is already the
  receipt. A confirmation that congratulates you on a week-old order is a lie
  about when you are.

### هویت فروشگاه — the trust band

Iranian shoppers look for نماد اعتماد الکترونیکی and نشان ساماندهی. Lauren has
neither yet: both are issued against a **verified domain the business owns**,
and this preview sits on a path under `github.io`, which neither authority will
certify.

So the footer draws a **labelled empty slot** — «جای نماد اعتماد الکترونیکی» —
dashed, greyscale, shaped nothing like a seal, above a line saying plainly that
no badge or registration number has been invented. `TRUST` in `js/config.js`
starts every field `null`; a certificate renders **only** when its `code` is a
real string, and that rule lives in `certSlot()` in `js/app.js`, not merely in
this document. Filling it in later is a data edit: paste the licence number,
the e-Namad id and its verification URL, drop the issued image in
`assets/trust/`, and the slot becomes a badge with no markup change.

The one thing we could publish today is the landline — which, it turns out,
never dialled: `BRAND.phone` is written in Persian numerals and `\D` is
`[^0-9]`, so `replace(/\D/g, '')` deleted every digit and shipped `href="tel:"`.
`latinDigits()` in `js/util.js` fixes it.

### نظر خریداران — reviews

- **Only a real buyer writes one.** Three gates: signed in, owns a
  non-cancelled order whose derived stage is `done`, and that order contained
  this garment. The gate reuses the one lifecycle definition in `store.js`, so
  a real courier feed makes it correct for free.
- **Keyed to `family`, not to the product id.** Fit, fabric weight and how the
  size ran are properties of the garment, not the colourway — and keying on the
  id would scatter 12 buckets across 6 garments and let one person review the
  same piece twice by buying two colours. Each review still records the colour
  and size actually bought.
- **The empty state is the default,** because it is the truth on a fresh install.
- **The sample reviews are fiction and say so.** They carry a «نمونه» tag, never
  the «خرید تاییدشده» pill, are excluded from every average and count, are never
  written to `localStorage`, and disappear entirely when `PREVIEW.enabled` is
  false. A fabricated opinion can never move a number a shopper reads as fact.

### باشگاه لارن — the wallet

One number, in Toman. The scheme this replaced ran on two exchange rates at
once (10,000 Toman spent = 1 point; 1 point = 500 Toman), so every screen
quoted a different unit and the shopper had to do arithmetic.

- **Earn** a percentage of the merchandise subtotal, *after* any coupon and
  *before* shipping — so postage never earns, and paying with credit doesn't
  quietly shrink what the next order returns. عضو ۵٪ · نقره‌ای ۷٪ · طلایی ۱۰٪.
- **Redeem** up to half of an order's goods, never against shipping.
- **Tier** follows real spending in the last 12 months, not a balance, and the
  welcome credit never counts toward it.
- **Welcome credit** of ۲۰۰٬۰۰۰ تومان is minted once per phone number.

### The payment gateway is a simulation

`#/pay` renders a convincing Iranian bank gateway, but **it is not connected to
anything**. No network request is made, no card is stored, no money moves. The
page says so in a banner, and the card field is pre-filled with a fake
(Luhn-valid) test number. Going live needs a real PSP — see below.

---

## Run it

```bash
python3 serve.py
```

Then open <http://localhost:8071>. Set `PORT` to use a different port.

## Test it

```bash
python3 scripts/e2e.py http://localhost:8071
```

154 checks: every route renders, the whole browse → bag → checkout → pay →
confirm flow, totals arithmetic, the wallet rules (earn base, redemption cap,
welcome credit minted once per phone), PWA manifest and service worker, RTL,
that no Persian text carries letter-spacing, that no screen promises an SMS,
that a revisited confirmation becomes a receipt, that an unissued certificate
draws a labelled empty slot and never a seal, and that a review cannot be
written without a delivered order. Needs `pip3 install playwright` (falls back
to the system Chrome, so `playwright install` is optional).

---

## Editing the store

Almost everything the shop owner would change is in two files:

- **`js/config.js`** — address, socials, shipping methods and prices, free
  shipping threshold, coupon codes, wallet rates, tier names and perks.
- **`js/data.js`** — the catalogue: titles, prices, colours, sizes,
  descriptions, fabric, size guide, FAQ.

### Adding or replacing photos

Drop the new shot into `assets/products/_src/`, add its crop box to `CROPS` in
`scripts/build_assets.py`, then:

```bash
python3 scripts/build_assets.py
```

That regenerates the 4:5 catalogue images, the zoomed detail shots, the
colourway variants, the blur-up placeholders, the wide home hero, and the full
PWA icon set from `assets/brand/logo-source.png`.

The pipeline also **defocuses the other makers' woven labels** visible in the
raw shop photos (`RETOUCH` in the same file) — the preview shouldn't republish
anyone else's trademark.

Colourways marked in `VARIANTS` are recoloured from a real photo rather than
shot separately: `polo-steel`, `polo-bordeaux`, `knit-sand`, `set-olive`,
`set-slate`. Swap them for real photography before this goes anywhere near a
paying customer.

---

## Structure

```
index.html            app shell
css/app.css           the whole design system
js/
  config.js           brand + shop settings      ← edit me
  data.js             catalogue                  ← edit me
  store.js            state, bag, orders, credit wallet (localStorage)
  router.js           hash router
  ui.js               icons, cards, toasts, blur-up images
  bag.js              slide-in bag drawer
  views/              home, shop, product, checkout, pay, thanks, account, pages
  placeholders.js     generated — blur-up data URIs
  brand.js            the mark as inline SVG (generated)
scripts/
  build_assets.py     photos → catalogue images + icons
  trace_logo.py       logo PNG → real vector (mark.svg, logo.svg)
  e2e.py              end-to-end test
sw.js                 service worker (network-first code, cache-first media)
manifest.webmanifest  PWA manifest
```

Hash routing (`#/shop`, `#/p/polo-noir`) is deliberate: GitHub Pages needs no
rewrite rules, and deep links keep working offline inside the installed app.

### Routes

```
/              home                    /bag           the bag as a page
/shop          catalogue               /checkout      contact, address, shipping
/p/:id         product                 /pay           simulated gateway
/search        search                  /thanks        confirmation
/wishlist      saved pieces            /order/:id     order detail + receipt
/track         look up an order        /exchange/:id  request a size exchange
/size-guide    all three charts        /account       wallet, orders, address
/shipping      shipping and returns    /about /contact /faq
```

Every route belongs to exactly one tab (`OWNS` in `js/app.js`) — a tab bar with
nothing selected reads as broken.

### The glass navigation

The top bar is transparent while the hero owns the screen and frosts to
`blur(22px) saturate(180%)` once anything scrolls under it. The tab bar is a
detached pill so the page runs *beneath* it and the material has something to
refract; its selected state is a filled pill that moves between slots on a
spring rather than a CSS transition, which is what makes it read as native.
Both have `@supports not (backdrop-filter)` fallbacks that go near-opaque.

Note the RTL trap: `tab.offsetLeft` is measured from the container's **left**
edge in both writing directions, so the pill is anchored with physical `left`,
not `inset-inline-start`. Mixing the two put the bar half off screen.

Back dismisses the bag drawer, the lightbox and the mobile menu instead of
navigating the page underneath — each pushes a history entry on open and
consumes it on close (`pushOverlay` / `popOverlay` in `js/ui.js`).

---

## Turning the preview into a real shop

Ordered by what blocks a launch:

1. **Payment** — connect a real PSP (زرین‌پال، آیدی‌پی، بانک ملت). Needs a
   backend to create the transaction and verify the callback; a browser-only
   site cannot do this safely.
2. **Orders and stock** — orders currently live in the visitor's own browser.
   A real shop needs a server so the store can see them and so stock counts
   are shared between customers.
3. **Sign-in** — the OTP is generated and shown on screen. Swap it for a real
   SMS provider (کاوه‌نگار، قاصدک) with server-side verification.
4. **Photography** — this is the single biggest lever left. The whole design
   is built to flatter ~740px phone grabs, but a proper shoot (even an iPhone
   on a tripod against a plain wall, in daylight) would let the images be
   shown large, which is what a clothing site wants to do. Replace the
   recoloured colourways with real shots at the same time.
5. **Analytics + SEO** — hash routes are invisible to search engines. If
   organic search matters, move to real paths with server rewrites.

Until then this is a design and UX preview. Every screen that could mislead a
customer now says what it actually is, and `scripts/e2e.py` fails the build if
an SMS promise, a fabricated trust seal, or an ungated review ever comes back.

---

Built for Lauren by [Alpha Agency](https://instagram.com/lauren__ir).
