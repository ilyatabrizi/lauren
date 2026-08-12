// LAUREN — small shared utilities.

import { SHOP } from './config.js';

/* ---------------------------------------------------------------- money --
 * Digits stay Latin on purpose: IRANYekanXFaNum substitutes ۰–۹ itself in the
 * font, so converting in JS would double-convert. Only the thousands
 * separator is swapped for the Persian one (U+066C).                        */
export const groupDigits = (n) =>
  String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');

export const toman = (n) => `${groupDigits(n)} ${SHOP.currency}`;

export const tomanShort = (n) => groupDigits(n);

/* ----------------------------------------------------------------- misc -- */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const uid = (prefix = 'LR') =>
  prefix + Math.random().toString(36).slice(2, 7).toUpperCase() +
  Date.now().toString(36).slice(-4).toUpperCase();

export const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/** Persian (Jalali) date, formatted for display. */
export const faDate = (ts) =>
  new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
    .format(new Date(ts));

export const faDateTime = (ts) =>
  new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));

/** Escape anything that came from user input before it touches innerHTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/* --------------------------------------------------------------- points -- */
export const pointsFor = (spend) => Math.floor(spend / SHOP.points.perToman);
export const pointsValue = (pts) => pts * SHOP.points.tomanPerPoint;

export const tierFor = (lifetimePoints) => {
  const list = SHOP.tiers;
  let cur = list[0];
  for (const t of list) if (lifetimePoints >= t.min) cur = t;
  const next = list[list.indexOf(cur) + 1] || null;
  const span = next ? next.min - cur.min : 1;
  const done = next ? lifetimePoints - cur.min : span;
  return { tier: cur, next, progress: clamp(done / span, 0, 1) };
};

/* ---------------------------------------------------------------- input -- */
/** Iranian mobile: 09xxxxxxxxx */
export const validPhone = (v) => /^09\d{9}$/.test(String(v).replace(/\D/g, ''));
export const validPostal = (v) => /^\d{10}$/.test(String(v).replace(/\D/g, ''));
export const digitsOnly = (v) => String(v).replace(/\D/g, '');

/** Luhn — used only to make the preview gateway behave like a real one. */
export const luhn = (num) => {
  const s = digitsOnly(num);
  if (s.length !== 16) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = +s[15 - i];
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
};

/* ------------------------------------------------------------------ dom -- */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const el = (tag, attrs = {}, html = '') => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  if (html) n.innerHTML = html;
  return n;
};

export const scrollTop = (smooth = false) =>
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
