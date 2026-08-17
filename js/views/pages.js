// LAUREN — static pages: about, contact/store, FAQ, 404.

import { BRAND, SHOP } from '../config.js';
import { FAQ } from '../data.js';
import {
  accordion, bindAccordions, reveal, photo, ICON, settleImages,
  field, fieldError, readForm, toast,
} from '../ui.js';
import { esc, toman, faDate, validPhone, $ } from '../util.js';
import { state } from '../store.js';

/* ---------------------------------------------------------------- about -- */
export function about() {
  return {
    html: `
    <div class="wrap page-top">
      <div style="max-width:60ch">
        <span class="eyebrow">درباره‌ی ما</span>
        <h1 class="t-display" style="margin-block:16px 26px;font-size:clamp(30px,5.4vw,60px)">
          یک ویترین در اطلس،<br>یک انتخاب در هر روز
        </h1>
        <p class="t-lede">
          لارن از یک ویترین کوچک در مرکز خرید اطلس تبریز شروع شد، با یک قاعده‌ی ساده:
          هر چیزی که وارد فروشگاه می‌شود، باید چیزی باشد که خودمان می‌پوشیم.
        </p>
      </div>
    </div>

    <div class="wrap sec sec--tight">
      <div class="ed">
        <div class="rv"><div class="vit"><div class="vit__img">${photo('polo-collar--detail', 'جزئیات دوخت')}</div></div></div>
        <div class="ed__body rv rv-d1">
          <h2 class="t-h1">انتخاب، تکه‌به‌تکه</h2>
          <p class="t-lede">
            هر فصل به ترکیه می‌رویم و به‌جای سفارش کاتالوگی، تک‌تک مدل‌ها را از نزدیک می‌بینیم:
            وزنِ پارچه، تمیزی درز، فرمِ یقه بعد از چند بار پوشیدن. چیزی که این تست را رد نکند،
            به ویترین لارن نمی‌رسد.
          </p>
          <p class="t-lede" style="margin-block-start:-14px">
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
        <div class="rv"><div class="vit"><div class="vit__img">${photo('knit-ivory--detail', 'بافت ریب')}</div></div></div>
        <div class="ed__body rv rv-d1">
          <h2 class="t-h1">شعبه‌ی زنانه</h2>
          <p class="t-lede">
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
    <div class="wrap page-top">
      <span class="eyebrow">تماس و فروشگاه</span>
      <h1 class="t-h1" style="margin-block:14px 34px">بیایید حضوری ببینید</h1>

      <div class="flow">
        <div>
          <div class="panel">
            <h3>فروشگاه لارن</h3>
            <div class="trust">
              <div>${ICON.pin}<span>${esc(BRAND.address)}</span></div>
              <div>${ICON.clock}<span>${esc(BRAND.hours)}</span></div>
              <div>${ICON.phone}<span><a class="link lat" dir="ltr"
              href="tel:${BRAND.phone.replace(/\D/g, '')}">${esc(BRAND.phone)}</a></span></div>
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
                  <span style="width:18px;color:var(--thread);flex:none">${ICON.truck}</span>
                  <span class="pickitem__t">${esc(s.label)}<span class="pickitem__s">${esc(s.note)}</span></span>
                  <span class="pickitem__p">${toman(s.cost)}</span>
                </div>`).join('')}
            </div>
            <p class="t-fine" style="margin-block-start:16px">
              ارسال رایگان برای سفارش‌های بالای ${toman(SHOP.freeShippingOver)} و اعضای نقره‌ای به بالا.
            </p>
          </div>
        </div>

        <aside class="summary">
          <div class="panel">
            <h3>پیام بگذارید</h3>
            <p class="t-fine" style="margin-block-end:var(--s4)">
              پیام شما با واتساپ فروشگاه باز می‌شود — همان‌جا جواب می‌گیرید.
            </p>
            <div class="fields" data-msgform>
              ${field('cname', 'نام', { value: state.user?.name || '' })}
              ${field('cphone', 'شماره تماس', {
                value: state.user?.phone || '', dir: 'ltr', inputmode: 'numeric', maxlength: 11 })}
              ${state.orders.length ? `
              <div class="field" data-field="corder">
                <label for="f-corder">درباره‌ی سفارش (اختیاری)</label>
                <select id="f-corder" name="corder">
                  <option value="">— انتخاب نشده —</option>
                  ${state.orders.slice(0, 8).map((o) => `
                    <option value="${esc(o.id)}">${esc(o.id)} · ${esc(faDate(o.ts))}</option>`).join('')}
                </select>
                <span class="err"></span>
              </div>` : ''}
              ${field('cmsg', 'پیام', { type: 'textarea', wide: true,
                placeholder: 'مثلاً: قدم ۱۸۰ و وزنم ۷۸ است، کدام سایز مناسبم است؟' })}
            </div>
            <button class="btn btn--block btn--sm" data-send style="margin-block-start:var(--s3)">
              فرستادن در واتساپ
            </button>
          </div>

          <div class="panel">
            <h3>ما را دنبال کنید</h3>
            <p class="t-fine" style="margin-block-end:18px">
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
    mount(root) {
      reveal(root);
      $('[data-send]', root)?.addEventListener('click', () => {
        const f = readForm(root);
        if (!f.cmsg || f.cmsg.length < 4) return fieldError(root, 'cmsg', 'پیامتان را بنویسید');
        fieldError(root, 'cmsg', '');
        if (f.cphone && !validPhone(f.cphone)) return fieldError(root, 'cphone', 'شماره معتبر نیست');
        fieldError(root, 'cphone', '');
        const lines = [
          f.cname ? `از طرف ${f.cname}` : '',
          f.cphone ? `شماره: ${f.cphone}` : '',
          f.corder ? `درباره‌ی سفارش: ${f.corder}` : '',
          '', f.cmsg,
        ].filter((x) => x !== null);
        window.open(
          `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`,
          '_blank', 'noopener');
        toast('پیام آماده شد — در واتساپ بفرستید', 'wa');
      });
    },
  };
}

