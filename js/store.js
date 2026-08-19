// LAUREN — client state.
// Everything persists to localStorage; this preview has no server.

import { SHOP, PREVIEW } from './config.js';
import { byId, PRODUCTS, SAMPLE_REVIEWS } from './data.js';
import { uid, clamp } from './util.js';

const KEY = 'lauren.v3';

const blank = () => ({
  bag: [],          // { id, size, qty }
  wish: [],         // product ids — kept for guests too
  user: null,       // { name, phone, joined }
  addresses: [],
  orders: [],
  credit: 0,        // spendable balance, in Toman — belongs to the signed-in phone
  spend12: 0,       // merchandise actually paid for in 12 months — sets the tier
  ledger: [],       // { ts, kind: 'earn'|'spend'|'welcome', amount, note, ref }
  welcomedPhones: [], // so signing out and back in can't re-mint the welcome
  // One browser can hold several customers. Everything money-shaped is filed
  // per phone number here; without this the wallet is browser-wide and cycling
  // phone numbers mints an unlimited welcome balance into one pot.
  accounts: {},     // phone -> { credit, spend12, ledger, orders, addresses, name, joined }
  recent: [],
  notify: [],       // 'productId|size' the shopper asked to be told about
  // { id, family, productId, color, size, orderId, phone, name, stars, body, ts }
  // Browser-wide on purpose — written by one customer, read by every visitor.
  // Deliberately NOT in OWNED: signing out would erase the shop's whole list.
  reviews: [],
  coupon: null,
});

/** The slice of state that belongs to a customer rather than to the browser. */
const OWNED = ['credit', 'spend12', 'ledger', 'orders', 'addresses'];

const snapshot = () => ({
  ...Object.fromEntries(OWNED.map((k) => [k, state[k]])),
  name: state.user?.name || '',
  joined: state.user?.joined || Date.now(),
});

function adopt(acc) {
  OWNED.forEach((k) => { state[k] = acc?.[k] ?? blank()[k]; });
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    return { ...blank(), ...JSON.parse(raw) };
  } catch {
    return blank();
  }
}

export const state = load();


const subs = new Set();
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

/** Another tab wrote — take its version rather than overwrite it on next commit. */
addEventListener('storage', (e) => {
  if (e.key !== KEY || !e.newValue) return;
  try {
    Object.assign(state, { ...blank(), ...JSON.parse(e.newValue) });
    subs.forEach((fn) => fn('sync'));
    window.dispatchEvent(new CustomEvent('lauren:state', { detail: { reason: 'sync' } }));
  } catch { /* ignore a torn write */ }
});


export function commit(reason = 'change') {
  if (state.user?.phone) state.accounts[state.user.phone] = snapshot();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  subs.forEach((fn) => fn(reason));
  window.dispatchEvent(new CustomEvent('lauren:state', { detail: { reason } }));
}

/* -------------------------------------------------------------------- bag */
export const bagCount = () => state.bag.reduce((n, l) => n + l.qty, 0);

export const bagLines = () => state.bag
  .map((l) => ({ ...l, product: byId(l.id) }))
  .filter((l) => l.product);

export function addToBag(id, size, qty = 1) {
  const found = state.bag.find((l) => l.id === id && l.size === size);
  if (found) found.qty = Math.min(10, found.qty + qty);
  else state.bag.push({ id, size, qty });
  commit('bag:add');
}

export function setQty(id, size, qty) {
  const i = state.bag.findIndex((l) => l.id === id && l.size === size);
  if (i < 0) return;
  if (qty <= 0) state.bag.splice(i, 1);
  else state.bag[i].qty = Math.min(10, qty);
  commit('bag:qty');
}

export function removeLine(id, size) { setQty(id, size, 0); }
export function clearBag() { state.bag = []; state.coupon = null; commit('bag:clear'); }

/* ------------------------------------------------------------------ wish */
export const inWish = (id) => state.wish.includes(id);
export function toggleWish(id) {
  const i = state.wish.indexOf(id);
  if (i < 0) state.wish.unshift(id); else state.wish.splice(i, 1);
  commit('wish');
  return i < 0;
}

/* ---------------------------------------------------------------- recent */
export function markViewed(id) {
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 8);
  commit('recent');
}

