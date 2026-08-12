// LAUREN — slide-in bag. Lives outside the router so it survives navigation.

import { SHOP } from './config.js';
import { totals, setQty, removeLine, state } from './store.js';
import { ICON, photo, settleImages, toast } from './ui.js';
import { toman, esc, $, $$ } from './util.js';

let drawer, scrim, body, foot, open = false;

function build() {
  scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.addEventListener('click', closeBag);

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
  $('[data-close]', drawer).addEventListener('click', closeBag);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closeBag();
  });
}

function lineHtml(l) {
  const p = l.product;
  return `
  <div class="line" data-line="${p.id}|${l.size}">
    <a class="line__img" href="#/p/${p.id}" data-nav>
      ${photo(p.gallery[0], p.title, { cls: '' })}
    </a>
    <div>
      <a class="line__t" href="#/p/${p.id}" data-nav>${esc(p.title)}</a>
      <div class="line__m">${esc(p.colorName)} · سایز <span class="lat">${esc(l.size)}</span></div>
      <div class="line__r">
        <div class="qty">
          <button data-dec aria-label="کاهش">${ICON.minus}</button>
          <span class="lat">${l.qty}</span>
          <button data-inc aria-label="افزایش">${ICON.plus}</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <b style="font-size:13.5px;font-weight:500">${toman(p.price * l.qty)}</b>
          <button data-del aria-label="حذف" style="color:var(--bone-3);width:16px">${ICON.trash}</button>
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
      <div class="empty" style="padding-block:70px">
        ${ICON.bag}
        <h3>سبد خالی است</h3>
        <p class="tiny" style="max-width:28ch;margin-inline:auto">
          هنوز چیزی اضافه نکرده‌اید. کالکشن این فصل منتظر شماست.
        </p>
        <a class="btn btn--ghost btn--sm" href="#/shop" data-nav style="margin-block-start:22px">دیدن کالکشن</a>
      </div>`;
    foot.innerHTML = '';
  } else {
    body.innerHTML = t.lines.map(lineHtml).join('');
    const away = SHOP.freeShippingOver - t.sub;
    foot.innerHTML = `
      ${away > 0 ? `
        <div class="tiny" style="margin-block-end:14px;padding:11px 13px;background:var(--ink-1);border-radius:3px">
          ${toman(away)} دیگر تا <b style="color:var(--brass);font-weight:500">ارسال رایگان</b>
          <div style="height:2px;background:var(--ink-3);border-radius:99px;margin-block-start:9px;overflow:hidden">
            <i style="display:block;height:100%;width:${Math.min(100, t.sub / SHOP.freeShippingOver * 100)}%;background:var(--brass)"></i>
          </div>
        </div>` : `
        <div class="tiny" style="margin-block-end:14px;color:var(--brass)">✓ این سفارش ارسال رایگان دارد</div>`}
      <div class="sums">
        ${t.savedOnList ? `<div class="save"><span>سود شما از تخفیف‌ها</span><span>${toman(t.savedOnList)}</span></div>` : ''}
        <div class="tot"><span>جمع کل</span><b>${toman(t.sub)}</b></div>
      </div>
      <a class="btn btn--block btn--lg" href="#/checkout" data-nav>تسویه حساب</a>
      <button class="btn btn--ghost btn--block btn--sm" data-close2 style="margin-block-start:8px">ادامه‌ی خرید</button>
      <p class="tiny" style="text-align:center;margin-block-start:12px">
        با این خرید ${t.earns} امتیاز می‌گیرید
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
  $('[data-close2]', foot)?.addEventListener('click', closeBag);
  $$('[data-nav]', drawer).forEach((a) => a.addEventListener('click', closeBag));
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
  open = true;
}

export function closeBag() {
  if (!drawer || !open) return;
  drawer.classList.remove('is-open');
  scrim.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  open = false;
  setTimeout(() => { if (!open) drawer.hidden = true; }, 520);
}

export function initBag() {
  build();
  window.addEventListener('lauren:state', (e) => {
    if (String(e.detail.reason).startsWith('bag')) paintBag();
  });
}
