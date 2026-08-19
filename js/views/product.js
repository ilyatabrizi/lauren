// LAUREN — product detail.

import { byId, family, PRODUCTS, chartsFor, SIZE_NOTE } from '../data.js';
import { SHOP, BRAND, PREVIEW } from '../config.js';
const SHOP_WA = BRAND.whatsapp;
import {
  photo, productCard, bindCards, bindAccordions, accordion,
  reveal, toast, ICON, lightbox, settleImages, sizeTables, field, stars,
} from '../ui.js';
import { toman, tomanRound, esc, faDate, $, $$ } from '../util.js';
import {
  addToBag, inWish, toggleWish, markViewed, tier, notifyMe, isNotifying,
  state, reviewsFor, myReview, canReview, saveReview, removeReview,
  reviewSummary, shownReviews,
} from '../store.js';
import { openBag } from '../bag.js';
import { go, refresh } from '../router.js';

// Persian decimal separator is ٫ (U+066B). The digits themselves are left
// alone — IRANYekanXFaNum substitutes ۰–۹ in the font, so converting here
// would double-convert.
const faAvg = (n) => n.toFixed(1).replace('.', '٫');

/** One review row. `own` adds the edit affordance; a sample never gets the
 *  verified-purchase pill, only the «نمونه» tag. */
