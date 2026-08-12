// LAUREN — home.

import { BRAND, SHOP } from '../config.js';
import { PRODUCTS, CATEGORIES, EDITORIAL } from '../data.js';
import { productCard, bindCards, photo, ICON, reveal } from '../ui.js';
import { toman, esc } from '../util.js';

const pick = (ids) => ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

const catTile = (c, img, i) => `
  <a class="card rv rv-d${i}" href="#/shop?cat=${c.id}">
    <div class="card__media">${photo(img, c.name, { sizes: '(max-width:719px) 50vw, 25vw' })}</div>
    <div class="card__body">
      <h3 class="card__title">${esc(c.name)}</h3>
      <span class="card__meta lat">${esc(c.sub)}</span>
    </div>
  </a>`;

const edBlock = (e, flip) => `
  <div class="ed ${flip ? 'ed--flip' : ''}">
    <div class="ed__media rv">${photo(e.image, e.title.replace('\n', ' '), { sizes: '(max-width:899px) 100vw, 50vw' })}</div>
    <div class="ed__body rv rv-d1">
      <span class="eyebrow-fa">${esc(e.kicker)}</span>
      <h2 class="h-sec" style="margin-block-start:14px">${esc(e.title)}</h2>
      <p class="lede">${esc(e.body)}</p>
      <a class="btn btn--ghost" href="${e.cta.href}">${esc(e.cta.label)}</a>
    </div>
  </div>`;