/* ------------------------------------------------------------------ faq -- */
export function faq() {
  return {
    html: `
    <div class="wrap page-top" style="max-width:820px">
      <span class="eyebrow">راهنما</span>
      <h1 class="t-h1" style="margin-block:14px 30px">سوال‌های پرتکرار</h1>
      ${accordion(FAQ.map((f, i) => ({ title: f.q, body: `<p>${esc(f.a)}</p>`, open: i === 0 })))}
      <div class="panel" style="margin-block-start:34px">
        <h3>جوابتان را پیدا نکردید؟</h3>
        <p class="t-fine" style="margin-block-end:18px">در واتساپ بپرسید — معمولاً زیر ۱۵ دقیقه جواب می‌دهیم.</p>
        <a class="btn btn--sm" target="_blank" rel="noopener" href="https://wa.me/${BRAND.whatsapp}">پیام در واتساپ</a>
      </div>
    </div>`,
    mount(root) { bindAccordions(root); reveal(root); },
  };
}

/* ------------------------------------------------------------------ 404 -- */
export function notFound() {
  return `
  <div class="wrap empty page-top">
    <div class="lat" style="font-size:72px;font-weight:300;color:var(--muted)">404</div>
    <h3>این صفحه پیدا نشد</h3>
    <p class="t-fine" style="max-width:32ch;margin-inline:auto">
      شاید آدرس عوض شده باشد. از فروشگاه شروع کنید.</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-block-start:24px;flex-wrap:wrap">
      <a class="btn btn--sm" href="#/shop">دیدن کالکشن</a>
      <a class="btn btn--ghost btn--sm" href="#/">صفحه‌ی اصلی</a>
    </div>
  </div>`;
}
