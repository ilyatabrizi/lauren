# LAUREN — فروشگاه آنلاین

Storefront preview for **Lauren / لارن** — men's clothing, Tabriz
(Valiasr, Atlas shopping centre, GC floor · [@lauren\_\_ir](https://instagram.com/lauren__ir)).

Persian RTL, dark editorial, installable as an app. Static — no server, no
build step, no dependencies. Everything runs in the browser.

---

## What's in it

| Area | What works |
| --- | --- |
| **Catalogue** | 12 products across 3 categories, filter, sort, live search, colourway cross-links |
| **Product** | Stacked gallery + lightbox, size picker with low-stock markers, size guide, spec accordions |
| **Bag** | Slide-in drawer, quantity control, free-shipping progress, persists across sessions |
| **Checkout** | Contact + address with validation, three shipping options, coupons, points redemption |
| **Payment** | Shaparak-style gateway — card grouping, expiry mask, dynamic OTP, 5-minute countdown |
| **Account** | Phone + OTP sign-in, order history, wishlist, saved address, loyalty club |
| **Loyalty** | Points per purchase, 4 tiers with a progress ring, redeemable at checkout |
| **PWA** | Installs to the home screen, works offline, app shortcuts, maskable icons |

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

50 checks: every route renders, the whole browse → bag → checkout → pay →
confirm flow, totals arithmetic, loyalty points, PWA manifest and service
worker, Persian font loading and RTL. Needs `pip3 install playwright`
(falls back to the system Chrome, so `playwright install` is optional).

---

## Editing the store

Almost everything the shop owner would change is in two files:

- **`js/config.js`** — address, socials, shipping methods and prices, free
  shipping threshold, coupon codes, loyalty rates, tier names and perks.
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
  store.js            state, bag, orders, points (localStorage)
  router.js           hash router
  ui.js               icons, cards, toasts, blur-up images
  bag.js              slide-in bag drawer
  views/              home, shop, product, checkout, pay, thanks, account, pages
  placeholders.js     generated — blur-up data URIs
scripts/
  build_assets.py     photos → catalogue images + icons
  e2e.py              end-to-end test
sw.js                 service worker (network-first code, cache-first media)
manifest.webmanifest  PWA manifest
```

Hash routing (`#/shop`, `#/p/polo-noir`) is deliberate: GitHub Pages needs no
rewrite rules, and deep links keep working offline inside the installed app.

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
4. **Photography** — replace the recoloured variants with real shots, and
   consider a proper white-background studio set for the catalogue grid.
5. **Analytics + SEO** — hash routes are invisible to search engines. If
   organic search matters, move to real paths with server rewrites.

Until then this is a design and UX preview, and the copy says so where a
customer could be misled.

---

Built for Lauren by [Alpha Agency](https://instagram.com/lauren__ir).
