// LAUREN — static pages: about, contact/store, FAQ, 404.

import { BRAND, SHOP } from '../config.js';
import { FAQ } from '../data.js';
import { accordion, bindAccordions, reveal, photo, ICON, settleImages } from '../ui.js';
import { esc, toman } from '../util.js';

/* ---------------------------------------------------------------- about -- */
export function about() {
  return {
    html: `
    <div class="wrap" style="padding-block-start:calc(var(--top-h) + 40px)">
      <div style="max-width:60ch">
        <span class="eyebrow-fa">درباره‌ی ما</span>
        <h1 class="display" style="margin-block:16px 26px;font-size:clamp(30px,5.4vw,60px)">
          یک ویترین در اطلس،<br>یک انتخاب در هر روز
        </h1>
        <p class="lede">
          لارن از یک ویترین کوچک در مرکز خرید اطلس تبریز شروع شد، با یک قاعده‌ی ساده:
          هر چیزی که وارد فروشگاه می‌شود، باید چیزی باشد که خودمان می‌پوشیم.
        </p>
      </div>
    </div>

    <div class="wrap sec sec--tight">
      <div class="ed">
        <div class="ed__media rv">${photo('polo-collar--detail', 'جزئیات دوخت')}</div>
        <div class="ed__body rv rv-d1">
          <h2 class="h-sec">انتخاب، تکه‌به‌تکه</h2>
          <p class="lede">
            هر فصل به ترکیه می‌رویم و به‌جای سفارش کاتالوگی، تک‌تک مدل‌ها را از نزدیک می‌بینیم:
            وزنِ پارچه، تمیزی درز، فرمِ یقه بعد از چند بار پوشیدن. چیزی که این تست را رد نکند،
            به ویترین لارن نمی‌رسد.
          </p>
          <p class="lede" style="margin-block-start:-14px">
            نتیجه‌اش کالکشنی کوچک‌تر اما مطمئن‌تر است — کمتر انتخاب، بهتر انتخاب.
          </p>
        </div>
      </div>
    </div>

    <div class="wrap sec sec--tight">
      <div class="panel rv">
        <div style="display:grid;gap:34px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));text-align:center">
          ${[
            ['۵۶۹', 'پست منتشرشده'],
            [BRAND.followers, 'دنبال‌کننده در اینستاگرام'],
            ['۷ روز', 'مهلت تعویض سایز'],
            ['GC', 'طبقه‌ی ما در اطلس'],
          ].map(([b, s]) => `
            <div class="stat" style="justify-items:center">
              <b style="font-size:30px">${esc(b)}</b><span>${esc(s)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="wrap sec sec--tight">
      <div class="ed ed--flip">
        <div class="ed__media rv">${photo('knit-ivory--detail', 'بافت ریب')}</div>
        <div class="ed__body rv rv-d1">
          <h2 class="h-sec">شعبه‌ی زنانه</h2>
          <p class="lede">
            کالکشن زنانه‌ی لارن جدا و در صفحه‌ی اختصاصی خودش دنبال می‌شود.
          </p>
          <a class="btn btn--ghost lat" dir="ltr" target="_blank" rel="noopener"
             href="https://instagram.com/${BRAND.instagramWomen}">@${BRAND.instagramWomen}</a>
        </div>
      </div>
    </div>`,
    mount(root) { reveal(root); settleImages(root); },
  };
}

/* -------------------------------------------------------------- contact -- */
export function contact() {
  return {
    html: `
    <div class="wrap" style="padding-block-start:calc(var(--top-h) + 40px)">
      <span class="eyebrow-fa">تماس و فروشگاه</span>
      <h1 class="h-sec" style="margin-block:14px 34px">بیایید حضوری ببینید</h1>

      <div class="flow">
        <div>
          <div class="panel">
            <h3>فروشگاه لارن</h3>
            <div class="trust">
              <div>${ICON.pin}<span>${esc(BRAND.address)}</span></div>
              <div>${ICON.clock}<span>${esc(BRAND.hours)}</span></div>
              <div>${ICON.phone}<span class="lat" dir="ltr">${esc(BRAND.phone)}</span></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-block-start:24px">
              <a class="btn btn--sm" target="_blank" rel="noopener"
                 href="https://wa.me/${BRAND.whatsapp}">پیام در واتساپ</a>
              <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener"
                 href="${BRAND.mapUrl}">مسیریابی روی نقشه</a>
            </div>
          </div>

          <div class="panel">
            <h3>ارسال</h3>
            <div class="pick">
              ${SHOP.shipping.map((s) => `
                <div class="pickitem" style="cursor:default">
                  <span style="width:18px;color:var(--brass);flex:none">${ICON.truck}</span>
                  <span class="pickitem__t">${esc(s.label)}<span class="pickitem__s">${esc(s.note)}</span></span>
                  <span class="pickitem__p">${toman(s.cost)}</span>
                </div>`).join('')}
            </div>
            <p class="tiny" style="margin-block-start:16px">
              ارسال رایگان برای سفارش‌های بالای ${toman(SHOP.freeShippingOver)} و اعضای نقره‌ای به بالا.
            </p>
          </div>
        </div>

        <aside class="summary">
          <div class="panel">
            <h3>ما را دنبال کنید</h3>
            <p class="tiny" style="margin-block-end:18px">
              هر روز یک استایل تازه در اینستاگرام — قبل از اینکه به سایت برسد.
            </p>
            <div style="display:grid;gap:10px">
              <a class="btn btn--ghost btn--sm lat" dir="ltr" target="_blank" rel="noopener"
                 href="https://instagram.com/${BRAND.instagram}">@${BRAND.instagram}</a>
              <a class="btn btn--ghost btn--sm lat" dir="ltr" target="_blank" rel="noopener"
                 href="https://instagram.com/${BRAND.instagramWomen}">@${BRAND.instagramWomen}</a>
            </div>
          </div>
        </aside>
      </div>
    </div>`,
    mount(root) { reveal(root); },
  };
}

/* ------------------------------------------------------------------ faq -- */
export function faq() {
  return {
    html: `
    <div class="wrap" style="padding-block-start:calc(var(--top-h) + 40px);max-width:820px">
      <span class="eyebrow-fa">راهنما</span>
      <h1 class="h-sec" style="margin-block:14px 30px">سوال‌های پرتکرار</h1>
      ${accordion(FAQ.map((f, i) => ({ title: f.q, body: `<p>${esc(f.a)}</p>`, open: i === 0 })))}
      <div class="panel" style="margin-block-start:34px">
        <h3>جوابتان را پیدا نکردید؟</h3>
        <p class="tiny" style="margin-block-end:18px">در واتساپ بپرسید — معمولاً زیر ۱۵ دقیقه جواب می‌دهیم.</p>
        <a class="btn btn--sm" target="_blank" rel="noopener" href="https://wa.me/${BRAND.whatsapp}">پیام در واتساپ</a>
      </div>
    </div>`,
    mount(root) { bindAccordions(root); reveal(root); },
  };
}

/* ------------------------------------------------------------------ 404 -- */
export function notFound() {
  return `
  <div class="wrap empty" style="padding-block-start:calc(var(--top-h) + 80px)">
    <div class="lat" style="font-size:72px;font-weight:300;color:var(--bone-3)">404</div>
    <h3>این صفحه پیدا نشد</h3>
    <p class="tiny" style="max-width:32ch;margin-inline:auto">
      شاید آدرس عوض شده باشد. از فروشگاه شروع کنید.</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-block-start:24px;flex-wrap:wrap">
      <a class="btn btn--sm" href="#/shop">دیدن کالکشن</a>
      <a class="btn btn--ghost btn--sm" href="#/">صفحه‌ی اصلی</a>
    </div>
  </div>`;
}