/* ------------------------------------------------------------------ tier */
export function tier() {
  const list = SHOP.tiers;
  let cur = list[0];
  for (const t of list) if (state.spend12 >= t.minSpend) cur = t;
  const next = list[list.indexOf(cur) + 1] || null;
  const from = cur.minSpend;
  const span = next ? next.minSpend - from : 1;
  return {
    tier: cur,
    next,
    rate: cur.rate,
    toNext: next ? Math.max(0, next.minSpend - state.spend12) : 0,
    progress: next ? clamp((state.spend12 - from) / span, 0, 1) : 1,
  };
}

/* ------------------------------------------------------------------ auth */
export function signIn({ name, phone }) {
  const clean = String(phone).replace(/\D/g, '');
  if (state.user?.phone && state.user.phone !== clean) {
    // a different customer on the same device — bank the current one first
    state.accounts[state.user.phone] = snapshot();
  }
  const saved = state.accounts[clean];
  adopt(saved);
  state.user = {
    name: name || saved?.name || '',
    phone: clean,
    joined: saved?.joined || Date.now(),
  };
  // The welcome credit is minted once per phone number. Keying it off
  // "is there a user object?" let anyone sign out and back in for another
  // 200,000 Toman, forever.
  let welcomed = false;
  if (!state.welcomedPhones.includes(clean)) {
    state.welcomedPhones.push(clean);
    state.credit += SHOP.wallet.welcome;
    state.ledger.unshift({
      ts: Date.now(), kind: 'welcome', amount: SHOP.wallet.welcome,
      note: 'هدیه‌ی عضویت در باشگاه لارن',
    });
    welcomed = true;
  }
  commit('auth');
  return welcomed;
}

export function setName(name) {
  if (!state.user) return;
  state.user.name = name;
  commit('auth');
}

export function signOut() {
  if (state.user?.phone) state.accounts[state.user.phone] = snapshot();
  state.user = null;
  adopt(null);          // the next person must not inherit this wallet
  commit('auth');
}

/* -------------------------------------------------------------- addresses */
export function saveAddress(addr) {
  const id = addr.id || uid('AD');
  const i = state.addresses.findIndex((a) => a.id === id);
  const rec = { ...addr, id };
  if (i < 0) state.addresses.unshift(rec); else state.addresses[i] = rec;
  commit('address');
  return rec;
}

/* ----------------------------------------------------------------- totals */
export function totals({ shippingId, useCredit = 0, coupon = state.coupon } = {}) {
  const lines = bagLines();
  const sub = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const listSub = lines.reduce((n, l) => n + (l.product.compareAt || l.product.price) * l.qty, 0);
  const savedOnList = listSub - sub;

  const rule = coupon ? SHOP.coupons[coupon] : null;
  const couponOff = rule?.type === 'percent' ? Math.round(sub * rule.value / 100) : 0;

  // Merchandise after discount — the base for both earning and the cap.
  const goods = Math.max(0, sub - couponOff);

  const ship = SHOP.shipping.find((s) => s.id === shippingId);
  const t = tier();
  const freeByTotal = sub >= SHOP.freeShippingOver;
  const freeByCoupon = rule?.type === 'shipping';
  const freeByTier = t.tier.id !== 'member';
  const shipFree = freeByTotal || freeByCoupon || freeByTier;
  const shipCost = ship ? (shipFree ? 0 : ship.cost) : 0;

  // Credit covers at most half the goods, and never the postage.
  const cap = Math.floor(goods * SHOP.wallet.maxShareOfOrder);
  const maxCredit = Math.min(state.credit, cap);
  const creditUsed = Math.max(0, Math.min(Math.floor(useCredit), maxCredit));

  const grand = Math.max(0, goods - creditUsed + shipCost);

  // Earned on the goods, before shipping and before credit — so postage never
  // earns and spending credit doesn't shrink the next order's return.
  const earns = Math.round(goods * t.rate);

  return {
    lines, count: lines.reduce((n, l) => n + l.qty, 0),
    sub, savedOnList, couponOff, couponLabel: rule?.label || null,
    goods,
    shipCost, shipFree: !!ship && shipCost === 0,
    freeReason: freeByCoupon ? 'coupon' : freeByTotal ? 'total' : freeByTier ? 'tier' : null,
    maxCredit, creditUsed, creditCap: cap,
    grand, earns, rate: t.rate,
  };
}

/* ----------------------------------------------------------------- orders */
/** The one place that decides what an order is doing.
 *  Every screen reads this, so the account card, the tracker and the receipt
 *  can never disagree. Swap the body for a courier feed and they all follow. */
