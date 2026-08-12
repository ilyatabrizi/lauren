// LAUREN — client state.
// Everything persists to localStorage; this preview has no server.

import { SHOP } from './config.js';
import { byId } from './data.js';
import { pointsFor, tierFor, uid } from './util.js';

const KEY = 'lauren.v1';

const blank = () => ({
  bag: [],          // { id, size, qty }
  wish: [],         // product ids
  user: null,       // { name, phone, email, joined }
  addresses: [],    // { id, label, city, line, postal, receiver, phone }
  orders: [],       // { id, ts, items, totals, status, address, shipping, gateway }
  points: 0,        // spendable
  lifetime: 0,      // never decreases — drives the tier
  recent: [],       // recently viewed product ids
  coupon: null,
});

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

export function commit(reason = 'change') {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
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

/* ------------------------------------------------------------------ auth */
export function signIn({ name, phone, email }) {
  const isNew = !state.user;
  state.user = {
    name: name || state.user?.name || 'مهمان',
    phone,
    email: email || state.user?.email || '',
    joined: state.user?.joined || Date.now(),
  };
  if (isNew) {
    state.points += SHOP.points.signupBonus;
    state.lifetime += SHOP.points.signupBonus;
  }
  commit('auth');
  return isNew;
}

export function signOut() { state.user = null; commit('auth'); }

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
export function totals({ shippingId, usePoints = 0, coupon = state.coupon } = {}) {
  const lines = bagLines();
  const sub = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const listSub = lines.reduce((n, l) => n + (l.product.compareAt || l.product.price) * l.qty, 0);
  const savedOnList = listSub - sub;

  const rule = coupon ? SHOP.coupons[coupon] : null;
  const couponOff = rule?.type === 'percent' ? Math.round(sub * rule.value / 100) : 0;

  const ship = SHOP.shipping.find((s) => s.id === shippingId);
  let shipCost = ship ? ship.cost : 0;
  const freeByTotal = sub >= SHOP.freeShippingOver;
  const freeByCoupon = rule?.type === 'shipping';
  const freeByTier = tierFor(state.lifetime).tier.id !== 'member';
  if (ship && (freeByTotal || freeByCoupon || freeByTier)) shipCost = 0;

  const maxPoints = Math.min(state.points, Math.floor((sub - couponOff) / SHOP.points.tomanPerPoint));
  const pointsUsed = Math.max(0, Math.min(usePoints, maxPoints));
  const pointsOff = pointsUsed * SHOP.points.tomanPerPoint;

  const grand = Math.max(0, sub - couponOff - pointsOff + shipCost);

  return {
    lines, count: lines.reduce((n, l) => n + l.qty, 0),
    sub, savedOnList, couponOff, couponLabel: rule?.label || null,
    shipCost, shipFree: !!ship && shipCost === 0,
    freeReason: freeByCoupon ? 'coupon' : freeByTotal ? 'total' : freeByTier ? 'tier' : null,
    maxPoints, pointsUsed, pointsOff,
    grand, earns: pointsFor(grand),
  };
}

/* ----------------------------------------------------------------- orders */
export function placeOrder({ address, shippingId, gateway, t, ref }) {
  const order = {
    id: uid('LR'),
    ref: ref || uid('TRX'),
    ts: Date.now(),
    items: t.lines.map((l) => ({
      id: l.id, size: l.size, qty: l.qty,
      title: l.product.title, color: l.product.colorName,
      price: l.product.price, img: l.product.gallery[0],
    })),
    totals: {
      sub: t.sub, shipCost: t.shipCost, couponOff: t.couponOff,
      pointsOff: t.pointsOff, grand: t.grand,
    },
    earned: t.earns,
    address, shippingId, gateway,
    status: 'paid',
  };
  state.orders.unshift(order);
  state.points = state.points - t.pointsUsed + t.earns;
  state.lifetime += t.earns;
  state.bag = [];
  state.coupon = null;
  commit('order');
  return order;
}

export const tier = () => tierFor(state.lifetime);