export default function home() {
  const fresh = pick(['polo-steel', 'polo-jade', 'knit-ivory', 'set-olive']);
  const loved = pick(['polo-noir', 'set-cacao', 'polo-collar', 'set-onyx']);

  const html = `
  <section class="hero">
    <div class="hero__bg">
      <img src="assets/brand/hero.jpg" alt="" fetchpriority="high" decoding="async">
    </div>
    <div class="hero__in wrap">
      <img class="hero__mark" src="assets/brand/mark-bone.png" alt="${BRAND.name}">
      <span class="eyebrow lat">Summer ’26 Collection</span>
      <h1 class="display" style="margin-block-start:18px">
        لباسِ ماندگار،<br>استایلِ بی‌پایان
      </h1>
      <p class="hero__sub lede">
        منتخبی از بهترین برندهای ترکیه، انتخاب‌شده تکه‌به‌تکه در تبریز.
        هر روز یک استایل تازه — یک ورژن بهتر از دیروز.
      </p>
      <div class="hero__cta">
        <a class="btn" href="#/shop">دیدن کالکشن</a>
        <a class="btn btn--ghost" href="#/shop?cat=set">ست‌های کامل</a>
      </div>
    </div>
    <div class="hero__meta">
      <span class="lat">TABRIZ · ATLAS GC</span>
      <span class="lat">EST. LAUREN</span>
      <span class="lat">${BRAND.followers} FOLLOWERS</span>
    </div>
    <div class="scrollcue"><span class="lat">SCROLL</span><i></i></div>
  </section>

  <section class="band">
    <div class="band__track">
      ${Array(2).fill(`<span>پولوشرت</span><b>·</b><span>بافت</span><b>·</b><span>ست کامل</span><b>·</b><span class="lat">TURKISH MADE</span><b>·</b><span>ارسال به سراسر ایران</span><b>·</b>`).join('')}
    </div>
  </section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow-fa">تازه رسیده‌ها</span>
        <h2 class="h-sec" style="margin-block-start:12px">آخرین اضافه‌های این هفته</h2>
      </div>
      <a class="link-u" href="#/shop">همه‌ی محصولات ${ICON.back}</a>
    </div>
    <div class="grid" data-cards>
      ${fresh.map((p, i) => `<div class="rv rv-d${i}">${productCard(p, { eager: i < 2 })}</div>`).join('')}
    </div>
  </section>

  <section class="sec sec--tight wrap">
    ${edBlock(EDITORIAL[0], false)}
  </section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow-fa">دسته‌بندی</span>
        <h2 class="h-sec" style="margin-block-start:12px">از کجا شروع کنیم؟</h2>
      </div>
    </div>
    <div class="grid">
      ${catTile(CATEGORIES[1], 'polo-blanc', 0)}
      ${catTile(CATEGORIES[2], 'knit-sand', 1)}
      ${catTile(CATEGORIES[3], 'set-slate', 2)}
      ${catTile(CATEGORIES[0], 'polo-noir', 3)}
    </div>
  </section>

  <section class="sec sec--tight wrap">
    ${edBlock(EDITORIAL[1], true)}
  </section>

  <section class="sec wrap">
    <div class="sec__head">
      <div>
        <span class="eyebrow-fa">محبوب‌ترین‌ها</span>
        <h2 class="h-sec" style="margin-block-start:12px">آنچه بیشتر می‌بریدشان</h2>
      </div>
      <a class="link-u" href="#/shop?sort=best">پرفروش‌ها ${ICON.back}</a>
    </div>
    <div class="grid" data-cards>
      ${loved.map((p, i) => `<div class="rv rv-d${i}">${productCard(p)}</div>`).join('')}
    </div>
  </section>

  <section class="sec wrap">
    <div class="ed">
      <div class="ed__media rv" style="aspect-ratio:1/1;background:var(--ink-1);display:grid;place-items:center;border:1px solid var(--line)">
        <div style="text-align:center;padding:40px">
          <div style="color:var(--brass);margin-inline:auto;width:34px">${ICON.spark}</div>
          <h3 style="font-size:clamp(22px,3vw,30px);font-weight:300;margin-block:18px 10px">باشگاه لارن</h3>
          <p class="tiny" style="max-width:30ch;margin-inline:auto">
            هر ۱۰٬۰۰۰ تومان خرید = ۱ امتیاز. هر امتیاز = ${toman(SHOP.points.tomanPerPoint)} اعتبار برای خرید بعدی.
          </p>
        </div>
      </div>
      <div class="ed__body rv rv-d1">
        <span class="eyebrow-fa">عضویت رایگان</span>
        <h2 class="h-sec" style="margin-block-start:14px">خرید کنید،<br>امتیاز جمع کنید</h2>
        <p class="lede">
          با هر خرید امتیاز می‌گیرید و هرچه بالاتر بروید، مزایای بیشتری باز می‌شود —
          از ارسال رایگان دائمی تا دسترسی زودهنگام به کالکشن‌های تازه.
        </p>
        <ul style="display:grid;gap:12px;margin-block-end:30px">
          ${SHOP.tiers.map((t) => `
            <li style="display:flex;gap:12px;align-items:center;font-size:13.5px;color:var(--bone-2)">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--brass);flex:none;opacity:.75"></span>
              <b style="font-weight:500;color:var(--bone);min-width:64px">${esc(t.name)}</b>
              <span>${esc(t.perk)}</span>
            </li>`).join('')}
        </ul>
        <a class="btn btn--brass" href="#/account">${SHOP.points.signupBonus} امتیاز هدیه‌ی عضویت</a>
      </div>
    </div>
  </section>

  <section class="sec sec--tight wrap">
    <div class="panel rv" style="display:grid;gap:26px;grid-template-columns:1fr">
      <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${[
          [ICON.truck, 'ارسال سریع', `پیک همان روز در تبریز · ارسال رایگان بالای ${toman(SHOP.freeShippingOver)}`],
          [ICON.swap, 'تعویض سایز رایگان', 'تا ۷ روز پس از تحویل، هزینه‌ی برگشت با ما'],
          [ICON.shield, 'پرداخت امن', 'درگاه‌های مستقیم بانکی، بدون واسطه'],
          [ICON.pin, 'فروشگاه حضوری', BRAND.addressShort],
        ].map(([ic, t, s]) => `
          <div style="display:flex;gap:13px;align-items:flex-start">
            <span style="width:20px;color:var(--brass);flex:none;margin-block-start:2px">${ic}</span>
            <div>
              <b style="display:block;font-size:13.5px;font-weight:500">${esc(t)}</b>
              <span class="tiny">${esc(s)}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>`;

  return {
    html,
    mount(root) { bindCards(root); reveal(root); },
  };
}
