// LAUREN — order confirmation.

import { SHOP, BRAND } from '../config.js';
import { state } from '../store.js';
import { ICON, reveal } from '../ui.js';
import { toman, esc, faDateTime } from '../util.js';
import { steps } from './checkout.js';

export default function thanks(ctx) {
  const id = ctx.query.get('id');
  const o = state.orders.find((x) => x.id === id) || state.orders[0];

  if (!o) {
    return { html: `<div class="wrap empty" style="padding-block-start:calc(var(--top-h) + 70px)">
      <h3>سفارشی پیدا نشد</h3>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">دیدن کالکشن</a>
    </div>` };
  }

  const ship = SHOP.shipping.find((s) => s.id === o.shippingId);

  const html = `
  <div class="wrap" style="padding-block-start:calc(var(--top-h) + 30px);max-width:820px">
    ${steps(3)}

    <div class="rv in" style="text-align:center;padding-block:20px 34px">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(79,157,118,.12);
                  display:grid;place-items:center;margin-inline:auto;color:var(--ok)">
        <span style="width:28px">${ICON.check}</span>
      </div>
      <h1 class="h-sec" style="margin-block:22px 12px">سفارش شما ثبت شد</h1>
      <p class="lede" style="max-width:44ch;margin-inline:auto">
        ممنون که ${esc(BRAND.nameFa)} را انتخاب کردید. جزئیات سفارش برای شماره‌ی
        <span class="lat" dir="ltr">${esc(o.address?.phone || state.user?.phone || '')}</span> پیامک می‌شود.
      </p>
    </div>

    <div class="panel rv">
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <div class="stat"><b class="lat" style="font-size:17px">${esc(o.id)}</b><span>شماره سفارش</span></div>
        <div class="stat"><b class="lat" style="font-size:17px">${esc(o.ref)}</b><span>کد پیگیری پرداخت</span></div>
        <div class="stat"><b style="font-size:17px">${toman(o.totals.grand)}</b><span>مبلغ پرداخت‌شده</span></div>
        <div class="stat"><b style="font-size:17px;color:var(--brass)">+${o.earned}</b><span>امتیاز دریافتی</span></div>
      </div>
    </div>

    <div class="panel rv rv-d1">
      <h3>اقلام سفارش</h3>
      <div class="minilines" style="max-height:none">
        ${o.items.map((i) => `
          <div class="miniline">
            <img src="assets/products/${i.img}.jpg" alt="" loading="lazy">
            <div>${esc(i.title)}<span style="display:block">${esc(i.color)} · سایز <span class="lat">${esc(i.size)}</span> · ${i.qty} عدد</span></div>
            <b style="font-weight:500;white-space:nowrap">${toman(i.price * i.qty)}</b>
          </div>`).join('')}
      </div>
      <div class="sums" style="margin-block:20px 0">
        <div><span>جمع کالاها</span><span>${toman(o.totals.sub)}</span></div>
        ${o.totals.couponOff ? `<div class="save"><span>کد تخفیف</span><span>−${toman(o.totals.couponOff)}</span></div>` : ''}
        ${o.totals.pointsOff ? `<div class="save"><span>امتیاز باشگاه</span><span>−${toman(o.totals.pointsOff)}</span></div>` : ''}
        <div><span>ارسال</span><span>${o.totals.shipCost ? toman(o.totals.shipCost) : 'رایگان'}</span></div>
        <div class="tot"><span>پرداخت‌شده</span><b>${toman(o.totals.grand)}</b></div>
      </div>
    </div>

    <div class="panel rv rv-d2">
      <h3>تحویل</h3>
      <div class="trust">
        <div>${ICON.truck}<span>${esc(ship?.label || '—')} — ${esc(ship?.note || '')}</span></div>
        <div>${ICON.pin}<span>${esc(o.address?.province || '')}، ${esc(o.address?.city || '')} — ${esc(o.address?.line || '')}</span></div>
        <div>${ICON.clock}<span>ثبت‌شده در ${esc(faDateTime(o.ts))}</span></div>
        <div>${ICON.card}<span>پرداخت از طریق ${esc(o.gateway)}</span></div>
      </div>
    </div>

    <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr;margin-block-start:20px">
      <a class="btn" href="#/account">پیگیری در پروفایل</a>
      <a class="btn btn--ghost" href="#/shop">ادامه‌ی خرید</a>
    </div>

    <p class="tiny" style="text-align:center;margin-block-start:24px">
      سوالی دارید؟ در واتساپ پیام بدهید —
      <a class="lat" dir="ltr" style="color:var(--brass)"
         href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">+${BRAND.whatsapp}</a>
    </p>
  </div>`;

  return { html, mount(root) { reveal(root); } };
}
