// LAUREN — home.
//
// No photograph anywhere above the fold. The first screen is the mark itself,
// drawn as a hairline outline at architectural scale with its apex aimed at the
// primary button — pure vector, so it is sharp on any display, which the
// store's 740px phone photography is not.

import { BRAND, SHOP } from '../config.js';
import { PRODUCTS, CATEGORIES, EDITORIAL } from '../data.js';
import { productCard, bindCards, photo, ICON, reveal } from '../ui.js';
import { markSvg } from '../brand.js';
import { toman, tomanRound, esc, $$ } from '../util.js';

const pick = (ids) => ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

const catTile = (c, img, i) => `
  <a class="card rv rv-d${i}" href="#/shop?cat=${c.id}">
    <div class="card__well"><div class="card__img">
      ${photo(img, c.name, { sizes: '(max-width:759px) 45vw, 22vw' })}
    </div></div>
    <div class="card__body">
      <h3 class="card__title">${esc(c.name)}</h3>
      <span class="card__meta lat">${esc(c.sub)}</span>
    </div>
  </a>`;

const edBlock = (e, flip) => `
  <div class="ed ${flip ? 'ed--flip' : ''}">
    <div class="rv"><div class="vit">
      <div class="vit__img">${photo(e.image, e.title.replace('\n', ' '), { sizes: '(max-width:899px) 90vw, 44vw' })}</div>
    </div></div>
    <div class="ed__body rv rv-d1">
      <span class="eyebrow">${esc(e.kicker)}</span>
      <h2 class="t-h1" style="margin-block-start:var(--s3)">${esc(e.title)}</h2>
      <p class="t-lede">${esc(e.body)}</p>
      <a class="btn btn--ghost" href="${e.cta.href}">${esc(e.cta.label)}</a>
    </div>
  </div>`;