function revRow(r, own) {
  return `
  <article class="rev ${r.sample ? 'rev--sample' : ''}">
    <div class="rev__hd">
      ${stars(r.stars)}
      <span class="rev__who">${esc(r.name)}</span>
      ${r.sample
        ? '<span class="tag tag--quiet">نمونه</span>'
        : '<span class="order__st ok">خرید تاییدشده</span>'}
      ${own ? '<span class="tag tag--quiet">نظر شما</span>' : ''}
      <span class="rev__when">${esc(faDate(r.ts))}</span>
    </div>
    ${!r.sample && r.color ? `<div class="rev__buy">خریداری‌شده: ${esc(r.color)} — سایز
      <bdi class="lat">${esc(r.size)}</bdi></div>` : ''}
    ${r.body ? `<p class="rev__body">${esc(r.body)}</p>` : ''}
  </article>`;
}

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

  // Reviews belong to the garment, not the colourway — see store.js.
  const sum = reviewSummary(p.family);
  const shown = shownReviews(p.family);
  const real = shown.filter((r) => !r.sample);
  const samples = shown.filter((r) => r.sample);
  const gate = canReview(p.family);
  const mine = myReview(p.family);

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
        ${sum.count ? `<button class="link" data-toreviews style="display:flex;gap:var(--s2);
          align-items:center;margin-block-start:var(--s2)">${stars(Math.round(sum.avg))}
          <span>${faAvg(sum.avg)} · ${sum.count} نظر</span></button>` : ''}

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
              ? 'سایزهای خط‌خورده فعلاً ناموجودند — بزنید تا پیام آماده‌ی واتساپ باز شود.'
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

  <section class="sec wrap" id="reviews">
    <div class="sec__head">
      <div><span class="eyebrow">نظر خریداران</span>
      <h2 class="t-h1" style="margin-block-start:12px">کسانی که این را خریده‌اند چه گفتند</h2></div>
    </div>

    <div class="panel">
      ${sum.count ? `
        <div style="display:flex;gap:var(--s5);align-items:center;flex-wrap:wrap">
          <div>
            <div style="font-size:30px;line-height:1.2">${faAvg(sum.avg)}</div>
            ${stars(Math.round(sum.avg))}
            <p class="t-fine" data-revcount style="margin-block-start:var(--s2)">از ${sum.count} نظر</p>
          </div>
          <div class="rev__dist" style="flex:1;min-width:200px">
            ${[5, 4, 3, 2, 1].map((n) => `
              <div class="rev__row">
                <span>${n} ستاره</span>
                <span class="rev__track"><span class="rev__fill" style="width:${
                  sum.count ? Math.round(sum.dist[n - 1] / sum.count * 100) : 0}%"></span></span>
                <span>${sum.dist[n - 1]}</span>
              </div>`).join('')}
          </div>
        </div>` : `
        <div class="empty" style="padding-block:var(--s5)">
          ${ICON.star}
          <h3>هنوز نظری ثبت نشده</h3>
          <p class="t-small" style="max-width:38ch;margin-inline:auto">
            نظرها فقط از خریدارانی گرفته می‌شود که سفارش‌شان تحویل شده. اولین نفر باشید.
          </p>
        </div>`}

      ${real.length ? `<div style="margin-block-start:var(--s5)">
        ${real.map((r) => revRow(r, r.phone === state.user?.phone)).join('')}
      </div>` : ''}

      ${gate ? `
      <div class="rev__form" data-revform style="margin-block-start:var(--s6);
           padding-block-start:var(--s5);border-block-start:1px solid var(--rule)">
        <h3>${mine ? 'نظر خودتان را به‌روز کنید' : 'نظرتان را بنویسید'}</h3>
        <p class="t-fine" style="margin-block:var(--s2) var(--s4)">
          خرید شما تایید شده — ${esc(gate.item.color)} · سایز
          <bdi class="lat">${esc(gate.item.size)}</bdi>، سفارش
          <bdi class="lat">${esc(gate.order.id)}</bdi>
        </p>
        <span class="t-small" id="rlab" style="display:block;margin-block-end:var(--s2)">امتیاز شما</span>
        <div class="rating" data-rating role="group" aria-labelledby="rlab">
          ${[1, 2, 3, 4, 5].map((i) => `
            <button type="button" data-star="${i}" aria-label="${i} ستاره"
                    aria-pressed="${mine && mine.stars === i ? 'true' : 'false'}">${ICON.star}</button>`).join('')}
        </div>
        <div class="fields" style="margin-block-start:var(--s4)">
          ${field('rbody', 'نظرتان درباره‌ی جنس، دوخت و سایز', {
            type: 'textarea', wide: true, value: mine?.body || '',
            placeholder: 'مثلاً: سایز L برای قد ۱۸۰ و وزن ۷۸ اندازه بود؛ پارچه‌اش وزن‌دار است.',
          })}
        </div>
        <p class="t-fine" data-reverr style="min-height:18px;color:var(--thread-d)"></p>
        <div style="display:flex;gap:var(--s2);flex-wrap:wrap">
          <button class="btn btn--sm" data-revsave>${mine ? 'به‌روزرسانی نظر' : 'ثبت نظر'}</button>
          ${mine ? '<button class="btn btn--ghost btn--sm" data-revdel>حذف نظر</button>' : ''}
        </div>
        <p class="t-fine" style="margin-block-start:var(--s3)">
          نظر شما در این پیش‌نمایش روی همین دستگاه ذخیره می‌شود.
        </p>
      </div>` : ''}

      ${samples.length ? `
      <div style="margin-block-start:var(--s6);padding-block-start:var(--s5);
                  border-block-start:1px solid var(--rule)">
        <span class="eyebrow">نمونه‌ی نمایشی</span>
        <div style="margin-block-start:var(--s3)">
          ${samples.map((r) => revRow(r, false)).join('')}
        </div>
        <p class="t-fine" style="margin-block-start:var(--s4)">
          ${esc(PREVIEW.note)} این نظرها نمونه‌ی طراحی‌اند و از مشتری واقعی نیستند؛
          در میانگین امتیاز حساب نمی‌شوند.
        </p>
      </div>` : ''}
    </div>
  </section>

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

      const askForSize = (size) => {
        const msg = `سلام، سایز ${size} از «${p.title}» (لارن ${p.ref} — ${p.colorName})`
          + ' را می‌خواهم؛ وقتی موجود شد خبرم کنید.';
        window.open(`https://wa.me/${SHOP_WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      };

      btns.forEach((b) => b.addEventListener('click', () => {
        // A sold-out size is still a real control — it takes a request to be
        // told when it comes back, which is the only useful thing left to do.
        if ('out' in b.dataset) {
          // Nothing in a static build can send the shopper a restock message,
          // so the tap opens the one channel that can answer. The local note
          // stays: it is what repaints .is-noted on a later visit.
          const size = b.dataset.size;
          const already = isNotifying(p.id, size);
          if (!already) notifyMe(p.id, size);
          b.classList.add('is-noted');
          askForSize(size);
          toast(already
            ? 'قبلاً یادداشت شده — پیام واتساپ دوباره باز شد'
            : `سایز ${size} یادداشت شد — پیام واتساپ آماده است`, already ? 'info' : 'check');
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

      /* ------------------------------------------------------------ reviews */
      const toReviews = () => $('#reviews', root)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      $('[data-toreviews]', root)?.addEventListener('click', toReviews);
      // The order page links here with ?to=reviews. It must be a query param —
      // the router splits on '?' only, so a second '#' lands inside params.id.
      if (ctx.query.get('to') === 'reviews') setTimeout(toReviews, 120);

      const form = $('[data-revform]', root);
      if (form) {
        let picked = mine?.stars || 0;
        const err = $('[data-reverr]', form);
        const starBtns = $$('[data-star]', form);
        starBtns.forEach((b) => b.addEventListener('click', () => {
          picked = Number(b.dataset.star);
          starBtns.forEach((x) => x.setAttribute('aria-pressed',
            String(Number(x.dataset.star) <= picked)));
          err.textContent = '';
        }));
        // reflect an existing rating across the whole run, not just its own box
        if (picked) starBtns.forEach((x) => x.setAttribute('aria-pressed',
          String(Number(x.dataset.star) <= picked)));

        $('[data-revsave]', form).addEventListener('click', () => {
          if (!picked) { err.textContent = 'امتیاز را انتخاب کنید'; return; }
          const body = $('[name="rbody"]', form).value;
          if (!saveReview({ family: p.family, stars: picked, body })) {
            toast('ثبت نظر ممکن نشد', 'info');
            return;
          }
          toast('نظر شما ثبت شد', 'check');
          go(`/p/${p.id}?to=reviews`);
        });

        $('[data-revdel]', form)?.addEventListener('click', () => {
          // mirror the save path: a control that silently does nothing reads as broken
          if (!mine || !removeReview(mine.id)) return toast('حذف نظر ممکن نشد', 'info');
          toast('نظر شما حذف شد', 'info');
          go(`/p/${p.id}?to=reviews`);
        });
      }
    },
  };
}