export function orderStage(o) {
  const ship = SHOP.shipping.find((x) => x.id === o.shippingId);
  const stages = ship?.pickup ? SHOP.stagesPickup : SHOP.stages;
  if (o.cancelledAt) return { stages, at: -1, cancelled: true, stage: null };
  const hours = (Date.now() - o.ts) / 36e5;
  let at = 0;
  stages.forEach((st, i) => { if (hours >= st.afterHours) at = i; });
  return { stages, at, cancelled: false, stage: stages[at] };
}

/** Cancellable only while it has not left the shop. */
export const canCancel = (o) => !o.cancelledAt && orderStage(o).at <= 1;

export function cancelOrder(id) {
  const o = state.orders.find((x) => x.id === id);
  if (!o || !canCancel(o)) return false;
  o.cancelledAt = Date.now();
  // put back what the order took, and undo what it earned
  if (o.totals.creditUsed) {
    state.credit += o.totals.creditUsed;
    state.ledger.unshift({
      ts: Date.now(), kind: 'refund', amount: o.totals.creditUsed,
      note: 'بازگشت اعتبار — لغو سفارش', ref: o.id,
    });
  }
  if (o.earned) {
    state.credit = Math.max(0, state.credit - o.earned);
    state.ledger.unshift({
      ts: Date.now() + 1, kind: 'reverse', amount: -o.earned,
      note: 'برگشت اعتبار خرید — لغو سفارش', ref: o.id,
    });
  }
  state.spend12 = Math.max(0, state.spend12 - Math.max(0, o.totals.goods - o.totals.creditUsed));
  commit('order:cancel');
  return true;
}

/** How long is left to ask for an exchange, in days. */
export function exchangeWindow(o) {
  const days = tier().tier.id === 'member' ? SHOP.exchange.days : SHOP.exchange.daysSilver;
  const stage = orderStage(o);
  const delivered = stage.stages[stage.at]?.key === 'done';
  const left = days - Math.floor((Date.now() - o.ts) / 864e5);
  return { days, left, open: !o.cancelledAt && left > 0, delivered };
}

export function requestExchange(orderId, { itemIndex, toSize, reason }) {
  const o = state.orders.find((x) => x.id === orderId);
  if (!o || !exchangeWindow(o).open) return null;
  const item = o.items[itemIndex];
  if (!item) return null;
  o.exchange = {
    requestedAt: Date.now(), itemIndex,
    title: item.title, ref: item.ref,
    fromSize: item.size, toSize, reason, status: 'requested',
  };
  commit('order:exchange');
  return o.exchange;
}

/** Put a past order back in the bag, skipping anything no longer sold. */
export function reorder(orderId) {
  const o = state.orders.find((x) => x.id === orderId);
  if (!o) return { added: 0, skipped: [] };
  let added = 0; const skipped = [];
  o.items.forEach((i) => {
    const p = byId(i.id);
    if (!p || !p.sizes.includes(i.size)) { skipped.push(i.title); return; }
    const line = state.bag.find((l) => l.id === i.id && l.size === i.size);
    if (line) line.qty = Math.min(10, line.qty + i.qty);
    else state.bag.push({ id: i.id, size: i.size, qty: Math.min(10, i.qty) });
    added += 1;
  });
  if (added) commit('bag:add');
  return { added, skipped };
}

/** Ask to be told when a size comes back. Kept per product+size. */
export function notifyMe(id, size) {
  state.notify = state.notify || [];
  const key = `${id}|${size}`;
  if (!state.notify.includes(key)) { state.notify.push(key); commit('notify'); return true; }
  return false;
}
export const isNotifying = (id, size) => (state.notify || []).includes(`${id}|${size}`);
/** Withdraw a restock request. Without this the list only ever grows. */
export function forgetNotify(key) {
  const i = (state.notify || []).indexOf(key);
  if (i < 0) return false;
  state.notify.splice(i, 1);
  commit('notify');
  return true;
}

/* ---------------------------------------------------------------- reviews */
/* Keyed to `family`, not to a product id. What a review is actually about —
 * fit, fabric weight, stitching, how the size ran, how it washed — is carried
 * by the fields that are identical across a colourway family. Keying on the id
 * would scatter 12 buckets across 6 garments and leave most of them empty,
 * and would let one person review the same garment twice by buying it in two
 * colours. The colourway is not lost: each record keeps the colour and size
 * actually bought, and prints them under the review.
 *
 * The collection is browser-wide, NOT in OWNED: a review is written by one
 * customer and read by every visitor, so scoping it to an account would make
 * signOut's adopt(null) erase the shop's whole list. Authorship rides inside
 * each record instead, which is what survives account switching.
 */