export default function home() {
  const fresh = pick(['polo-steel', 'polo-jade', 'knit-ivory', 'set-olive']);
  const loved = pick(['polo-noir', 'set-cacao', 'polo-collar', 'set-onyx']);
  const memberRate = Math.round(SHOP.tiers[0].rate * 100);

  const html = `
  <section class="hero">
    <div class="hero__mark" aria-hidden="true">${markSvg({ fill: false, label: '' })}</div>
    <div class="hero__in wrap">
      <span class="label">Tabriz · Since ’۱۴۰۰</span>
      <h1 class="t-display">لباسِ ماندگار،<br>استایلِ بی‌پایان</h1>
      <p class="hero__sub t-lede">
        دوازده قطعه‌ی انتخاب‌شده از بهترین دوخت‌های ترکیه. کم، اما درست —
        هر تکه را از نزدیک دیده‌ایم و پوشیده‌ایم.
      </p>
      <div class="hero__cta">
        <a class="btn btn--lg" href="#/shop">دیدن کالکشن</a>
        <a class="btn btn--ghost btn--lg" href="#/contact">فروشگاه در اطلس</a>
      </div>

      <div class="hero__foot t-fine">
        <span>ارسال رایگان بالای ${tomanRound(SHOP.freeShippingOver)}</span>
        <span>تعویض سایز تا ۷ روز</span>
        <span>بازگشت ${memberRate}٪ اعتبار</span>
        <span class="lat">${BRAND.followers} FOLLOWERS</span>
      </div>
    </div>
  </section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow">تازه رسیده‌ها</span>
        <h2 class="t-h1">آخرین اضافه‌های این هفته</h2>
      </div>
      <a class="link" href="#/shop">همه‌ی دوازده قطعه ${ICON.back}</a>
    </div>
    <div class="grid" data-cards>
      ${fresh.map((p, i) => `<div class="rv rv-d${i % 3}">${productCard(p, { eager: i < 2 })}</div>`).join('')}
    </div>
  </section>

  <section class="sec sec--tight wrap">${edBlock(EDITORIAL[0], false)}</section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow">دسته‌بندی</span>
        <h2 class="t-h1">از کجا شروع کنیم؟</h2>
      </div>
    </div>
    <div class="grid">
      ${catTile(CATEGORIES[1], 'polo-blanc', 0)}
      ${catTile(CATEGORIES[2], 'knit-sand', 1)}
      ${catTile(CATEGORIES[3], 'set-slate', 2)}
      ${catTile(CATEGORIES[0], 'polo-noir', 3)}
    </div>
  </section>

  <section class="sec sec--tight wrap">${edBlock(EDITORIAL[1], true)}</section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow">محبوب‌ترین‌ها</span>
        <h2 class="t-h1">بیشتر از همه انتخاب می‌شوند</h2>
      </div>
      <a class="link" href="#/shop?sort=best">پرفروش‌ها ${ICON.back}</a>
    </div>
    <div class="grid" data-cards>
      ${loved.map((p, i) => `<div class="rv rv-d${i % 3}">${productCard(p)}</div>`).join('')}
    </div>
  </section>

  <section class="sec wrap">
    <div class="wallet rv">
      <div class="wallet__mark" aria-hidden="true">${markSvg({ label: '' })}</div>
      <div style="position:relative;z-index:1;max-width:52ch">
        <span class="wallet__label">کیف اعتبار لارن</span>
        <h2 class="t-h1" style="margin-block:var(--s2) var(--s4);color:inherit">
          ${memberRate}٪ هر خرید، برمی‌گردد
        </h2>
        <p style="color:rgba(237,239,234,.72);font-size:15px">
          نه امتیاز، نه واحد عجیب — اعتبارِ شما به تومان است و در خرید بعدی
          مستقیم کم می‌شود. هرچه بیشتر بخرید، درصد برگشت بالاتر می‌رود.
        </p>
        <ul style="display:grid;gap:var(--s3);margin-block:var(--s5)">
          ${SHOP.tiers.map((t) => `
            <li style="display:flex;gap:var(--s3);align-items:baseline;font-size:14px;color:rgba(237,239,234,.78)">
              <b style="min-width:74px;font-weight:500;color:#EDEFEA">${esc(t.name)}</b>
              <span class="num" style="color:#E8895F;min-width:38px">${Math.round(t.rate * 100)}٪</span>
              <span>${esc(t.perk)}</span>
            </li>`).join('')}
        </ul>
        <a class="btn btn--thread" href="#/account">${toman(SHOP.wallet.welcome)} هدیه‌ی عضویت</a>
      </div>
    </div>
  </section>

  <section class="sec sec--tight wrap">
    <div class="rv" style="display:grid;gap:var(--s5);grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
      ${[
        [ICON.truck, 'ارسال سریع', `پیک همان روز در تبریز · رایگان بالای ${tomanRound(SHOP.freeShippingOver)}`],
        [ICON.swap, 'تعویض سایز رایگان', 'تا ۷ روز پس از تحویل، هزینه‌ی برگشت با ما'],
        [ICON.shield, 'پرداخت امن', 'درگاه مستقیم بانکی، بدون واسطه'],
        [ICON.pin, 'فروشگاه حضوری', BRAND.addressShort],
      ].map(([ic, t, sub]) => `
        <div style="display:flex;gap:var(--s3);align-items:flex-start">
          <span style="width:19px;color:var(--thread);flex:none;margin-block-start:3px">${ic}</span>
          <div>
            <b style="display:block;font-size:14px;font-weight:500">${esc(t)}</b>
            <span class="t-fine">${esc(sub)}</span>
          </div>
        </div>`).join('')}
    </div>
  </section>`;

  return {
    html,
    mount(root) {
      bindCards(root);
      reveal(root);
      // Give each stroke its own length so the draw-on animation finishes
      // together instead of the short segments racing ahead.
      $$('.hero__mark path', root).forEach((path) => {
        const len = path.getTotalLength?.() || 4000;
        path.style.setProperty('--len', Math.ceil(len));
      });
    },
  };
}
