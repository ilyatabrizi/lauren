// LAUREN — product detail.

import { byId, family, PRODUCTS, chartsFor, SIZE_NOTE } from '../data.js';
import { SHOP, BRAND } from '../config.js';
const SHOP_WA = BRAND.whatsapp;
import {
  photo, productCard, bindCards, bindAccordions, accordion,
  reveal, toast, ICON, lightbox, settleImages, sizeTables,
} from '../ui.js';
import { toman, tomanRound, esc, $, $$ } from '../util.js';
import { addToBag, inWish, toggleWish, markViewed, tier, notifyMe, isNotifying } from '../store.js';
import { openBag } from '../bag.js';
import { go } from '../router.js';

export default function product(ctx) {
  const p = byId(ctx.params.id);
  if (!p) return { html: `<div class="wrap empty page-top">
      <h3>این محصول پیدا نشد</h3>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">بازگشت به فروشگاه</a>
    </div>` };

  markViewed(p.id);
  const sibs = family(p);
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.family !== p.family).slice(0, 4);
  const rate = tier().rate;
  const earns = Math.round(p.price * rate);

  const html = `
  <div class="wrap page-top">
    <nav class="crumbs">
      <a href="#/">خانه</a><span>/</span>
      <a href="#/shop?cat=${p.cat}">${esc(p.cat === 'polo' ? 'پولوشرت' : p.cat === 'knit' ? 'بافت' : 'ست')}</a>
      <span>/</span><span>${esc(p.title)}</span>
    </nav>

    <div class="pdp">
      <div class="pdp__gal">
        ${p.gallery.map((g, i) => `
          <button class="pdp__shot vit" data-zoom="assets/products/${g}.jpg" aria-label="بزرگ‌نمایی تصویر">
            <div class="vit__img">
              ${photo(g, `${p.title} — ${p.colorName}`, { eager: i === 0, sizes: '(max-width:939px) 92vw, 46vw' })}
            </div>
          </button>`).join('')}
      </div>

      <div class="pdp__info">
        <div class="pdp__ref">لارن <span class="num">${esc(p.ref)}</span></div>
        <h1>${esc(p.title)}</h1>
        <div class="pdp__latin label">${esc(p.latin)}</div>

        <div class="pdp__price">
          <b>${toman(p.price)}</b>
          ${p.compareAt ? `<s>${toman(p.compareAt)}</s>` : ''}
        </div>
        <p class="t-fine">قیمت با احتساب مالیات · ارسال در مرحله‌ی بعد محاسبه می‌شود</p>

        ${sibs.length > 1 ? `
        <div class="opt">
          <div class="opt__head"><b>رنگ</b><span>${esc(p.colorName)}</span></div>
          <div class="swatches">
            ${sibs.map((s) => `
              <a class="sw" href="#/p/${s.id}" title="${esc(s.colorName)}"
                 aria-label="${esc(s.colorName)}" aria-current="${s.id === p.id}"
                 style="background:${s.swatch}"></a>`).join('')}
          </div>
        </div>` : ''}

        <div class="opt">
          <div class="opt__head">
            <b>سایز</b>
            <button class="link" data-guide>
              ${ICON.ruler}<span>راهنمای سایز</span>
            </button>
          </div>
          <div class="sizes" role="group" aria-label="انتخاب سایز">
            ${p.sizes.map((s) => {
              const n = p.stock[s] ?? 0;
              return `<button class="size ${n === 0 ? 'is-out' : n <= 2 ? 'is-low' : ''}"
                      data-size="${s}" ${n === 0 ? 'data-out' : ''}
                      aria-pressed="false"
                      aria-label="سایز ${s}${n === 0 ? ' — ناموجود' : ''}">${s}</button>`;
            }).join('')}
          </div>
          <p class="t-fine" style="margin-block-start:10px" data-sizehint>
            ${p.sizes.some((s) => (p.stock[s] ?? 0) === 0)
              ? 'سایزهای خط‌خورده فعلاً ناموجودند — بزنید تا خبرتان کنیم.'
              : p.sizes.some((s) => (p.stock[s] ?? 0) <= 2)
                ? 'سایزهای علامت‌دار موجودی محدودی دارند.'
                : 'همه‌ی سایزها موجود است.'}
          </p>
        </div>

        <div class="pdp__buy">
          <div class="row">
            <button class="btn btn--lg" data-add>افزودن به سبد خرید</button>
            <button class="btn btn--ghost btn--lg" data-wish aria-label="علاقه‌مندی"
                    style="width:58px;padding:0">${ICON.heart}</button>
          </div>
          <button class="btn btn--ghost" data-buy>خرید سریع</button>
        </div>

        <div class="trust">
          <div>${ICON.spark}<span><b>${toman(earns)} اعتبار</b> از این خرید به کیف شما برمی‌گردد — در سفارش بعدی مستقیم کم می‌شود.</span></div>
          <div>${ICON.truck}<span>ارسال رایگان بالای ${tomanRound(SHOP.freeShippingOver)} · پیک همان روز در تبریز</span></div>
          <div>${ICON.swap}<span>تعویض سایز تا ۷ روز، رایگان —
            <a class="link" href="#/shipping" style="font-size:12.5px">شرایط</a></span></div>
          <div>${ICON.wa}<span>مطمئن نیستید کدام سایز؟
            <a class="link" style="font-size:12.5px" target="_blank" rel="noopener"
               href="https://wa.me/${SHOP_WA}?text=${encodeURIComponent(
                 `سلام، درباره‌ی «${p.title}» (لارن ${p.ref} — ${p.colorName}) سوال داشتم.`)}"
              >در واتساپ بپرسید</a></span></div>
        </div>

        ${accordion([
          { title: 'توضیح محصول', open: true, body: `
              <p>${esc(p.desc)}</p>
              <ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` },
          { title: 'جنس و اندازه', body: `
              <ul>
                <li>جنس: ${esc(p.fabric)}</li>
                <li>فرم: ${esc(p.fit)}</li>
                <li>ساخت: ${esc(p.origin)}</li>
              </ul>` },
          { title: 'نگهداری', body: `<p>${esc(p.care)}</p>` },
          { title: 'ارسال و مرجوعی', body: `
              <ul>
                ${SHOP.shipping.map((s) => `<li>${esc(s.label)} — ${esc(s.note)} · ${toman(s.cost)}</li>`).join('')}
                <li>تعویض سایز تا ۷ روز پس از تحویل، به شرط استفاده‌نشدن و سالم‌بودن اتیکت</li>
              </ul>` },
          { title: 'راهنمای سایز', body: sizeTables(chartsFor(p), SIZE_NOTE) +
      `<a class="link" href="#/size-guide" style="margin-block-start:var(--s2)">صفحه‌ی کامل راهنمای سایز</a>` },
        ])}
      </div>
    </div>
  </div>

  ${related.length ? `
  <section class="sec wrap">
    <div class="sec__head">
      <div><span class="eyebrow">شاید بپسندید</span>
      <h2 class="t-h1" style="margin-block-start:12px">با این هم خوب می‌نشیند</h2></div>
    </div>
    <div class="grid" data-cards>
      ${related.map((r, i) => `<div class="rv rv-d${i}">${productCard(r)}</div>`).join('')}
    </div>
  </section>` : ''}`;

  return {
    html,
    mount(root) {
      bindCards(root);
      bindAccordions(root);
      reveal(root);
      settleImages(root);

      let size = null;
      const btns = $$('[data-size]', root);
      const inStock = btns.filter((b) => !('out' in b.dataset));
      // preselect when there is only one size actually available
      if (inStock.length === 1) {
        inStock[0].setAttribute('aria-pressed', 'true');
        size = inStock[0].dataset.size;
      }

      btns.forEach((b) => b.addEventListener('click', () => {
        // A sold-out size is still a real control — it takes a request to be
        // told when it comes back, which is the only useful thing left to do.
        if ('out' in b.dataset) {
          const already = isNotifying(p.id, b.dataset.size);
          if (already) return toast('قبلاً ثبت شده — خبرتان می‌کنیم', 'info');
          notifyMe(p.id, b.dataset.size);
          b.classList.add('is-noted');
          toast(`سایز ${b.dataset.size} که رسید خبرتان می‌کنیم`, 'check');
          return;
        }
        btns.forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        size = b.dataset.size;
      }));
      // reflect any request made on a previous visit
      btns.forEach((b) => {
        if ('out' in b.dataset && isNotifying(p.id, b.dataset.size)) b.classList.add('is-noted');
      });

      const need = () => {
        toast('اول سایز را انتخاب کنید', 'info');
        $('.sizes', root)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return false;
      };

      $('[data-add]', root).addEventListener('click', () => {
        if (!size) return need();
        addToBag(p.id, size, 1);
        toast(`${p.title} — سایز ${size} به سبد اضافه شد`);
        openBag();
      });

      $('[data-buy]', root).addEventListener('click', () => {
        if (!size) return need();
        addToBag(p.id, size, 1);
        go('/checkout');
      });

      const wish = $('[data-wish]', root);
      const paint = () => {
        const on = inWish(p.id);
        wish.style.color = on ? 'var(--thread)' : '';
        wish.querySelector('svg').style.fill = on ? 'var(--thread)' : 'none';
        wish.setAttribute('aria-pressed', String(on));
      };
      paint();
      wish.addEventListener('click', () => {
        const on = toggleWish(p.id);
        paint();
        toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد', 'heart');
      });

      $$('[data-zoom]', root).forEach((b) =>
        b.addEventListener('click', () => lightbox(b.dataset.zoom, p.title)));

      $('[data-guide]', root)?.addEventListener('click', () => {
        const item = $$('.acc__item', root).at(-1);
        item.classList.add('is-open');
        item.querySelector('.acc__btn').setAttribute('aria-expanded', 'true');
        item.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    },
  };
}