const reviewList = () => (state.reviews = state.reviews || []);

export const reviewsFor = (fam) =>
  reviewList().filter((r) => r.family === fam).sort((a, b) => b.ts - a.ts);

export const myReview = (fam) => {
  const phone = state.user?.phone;
  return phone ? reviewList().find((r) => r.family === fam && r.phone === phone) || null : null;
};

/** Three gates: signed in, owns a delivered order, that order held this garment.
 *  Returns the proof — the order and the line item — or null. */
export function canReview(fam) {
  if (!state.user?.phone) return null;
  for (const o of state.orders) {
    if (o.cancelledAt) continue;
    const st = orderStage(o);
    if (st.stages[st.at]?.key !== 'done') continue;
    const item = o.items.find((i) => byId(i.id)?.family === fam);
    if (item) return { order: o, item };
  }
  return null;
}

/** Upsert: the same phone reviewing the same garment edits in place. */
export function saveReview({ family, stars, body }) {
  const proof = canReview(family);
  if (!proof) return null;
  const list = reviewList();
  const clean = String(body || '').trim().slice(0, 600);
  const n = Math.round(Math.min(5, Math.max(1, Number(stars) || 0)));
  const existing = myReview(family);
  if (existing) {
    Object.assign(existing, { stars: n, body: clean, ts: Date.now() });
    commit('review');
    return existing;
  }
  const rec = {
    id: uid('RV'),
    family,
    productId: proof.item.id,
    color: proof.item.color,
    size: proof.item.size,
    orderId: proof.order.id,
    phone: state.user.phone,
    name: String(state.user.name || '').trim().split(/\s+/)[0] || 'مشتری لارن',
    stars: n,
    body: clean,
    ts: Date.now(),
  };
  list.unshift(rec);
  commit('review');
  return rec;
}

export function removeReview(id) {
  const list = reviewList();
  const i = list.findIndex((r) => r.id === id && r.phone === state.user?.phone);
  if (i < 0) return false;
  list.splice(i, 1);
  commit('review');
  return true;
}

/** REAL reviews only. A sample can never move a number that looks like a fact. */
export function reviewSummary(fam) {
  const list = reviewsFor(fam);
  const dist = [0, 0, 0, 0, 0];
  list.forEach((r) => { dist[r.stars - 1] += 1; });
  return {
    count: list.length,
    avg: list.length ? list.reduce((n, r) => n + r.stars, 0) / list.length : 0,
    dist,
  };
}

/** What the page renders: real reviews, then the labelled samples — and only
 *  while this is a preview build. Samples are never written to state. */
export const shownReviews = (fam) => [
  ...reviewsFor(fam),
  ...(PREVIEW.enabled ? SAMPLE_REVIEWS.filter((r) => r.family === fam) : []),
];

export function placeOrder({ address, shippingId, gateway, t, ref }) {
  const order = {
    id: uid('LR'),
    ref: ref || uid('TRX'),
    ts: Date.now(),
    items: t.lines.map((l) => ({
      id: l.id, size: l.size, qty: l.qty,
      title: l.product.title, color: l.product.colorName, ref: l.product.ref,
      price: l.product.price, img: l.product.gallery[0],
    })),
    totals: {
      sub: t.sub, goods: t.goods, shipCost: t.shipCost,
      couponOff: t.couponOff, creditUsed: t.creditUsed, grand: t.grand,
    },
    earned: t.earns,
    address, shippingId, gateway,
    status: 'paid',
  };
  state.orders.unshift(order);

  if (t.creditUsed > 0) {
    state.ledger.unshift({
      ts: order.ts, kind: 'spend', amount: -t.creditUsed,
      note: 'استفاده در سفارش', ref: order.id,
    });
  }
  state.ledger.unshift({
    ts: order.ts + 1, kind: 'earn', amount: t.earns,
    note: `${Math.round(t.rate * 100)}٪ از خرید`, ref: order.id,
  });

  state.credit = Math.max(0, state.credit - t.creditUsed + t.earns);
  // Tier follows money actually paid. Counting the credit-funded part would
  // let the welcome gift buy tier progress.
  state.spend12 += Math.max(0, t.goods - t.creditUsed);
  state.bag = [];
  state.coupon = null;
  commit('order');
  return order;
}
