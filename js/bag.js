// LAUREN — slide-in bag. Lives outside the router so it survives navigation.

import { SHOP } from './config.js';
import { totals, setQty, removeLine, state } from './store.js';
import { ICON, photo, settleImages, toast, pushOverlay, popOverlay } from './ui.js';
import { toman, esc, $, $$ } from './util.js';

let drawer, scrim, body, foot, open = false;

function build() {
  scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.addEventListener('click', () => closeBag());

  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'سبد خرید');
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="drawer__hd">
      <h2>سبد خرید</h2>
      <button class="iconbtn" data-close aria-label="بستن">${ICON.close}</button>
    </div>
    <div class="drawer__body"></div>
    <div class="drawer__ft"></div>`;

  document.body.append(scrim, drawer);
  body = $('.drawer__body', drawer);
  foot = $('.drawer__ft', drawer);
  $('[data-close]', drawer).addEventListener('click', () => closeBag());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closeBag();
  });
}

function lineHtml(l) {
  const p = l.product;
  return `
  <div class="line" data-line="${p.id}|${l.size}">
    <a class="line__img" href="#/p/${p.id}" data-nav>
      <div>${photo(p.gallery[0], p.title)}</div>
    </a>
    <div>
      <a class="line__t" href="#/p/${p.id}" data-nav>${esc(p.title)}</a>
      <div class="line__m">${esc(p.colorName)} · سایز <bdi class="lat">${esc(l.size)}</bdi></div>
      <div class="line__r">
        <div class="qty">
          <button data-dec aria-label="کاهش">${ICON.minus}</button>
          <span class="lat">${l.qty}</span>
          <button data-inc aria-label="افزایش">${ICON.plus}</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <b style="font-size:13.5px;font-weight:500">${toman(p.price * l.qty)}</b>
          <button data-del aria-label="حذف" style="color:var(--muted);width:16px">${ICON.trash}</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function paintBag() {
  if (!drawer) return;
  const t = totals();

  if (!t.lines.length) {
    body.innerHTML = `
      <div class="empty">
        ${ICON.bag}
        <h3>سبد خالی است</h3>
        <p class="t-small" style="max-width:28ch;margin-inline:auto">
          هنوز چیزی اضافه نکرده‌اید. کالکشن این فصل منتظر شماست.
        </p>
        <a class="btn btn--ghost btn--sm" href="#/shop" data-nav style="margin-block-start:var(--s5)">دیدن کالکشن</a>
      </div>`;
    foot.innerHTML = '';
  } else {
    body.innerHTML = t.lines.map(lineHtml).join('');
    // Ask totals() rather than re-deriving the rule here — the drawer used to
    // promise "X more for free shipping" to shoppers who already had it free
    // by tier or by the POST0 coupon.
    const probe = totals({ shippingId: SHOP.shipping[0].id });
    const away = probe.shipFree ? 0 : SHOP.freeShippingOver - t.sub;
    foot.innerHTML = `
      ${away > 0 ? `
        <div class="t-fine" style="margin-block-end:var(--s4)">
          ${toman(away)} دیگر تا <b style="color:var(--thread-d);font-weight:500">ارسال رایگان</b>
          <div class="meter"><i style="width:${Math.min(100, t.sub / SHOP.freeShippingOver * 100)}%"></i></div>
        </div>` : `
        <div class="t-fine" style="margin-block-end:var(--s4);color:var(--thread-d)">این سفارش ارسال رایگان دارد</div>`}
      <div class="sums">
        ${t.savedOnList ? `<div class="save"><span>سود شما از تخفیف‌ها</span><span>${toman(t.savedOnList)}</span></div>` : ''}
        <div class="tot"><span>جمع کالاها</span><b>${toman(t.sub)}</b></div>
      </div>
      <p class="t-fine" style="margin-block:calc(var(--s2) * -1) var(--s3)">
        ارسال و تخفیف در مرحله‌ی بعد حساب می‌شود
      </p>
      <a class="btn btn--block btn--lg" href="#/checkout" data-nav>تسویه حساب</a>
      <button class="btn btn--ghost btn--block btn--sm" data-close2 style="margin-block-start:var(--s2)">ادامه‌ی خرید</button>
      <p class="t-fine" style="text-align:center;margin-block-start:var(--s3)">
        ${toman(t.earns)} اعتبار از این خرید برمی‌گردد
      </p>`;
  }

  // wiring
  $$('[data-line]', body).forEach((row) => {
    const [id, size] = row.dataset.line.split('|');
    const qty = () => state.bag.find((l) => l.id === id && l.size === size)?.qty || 0;
    $('[data-inc]', row).addEventListener('click', () => setQty(id, size, qty() + 1));
    $('[data-dec]', row).addEventListener('click', () => setQty(id, size, qty() - 1));
    $('[data-del]', row).addEventListener('click', () => {
      removeLine(id, size);
      toast('از سبد حذف شد', 'trash');
    });
  });
  $('[data-close2]', foot)?.addEventListener('click', () => closeBag());
  $$('[data-nav]', drawer).forEach((a) => a.addEventListener('click', () => closeBag()));
  settleImages(drawer);
}

export function openBag() {
  if (!drawer) build();
  paintBag();
  drawer.hidden = false;
  // Force a reflow rather than waiting on rAF — a backgrounded tab freezes
  // rAF, and the drawer would then open with no transition or not at all.
  void drawer.offsetWidth;
  drawer.classList.add('is-open');
  scrim.classList.add('is-open');
  document.body.classList.add('is-locked');
  document.body.classList.add('tabs-away');
  open = true;
  // Back should dismiss the drawer, not the page behind it
  pushOverlay('bag', () => closeBag(true));
}

export function closeBag(fromHistory = false) {
  if (!drawer || !open) return;
  drawer.classList.remove('is-open');
  scrim.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  document.body.classList.remove('tabs-away');
  open = false;
  if (!fromHistory) popOverlay('bag');
  setTimeout(() => { if (!open) drawer.hidden = true; }, 520);
}

export function initBag() {
  build();
  window.addEventListener('lauren:state', (e) => {
    if (String(e.detail.reason).startsWith('bag')) paintBag();
  });
}
