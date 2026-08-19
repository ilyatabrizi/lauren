// LAUREN — order confirmation.
//
// This page celebrates exactly one thing: the payment that just happened.
// Arriving any other way — a bookmark, a history entry, a shared link, a week
// later — is not a confirmation, it is a request to see the order. That is
// what #/order/:id already is (the product calls it «جزئیات و فاکتور»), and it
// carries the derived stage, so a revisit hands off there rather than growing
// a second tracker that could disagree with the first.

import { SHOP, BRAND, PREVIEW } from '../config.js';
import { state } from '../store.js';
import { ICON, reveal, toast } from '../ui.js';
import { toman, esc, faDateTime, $ } from '../util.js';
import { go } from '../router.js';
import { steps } from './checkout.js';

/** The id pay.js stamped when it handed off, if this is still that arrival. */
function confirmedId() {
  try { return sessionStorage.getItem('lauren.confirmed'); } catch { return null; }
}

export default function thanks(ctx) {
  const id = (ctx.query.get('id') || '').toUpperCase();
  // No `|| state.orders[0]` fallback: it is what made a stranger's link render
  // whichever order the CURRENT account placed last, under «سفارش شما ثبت شد».
  const o = id ? state.orders.find((x) => x.id.toUpperCase() === id) : null;
  const fresh = !!o && confirmedId() === o.id;

  if (!fresh) {
    // Hand off rather than branch in place. /order/:id owns the receipt.
    const to = o ? `/order/${o.id}` : state.orders.length ? '/account?tab=orders' : null;
    if (to) return { html: '<div class="wrap page-top"></div>', mount() { go(to, { replace: true }); } };

    return { html: `<div class="wrap empty page-top">
      ${ICON.box}
      <h3>سفارشی پیدا نشد</h3>
      <p class="t-small" style="max-width:32ch;margin-inline:auto">
        اگر شماره‌ی سفارش دارید، با آن پیگیری کنید. سفارش‌ها روی همان دستگاهی
        ذخیره می‌شوند که با آن ثبت شده‌اند.
      </p>
      <a class="btn btn--ghost btn--sm" href="#/track" style="margin-block-start:var(--s5)">پیگیری با شماره سفارش</a>
    </div>` };
  }

  const ship = SHOP.shipping.find((s) => s.id === o.shippingId);

  const html = `
  <div class="wrap page-top" style="max-width:820px">
    ${steps(3)}

    <div class="rv in" style="text-align:center;padding-block:20px 34px">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(79,157,118,.12);
                  display:grid;place-items:center;margin-inline:auto;color:var(--ok)">
        <span style="width:28px">${ICON.check}</span>
      </div>
      <h1 class="t-h1" style="margin-block:22px 12px">سفارش شما ثبت شد</h1>
      <p class="t-lede" style="max-width:44ch;margin-inline:auto">
        ممنون که ${esc(BRAND.nameFa)} را انتخاب کردید. این سفارش با شماره‌ی
        <bdi class="lat">${esc(o.id)}</bdi> ذخیره شد؛ هر وقت خواستید در
        «سفارش‌های من» یا صفحه‌ی پیگیری ببینیدش.
      </p>
      <button class="btn btn--ghost btn--sm" data-copyid style="margin-block-start:var(--s4)">
        کپی شماره سفارش
      </button>
    </div>

    <div class="panel rv">
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <div class="stat"><b class="lat" style="font-size:17px">${esc(o.id)}</b><span>شماره سفارش</span></div>
        <div class="stat"><b class="lat" style="font-size:17px">${esc(o.ref)}</b><span>کد پیگیری پرداخت</span></div>
        <div class="stat"><b style="font-size:17px">${toman(o.totals.grand)}</b><span>مبلغ پرداخت‌شده</span></div>
        <div class="stat"><b style="font-size:17px;color:var(--thread-d)">+${toman(o.earned)}</b><span>اعتبار دریافتی</span></div>
      </div>
    </div>

    <div class="panel rv rv-d1">
      <h3>اقلام سفارش</h3>
      <div class="minilines" style="max-height:none">
        ${o.items.map((i) => `
          <div class="miniline">
            <img src="assets/products/${i.img}.jpg" alt="" loading="lazy">
            <div>${esc(i.title)}<span>${esc(i.color)} · سایز <bdi class="lat">${esc(i.size)}</bdi>${
              i.qty > 1 ? ` — <bdi class="num">${i.qty}</bdi> عدد` : ''}</span></div>
            <b style="font-weight:500;white-space:nowrap">${toman(i.price * i.qty)}</b>
          </div>`).join('')}
      </div>
      <div class="sums" style="margin-block:20px 0">
        <div><span>جمع کالاها</span><span>${toman(o.totals.sub)}</span></div>
        ${o.totals.couponOff ? `<div class="save"><span>کد تخفیف</span><span>−${toman(o.totals.couponOff)}</span></div>` : ''}
        ${o.totals.creditUsed ? `<div class="save"><span>اعتبار باشگاه</span><span>−${toman(o.totals.creditUsed)}</span></div>` : ''}
        <div><span>ارسال</span><span>${o.totals.shipCost ? toman(o.totals.shipCost) : 'رایگان'}</span></div>
        <div class="tot"><span>پرداخت‌شده</span><b>${toman(o.totals.grand)}</b></div>
      </div>
    </div>

    <div class="panel rv rv-d2">
      <h3>تحویل</h3>
      <div class="trust">
        <div>${ICON.truck}<span>${esc(ship?.label || '—')} — ${esc(ship?.note || '')}</span></div>
        <div>${ICON.pin}<span>${ship?.pickup ? esc(BRAND.address)
          : [o.address?.province, o.address?.city].filter(Boolean).map(esc).join('، ')
            + (o.address?.line ? ` — ${esc(o.address.line)}` : '')}</span></div>
        <div>${ICON.clock}<span>ثبت‌شده در ${esc(faDateTime(o.ts))}</span></div>
        <div>${ICON.card}<span>پرداخت از طریق ${esc(o.gateway)}</span></div>
      </div>
    </div>

    <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr;margin-block-start:20px">
      <a class="btn" href="#/account">پیگیری در پروفایل</a>
      <a class="btn btn--ghost" href="#/shop">ادامه‌ی خرید</a>
    </div>

    <p class="t-fine" style="text-align:center;margin-block-start:24px">
      سوالی دارید؟ در واتساپ پیام بدهید —
      <a class="lat" dir="ltr" style="color:var(--thread-d)"
         href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">+${BRAND.whatsapp}</a>
    </p>

    ${PREVIEW.enabled ? `
    <p class="t-fine" style="text-align:center;margin-block-start:var(--s5)">
      ${esc(PREVIEW.note)} این رسید نمونه است و فقط روی همین دستگاه ذخیره شده.
    </p>` : ''}
  </div>`;

  return {
    html,
    mount(root) {
      reveal(root);
      // The order number is the shopper's only handle on an order that lives
      // in this browser alone — so make it one tap to keep.
      $('[data-copyid]', root)?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(o.id);
          toast('شماره سفارش کپی شد', 'check');
        } catch {
          toast(`شماره سفارش: ${o.id}`, 'info');
        }
      });
    },
  };
}
