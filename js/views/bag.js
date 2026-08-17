// LAUREN — the bag as a full route.
//
// The drawer stays for a quick look after adding something, but the tab bar
// needs a real destination: a tab that sometimes opens a sheet and sometimes
// navigates is the kind of inconsistency that makes an app feel unfinished.

import { SHOP } from '../config.js';
import { totals, setQty, removeLine, state } from '../store.js';
import { PRODUCTS } from '../data.js';
import {
  ICON, photo, toast, productCard, bindCards, reveal, settleImages,
} from '../ui.js';
import { toman, tomanRound, esc, $, $$ } from '../util.js';
import { refresh } from '../router.js';

const line = (l) => {
  const p = l.product;
  return `
  <div class="bagline" data-line="${p.id}|${l.size}">
    <a class="bagline__img" href="#/p/${p.id}">
      <div>${photo(p.gallery[0], p.title)}</div>
    </a>
    <div class="bagline__body">
      <div>
        <span class="card__ref">لارن <span class="num">${esc(p.ref)}</span></span>
        <a class="bagline__t" href="#/p/${p.id}">${esc(p.title)}</a>
        <div class="t-fine">${esc(p.colorName)} · سایز <bdi class="lat">${esc(l.size)}</bdi></div>
      </div>
      <div class="bagline__foot">
        <div class="qty">
          <button data-dec aria-label="کاهش تعداد">${ICON.minus}</button>
          <span class="num">${l.qty}</span>
          <button data-inc aria-label="افزایش تعداد">${ICON.plus}</button>
        </div>
        <div class="bagline__price">
          <b>${toman(p.price * l.qty)}</b>
          ${l.qty > 1 ? `<span class="t-fine">${toman(p.price)} هر عدد</span>` : ''}
        </div>
      </div>
    </div>
    <button class="bagline__x" data-del aria-label="حذف از سبد">${ICON.close}</button>
  </div>`;
};

export default function bag() {
  const t = totals({ shippingId: SHOP.shipping[0].id });

  if (!t.lines.length) {
    const suggest = PRODUCTS.filter((p) => p.badge === 'best').slice(0, 4);
    return {
      html: `
      <div class="wrap page-top">
        <div class="empty">
          ${ICON.bag}
          <h3>سبد خرید خالی است</h3>
          <p class="t-small" style="max-width:32ch;margin-inline:auto">
            هنوز چیزی انتخاب نکرده‌اید. از پرفروش‌ترین‌ها شروع کنید.
          </p>
          <a class="btn btn--sm" href="#/shop" style="margin-block-start:var(--s5)">دیدن کالکشن</a>
        </div>
        ${suggest.length ? `
        <section class="sec sec--tight">
          <div class="sec__head"><div>
            <span class="eyebrow">پیشنهاد لارن</span>
            <h2 class="t-h2">از این‌ها شروع کنید</h2>
          </div></div>
          <div class="grid" data-cards>${suggest.map((p) => productCard(p)).join('')}</div>
        </section>` : ''}
      </div>`,
      mount(root) { bindCards(root); reveal(root); },
    };
  }

  const away = t.shipFree ? 0 : SHOP.freeShippingOver - t.sub;

  const html = `
  <div class="wrap page-top">
    <span class="eyebrow">سبد خرید</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s2)">
      ${t.count} قلم در سبد شما
    </h1>
    <p class="t-small">قیمت‌ها با احتساب مالیات است. ارسال در مرحله‌ی بعد انتخاب می‌شود.</p>

    <div class="flow" style="margin-block-start:var(--s6)">
      <div>
        <div class="panel" style="padding:0">
          ${t.lines.map(line).join('')}
        </div>

        <div class="panel" style="margin-block-start:var(--s3)">
          ${away > 0 ? `
            <div class="t-small">${toman(away)} دیگر تا <b style="color:var(--thread-d)">ارسال رایگان</b>
              <div class="meter"><i style="width:${Math.min(100, t.sub / SHOP.freeShippingOver * 100)}%"></i></div>
            </div>` : `
            <div class="t-small" style="color:var(--thread-d)">${
              t.freeReason === 'tier' ? 'ارسال رایگان — عضو باشگاه لارن' : 'این سفارش ارسال رایگان دارد'}</div>`}
        </div>

        <div class="trust" style="margin-block-start:var(--s5)">
          <div>${ICON.swap}<span>تعویض سایز تا ۷ روز، رایگان — هزینه‌ی برگشت با ما.
            <a class="link" href="#/shipping" style="font-size:12.5px">جزئیات</a></span></div>
          <div>${ICON.ruler}<span>مطمئن نیستید کدام سایز؟
            <a class="link" href="#/size-guide" style="font-size:12.5px">راهنمای سایز</a></span></div>
        </div>
      </div>

      <aside class="summary">
        <div class="panel">
          <h3>جمع سبد</h3>
          <div class="sums">
            <div><span>جمع کالاها</span><span>${toman(t.sub)}</span></div>
            ${t.savedOnList ? `<div class="save"><span>سود شما از قیمت ویژه</span><span>${toman(t.savedOnList)}</span></div>` : ''}
            <div><span>ارسال</span><span>${t.shipFree ? 'رایگان' : 'در مرحله‌ی بعد'}</span></div>
            <div class="tot"><span>مبلغ کالاها</span><b>${toman(t.sub)}</b></div>
          </div>
          <a class="btn btn--block btn--lg" href="#/checkout" style="margin-block-start:var(--s4)">
            ادامه‌ی خرید و تسویه
          </a>
          <a class="btn btn--ghost btn--block btn--sm" href="#/shop" style="margin-block-start:var(--s2)">
            افزودن محصول دیگر
          </a>
          <p class="t-fine" style="display:flex;gap:var(--s2);align-items:flex-start;margin-block-start:var(--s4)">
            <span style="width:15px;color:var(--thread-d);flex:none">${ICON.spark}</span>
            <span>${toman(t.earns)} اعتبار از این خرید به کیف شما برمی‌گردد.</span>
          </p>
        </div>
      </aside>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      reveal(root); settleImages(root);
      $$('[data-line]', root).forEach((row) => {
        const [id, size] = row.dataset.line.split('|');
        const qty = () => state.bag.find((l) => l.id === id && l.size === size)?.qty || 0;
        $('[data-inc]', row).addEventListener('click', () => { setQty(id, size, qty() + 1); refresh(); });
        $('[data-dec]', row).addEventListener('click', () => { setQty(id, size, qty() - 1); refresh(); });
        $('[data-del]', row).addEventListener('click', () => {
          removeLine(id, size);
          toast('از سبد حذف شد', 'trash');
          refresh();
        });
      });
    },
  };
}
