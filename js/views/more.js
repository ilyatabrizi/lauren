// LAUREN — the pages the shop's own copy kept promising:
// the wishlist, order tracking, the size guide, and shipping & returns.

import { BRAND, SHOP, PREVIEW } from '../config.js';
import { PRODUCTS, SIZE_CHARTS, SIZE_NOTE } from '../data.js';
import {
  state, orderStage, canCancel, cancelOrder, exchangeWindow,
  requestExchange, reorder,
} from '../store.js';
import {
  ICON, productCard, bindCards, reveal, settleImages, field, fieldError, toast, sizeTables,
} from '../ui.js';
import { toman, tomanRound, esc, faDate, faDateTime, $, $$ } from '../util.js';
import { go, refresh } from '../router.js';

/* ------------------------------------------------------------ wishlist --- */
// A guest can build one, so a guest can read one. Its own route, because it is
// where people keep the thing they are deciding about — not a settings tab.
export function wishlist() {
  const items = state.wish.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  const html = `
  <div class="wrap page-top">
    <span class="eyebrow">علاقه‌مندی‌ها</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s2)">
      ${items.length ? `${items.length} قطعه ذخیره کرده‌اید` : 'ذخیره‌شده‌های شما'}
    </h1>
    ${items.length ? `
      <p class="t-small">روی قلب بزنید تا از این فهرست حذف شود.</p>
      <div class="grid" data-cards style="margin-block-start:var(--s6)">
        ${items.map((p) => productCard(p)).join('')}
      </div>
      ${!state.user ? `
      <div class="panel" style="margin-block-start:var(--s7)">
        <h3>برای همیشه نگهشان دارید</h3>
        <p class="t-small" style="margin-block-end:var(--s4)">
          این فهرست فعلاً فقط روی همین گوشی ذخیره شده. با ورود به باشگاه روی همه‌ی
          دستگاه‌هایتان می‌ماند و ${toman(SHOP.wallet.welcome)} اعتبار هدیه می‌گیرید.
        </p>
        <a class="btn btn--sm" href="#/account">ورود با شماره موبایل</a>
      </div>` : ''}
    ` : `
      <div class="empty">
        ${ICON.heart}
        <h3>هنوز چیزی ذخیره نکرده‌اید</h3>
        <p class="t-small" style="max-width:34ch;margin-inline:auto">
          روی قلبِ گوشه‌ی هر محصول بزنید تا اینجا بماند و بعداً راحت پیدایش کنید.
        </p>
        <a class="btn btn--sm" href="#/shop" style="margin-block-start:var(--s5)">دیدن کالکشن</a>
      </div>`}
  </div>`;

  return { html, mount(root) { bindCards(root); reveal(root); settleImages(root); } };
}

/* --------------------------------------------------------------- track --- */
// Look up an order by its number, without signing in — which is how most
// people who ordered as a guest will come back.
export function track(ctx) {
  const q = (ctx.query.get('id') || '').trim().toUpperCase();
  const order = q ? state.orders.find((o) => o.id.toUpperCase() === q) : null;

  const ship = order && SHOP.shipping.find((s) => s.id === order.shippingId);
  // one source of truth, shared with the account card and the receipt
  const prog = order ? orderStage(order) : null;

  const html = `
  <div class="wrap page-top" style="max-width:760px">
    <span class="eyebrow">پیگیری سفارش</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s5)">سفارش شما کجاست؟</h1>

    <div class="panel">
      <div class="fields">
        ${field('oid', 'شماره سفارش', {
          value: q, placeholder: 'مثلاً LRAB12CD34', dir: 'ltr',
        })}
      </div>
      <button class="btn btn--sm" data-look style="margin-block-start:var(--s3)">پیگیری</button>
      <p class="t-fine" style="margin-block-start:var(--s4)">
        شماره سفارش در پیامک تایید و در صفحه‌ی
        <a class="link" href="#/account?tab=orders" style="font-size:12px">سفارش‌های من</a> هست.
      </p>
    </div>

    ${q && !order ? `
      <div class="panel" style="margin-block-start:var(--s3)">
        <h3>سفارشی با این شماره پیدا نشد</h3>
        <p class="t-small">
          شماره را یک بار دیگر ببینید، یا در واتساپ بفرستید تا دستی برایتان چک کنیم.
        </p>
        <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener"
           href="https://wa.me/${BRAND.whatsapp}" style="margin-block-start:var(--s4)">پیام در واتساپ</a>
      </div>` : ''}

    ${order ? `
      <div class="panel" style="margin-block-start:var(--s3)">
        <div style="display:flex;justify-content:space-between;gap:var(--s3);flex-wrap:wrap">
          <div>
            <div class="order__id">${esc(order.id)}</div>
            <div class="t-fine">${esc(faDateTime(order.ts))}</div>
          </div>
          <div style="text-align:end">
            <span class="order__st ${prog.cancelled ? '' : 'ok'}">${
              prog.cancelled ? 'لغو شد' : esc(prog.stage.label)}</span>
            <div style="margin-block-start:var(--s2);font-size:15px">${toman(order.totals.grand)}</div>
          </div>
        </div>

        ${prog.cancelled ? `
          <p class="t-small" style="margin-block-start:var(--s5)">
            این سفارش لغو شده و اعتبار استفاده‌شده به کیف شما برگشته است.
          </p>` : `
        <ol class="track" style="margin-block-start:var(--s6)">
          ${prog.stages.map((st, i) => `
            <li class="track__step ${i < prog.at ? 'is-done' : ''} ${i === prog.at ? 'is-now' : ''}">
              <span class="track__dot">${i < prog.at ? ICON.check : ''}</span>
              <div>
                <b>${esc(st.label)}</b>
                ${st.note ? `<span class="t-fine">${esc(st.note)}</span>` : ''}
                ${i === prog.at ? '<span class="t-fine" style="color:var(--thread-d)">مرحله‌ی فعلی</span>' : ''}
              </div>
            </li>`).join('')}
        </ol>`}

        <div class="trust" style="margin-block-start:var(--s6)">
          <div>${ICON.truck}<span>${esc(ship?.label || '—')} — ${esc(ship?.note || '')}${
            ship?.track ? ` · <a class="link" style="font-size:12.5px" target="_blank" rel="noopener" href="${ship.track}">سایت رهگیری</a>` : ''}</span></div>
          <div>${ICON.pin}<span>${ship?.pickup
            ? esc(BRAND.address)
            : `${esc(order.address?.city || '')} — ${esc(order.address?.line || '')}`}</span></div>
        </div>
        <div style="display:flex;gap:var(--s2);flex-wrap:wrap;margin-block-start:var(--s5)">
          <a class="btn btn--sm" href="#/order/${esc(order.id)}">جزئیات و فاکتور</a>
        </div>

        <div class="order__thumbs" style="margin-block-start:var(--s5)">
          ${order.items.map((i) => `<span><img src="assets/products/${i.img}.jpg" alt="${esc(i.title)}" loading="lazy"></span>`).join('')}
        </div>

        <p class="t-fine" style="margin-block-start:var(--s5)">
          ${esc(PREVIEW.note)} مراحل بالا در این پیش‌نمایش از زمان ثبت سفارش حساب می‌شود.
        </p>
      </div>` : ''}

    ${!q && state.orders.length ? `
      <div class="panel" style="margin-block-start:var(--s3)">
        <h3>سفارش‌های اخیر شما</h3>
        <div class="ledger">
          ${state.orders.slice(0, 5).map((o) => `
            <div class="ledger__row">
              <div><span class="order__id">${esc(o.id)}</span><span>${esc(faDate(o.ts))}</span></div>
              <a class="link" href="#/track?id=${esc(o.id)}">پیگیری</a>
            </div>`).join('')}
        </div>
      </div>` : ''}
  </div>`;

  return {
    html,
    mount(root) {
      reveal(root); settleImages(root);
      const look = () => {
        const v = $('[name="oid"]', root).value.trim().toUpperCase();
        if (!v) return fieldError(root, 'oid', 'شماره سفارش را وارد کنید');
        fieldError(root, 'oid', '');
        go(`/track?id=${encodeURIComponent(v)}`);
      };
      $('[data-look]', root).addEventListener('click', look);
      $('[name="oid"]', root).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); look(); }
      });
    },
  };
}

/* ---------------------------------------------------------- size guide --- */
export function sizeGuide() {
  const html = `
  <div class="wrap page-top" style="max-width:820px">
    <span class="eyebrow">راهنمای سایز</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s4)">سایزتان را یک‌بار پیدا کنید</h1>
    <p class="t-lede" style="max-width:52ch">
      همه‌ی اندازه‌ها روی لباسِ خوابیده گرفته شده — یعنی همان چیزی که با متر روی
      تخت اندازه می‌گیرید، نه دور بدنتان.
    </p>

    <div class="panel" style="margin-block-start:var(--s6)">
      <h3>جدول اندازه‌ها</h3>
      ${sizeTables([SIZE_CHARTS.top, SIZE_CHARTS.relaxed, SIZE_CHARTS.set], SIZE_NOTE)}
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>چطور اندازه بگیرید</h3>
      <div class="trust">
        <div>${ICON.ruler}<span><b>دور سینه</b> — لباسی که خوب تنتان است را بخوابانید،
          دو سانت زیر حلقه‌ی آستین را از این لبه تا آن لبه اندازه بگیرید و در ۲ ضرب کنید.</span></div>
        <div>${ICON.ruler}<span><b>قد بالاتنه</b> — از بالاترین نقطه‌ی سرشانه تا لبه‌ی پایین.</span></div>
        <div>${ICON.ruler}<span><b>سرشانه</b> — از درزِ یک شانه تا درزِ شانه‌ی دیگر، از روی پشت.</span></div>
      </div>
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>بین دو سایز هستید؟</h3>
      <div class="trust">
        <div>${ICON.swap}<span>سایز بزرگ‌تر را بگیرید. اگر نشد، <b>تعویض تا ۷ روز رایگان</b> است.</span></div>
        <div>${ICON.wa}<span>یا قد و وزنتان را در واتساپ بفرستید — خودمان می‌گوییم کدام.
          <a class="link lat" dir="ltr" href="https://wa.me/${BRAND.whatsapp}"
             target="_blank" rel="noopener" style="font-size:12.5px">+${BRAND.whatsapp}</a></span></div>
      </div>
      <div style="display:flex;gap:var(--s2);flex-wrap:wrap;margin-block-start:var(--s5)">
        <a class="btn btn--sm" href="#/shop">دیدن کالکشن</a>
        <a class="btn btn--ghost btn--sm" href="#/shipping">ارسال و مرجوعی</a>
      </div>
    </div>
  </div>`;
  return { html, mount(root) { reveal(root); } };
}

/* ----------------------------------------------------- shipping/returns --- */
export function shipping() {
  const html = `
  <div class="wrap page-top" style="max-width:820px">
    <span class="eyebrow">ارسال و مرجوعی</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s4)">چطور به دستتان می‌رسد</h1>
    <p class="t-lede" style="max-width:52ch">
      سفارش‌های ثبت‌شده تا ساعت ۱۶ همان روز آماده و تحویل داده می‌شوند.
    </p>

    <div class="panel" style="margin-block-start:var(--s6)">
      <h3>روش‌های ارسال</h3>
      <div class="pick">
        ${SHOP.shipping.map((s) => `
          <div class="pickitem" style="cursor:default">
            <span style="width:18px;color:var(--thread-d);flex:none">${ICON.truck}</span>
            <span class="pickitem__t">${esc(s.label)}<span class="pickitem__s">${esc(s.note)}</span></span>
            <span class="pickitem__p">${toman(s.cost)}</span>
          </div>`).join('')}
      </div>
      <p class="t-fine" style="margin-block-start:var(--s4)">
        سفارش‌های بالای ${tomanRound(SHOP.freeShippingOver)} و اعضای نقره‌ای به بالا،
        ارسال رایگان دارند — هر روشی که انتخاب کنید.
      </p>
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>تعویض سایز</h3>
      <div class="trust">
        <div>${ICON.clock}<span>تا <b>۷ روز</b> پس از تحویل (اعضای نقره‌ای به بالا: ۱۴ روز).</span></div>
        <div>${ICON.check}<span>به شرط <b>استفاده‌نشدن</b> و سالم بودن اتیکت و بسته‌بندی.</span></div>
        <div>${ICON.truck}<span>هزینه‌ی ارسالِ برگشت و ارسالِ سایز جدید <b>با ماست</b>.</span></div>
        <div>${ICON.wa}<span>کافی است در واتساپ شماره‌ی سفارش را بفرستید؛ پیک می‌فرستیم.</span></div>
      </div>
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>مرجوعی و بازگشت پول</h3>
      <div class="trust">
        <div>${ICON.card}<span>اگر کالا ایراد دوخت داشت یا اشتباه فرستادیم، کل مبلغ
          <b>تا ۴۸ ساعت</b> به کارتتان برمی‌گردد.</span></div>
        <div>${ICON.spark}<span>اگر ترجیح می‌دهید، همان مبلغ را
          <b>+۵٪ اضافه</b> به‌عنوان اعتبار کیف لارن می‌گذاریم.</span></div>
        <div>${ICON.info}<span>اعتباری که در سفارش استفاده شده، در صورت مرجوعی
          به کیف شما برمی‌گردد.</span></div>
      </div>
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>تحویل حضوری</h3>
      <p class="t-small" style="margin-block-end:var(--s4)">
        می‌توانید سفارش را حضوری تحویل بگیرید و همان‌جا پرو کنید — ${esc(BRAND.address)}.
        ${esc(BRAND.hours)}
      </p>
      <div style="display:flex;gap:var(--s2);flex-wrap:wrap">
        <a class="btn btn--sm" target="_blank" rel="noopener" href="${BRAND.mapUrl}">مسیریابی روی نقشه</a>
        <a class="btn btn--ghost btn--sm" href="#/faq">سوال‌های پرتکرار</a>
      </div>
    </div>
  </div>`;
  return { html, mount(root) { reveal(root); } };
}

/* -------------------------------------------------------- order detail --- */
// An order card used to be a closed box. This is where a repeat buyer actually
// lives: the receipt, reordering, cancelling, and starting an exchange.
export function orderDetail(ctx) {
  const o = state.orders.find((x) => x.id.toUpperCase() === String(ctx.params.id).toUpperCase());
  if (!o) {
    return {
      html: `<div class="wrap empty page-top">
        ${ICON.box}<h3>این سفارش پیدا نشد</h3>
        <p class="t-small" style="max-width:32ch;margin-inline:auto">
          شاید با حساب دیگری ثبت شده. با شماره‌ی سفارش هم می‌توانید پیگیری کنید.</p>
        <div style="display:flex;gap:var(--s2);justify-content:center;flex-wrap:wrap;margin-block-start:var(--s5)">
          <a class="btn btn--sm" href="#/track">پیگیری با شماره سفارش</a>
          <a class="btn btn--ghost btn--sm" href="#/account?tab=orders">سفارش‌های من</a>
        </div>
      </div>`,
      mount(root) { reveal(root); },
    };
  }

  const prog = orderStage(o);
  const ship = SHOP.shipping.find((s) => s.id === o.shippingId);
  const win = exchangeWindow(o);
  const t = o.totals;

  const html = `
  <div class="wrap page-top" style="max-width:820px">
    <nav class="crumbs">
      <a href="#/account?tab=orders">سفارش‌های من</a><span>/</span>
      <span class="order__id">${esc(o.id)}</span>
    </nav>

    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:var(--s4);flex-wrap:wrap">
      <div>
        <span class="eyebrow">سفارش</span>
        <h1 class="t-h1" style="margin-block-start:var(--s2)">
          <span class="order__id" style="font-size:inherit">${esc(o.id)}</span>
        </h1>
        <p class="t-fine">${esc(faDateTime(o.ts))}</p>
      </div>
      <div style="text-align:end">
        <span class="order__st ${o.cancelledAt ? '' : 'ok'}">${
          o.cancelledAt ? 'لغو شد' : esc(prog.stage.label)}</span>
        <div style="margin-block-start:var(--s2);font-size:17px">${toman(t.grand)}</div>
      </div>
    </div>

    <div class="panel" style="margin-block-start:var(--s6)">
      <h3>${o.cancelledAt ? 'وضعیت' : 'مسیر سفارش'}</h3>
      ${o.cancelledAt ? `
        <p class="t-small">در ${esc(faDateTime(o.cancelledAt))} لغو شد. اعتبار استفاده‌شده
        به کیف شما برگشته و اعتبار این خرید کسر شده است.</p>` : `
        <ol class="track">
          ${prog.stages.map((st, i) => `
            <li class="track__step ${i < prog.at ? 'is-done' : ''} ${i === prog.at ? 'is-now' : ''}">
              <span class="track__dot">${i < prog.at ? ICON.check : ''}</span>
              <div><b>${esc(st.label)}</b>
                ${st.note ? `<span class="t-fine">${esc(st.note)}</span>` : ''}</div>
            </li>`).join('')}
        </ol>`}
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>اقلام</h3>
      <div class="minilines" style="max-height:none">
        ${o.items.map((i) => `
          <div class="miniline">
            <a class="miniline__img" href="#/p/${i.id}">
              <img src="assets/products/${i.img}.jpg" alt="${esc(i.title)}" loading="lazy">
            </a>
            <div>
              <a href="#/p/${i.id}">${esc(i.title)}</a>
              <span>لارن <bdi class="num">${esc(i.ref || '')}</bdi> · ${esc(i.color)} ·
                سایز <bdi class="lat">${esc(i.size)}</bdi>${
                i.qty > 1 ? ` — <bdi class="num">${i.qty}</bdi> عدد` : ''}</span>
            </div>
            <b style="font-weight:500;white-space:nowrap">${toman(i.price * i.qty)}</b>
          </div>`).join('')}
      </div>
      <div class="sums" style="margin-block:var(--s5) 0">
        <div><span>جمع کالاها</span><span>${toman(t.sub)}</span></div>
        ${t.couponOff ? `<div class="save"><span>کد تخفیف</span><span>−${toman(t.couponOff)}</span></div>` : ''}
        ${t.creditUsed ? `<div class="save"><span>اعتبار باشگاه</span><span>−${toman(t.creditUsed)}</span></div>` : ''}
        <div><span>ارسال</span><span>${t.shipCost ? toman(t.shipCost) : 'رایگان'}</span></div>
        <div class="tot"><span>پرداخت‌شده</span><b>${toman(t.grand)}</b></div>
      </div>
      <p class="t-fine" style="margin-block-start:var(--s3)">
        ${o.cancelledAt ? 'اعتبار این سفارش برگشت داده شد.'
          : `${toman(o.earned)} اعتبار از این سفارش به کیف شما اضافه شد.`}
      </p>
    </div>

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>تحویل و پرداخت</h3>
      <div class="trust">
        <div>${ICON.truck}<span>${esc(ship?.label || '—')} — ${esc(ship?.note || '')}</span></div>
        <div>${ICON.pin}<span>${ship?.pickup ? esc(BRAND.address)
          : `${esc(o.address?.city || '')} — ${esc(o.address?.line || '')}`}</span></div>
        <div>${ICON.card}<span>${esc(o.gateway)} · کد پیگیری
          <bdi class="lat">${esc(o.ref)}</bdi></span></div>
      </div>
    </div>

    ${o.exchange ? `
    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>درخواست تعویض</h3>
      <div class="trust">
        <div>${ICON.swap}<span>${esc(o.exchange.title)} — از سایز
          <bdi class="lat">${esc(o.exchange.fromSize)}</bdi> به
          <bdi class="lat">${esc(o.exchange.toSize)}</bdi> · ${esc(o.exchange.reason)}</span></div>
        <div>${ICON.clock}<span>ثبت‌شده در ${esc(faDate(o.exchange.requestedAt))} —
          در حال بررسی. برای هماهنگی پیک با شما تماس می‌گیریم.</span></div>
      </div>
    </div>` : ''}

    <div class="panel" style="margin-block-start:var(--s3)">
      <h3>کاری با این سفارش دارید؟</h3>
      <div style="display:grid;gap:var(--s2)">
        <button class="btn btn--sm" data-reorder>همین سفارش را دوباره بخرم</button>
        ${!o.cancelledAt && !o.exchange && win.open ? `
          <a class="btn btn--ghost btn--sm" href="#/exchange/${esc(o.id)}">
            درخواست تعویض سایز — ${win.left} روز مهلت دارید
          </a>` : ''}
        ${!o.cancelledAt && !win.open && !o.exchange ? `
          <p class="t-fine">مهلت ${win.days} روزه‌ی تعویض این سفارش تمام شده است.</p>` : ''}
        ${canCancel(o) ? `
          <button class="btn btn--ghost btn--sm" data-cancel>لغو سفارش</button>
          <p class="t-fine">تا زمانی که سفارش از فروشگاه خارج نشده می‌توانید لغو کنید.</p>` : ''}
        <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener"
           href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
             `سلام، درباره‌ی سفارش ${o.id} سوال داشتم.`)}">
          پرسیدن درباره‌ی این سفارش در واتساپ
        </a>
      </div>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      reveal(root); settleImages(root);
      $('[data-reorder]', root).addEventListener('click', () => {
        const { added, skipped } = reorder(o.id);
        if (!added) return toast('هیچ‌کدام از اقلام این سفارش موجود نیست', 'info');
        toast(skipped.length
          ? `${added} قلم به سبد اضافه شد — ${skipped.length} قلم موجود نیست`
          : `${added} قلم به سبد اضافه شد`);
        go('/bag');
      });
      $('[data-cancel]', root)?.addEventListener('click', () => {
        if (!cancelOrder(o.id)) return toast('این سفارش دیگر قابل لغو نیست', 'info');
        toast('سفارش لغو شد و اعتبار برگشت', 'check');
        refresh();
      });
    },
  };
}

/* ------------------------------------------------------------ exchange --- */
// The free-size-exchange promise appears six times across the site. This is
// the control that keeps it. With no backend, the request is recorded on the
// order and handed to WhatsApp already written out.
export function exchange(ctx) {
  const o = state.orders.find((x) => x.id.toUpperCase() === String(ctx.params.id).toUpperCase());
  const win = o ? exchangeWindow(o) : null;

  if (!o || !win.open || o.exchange) {
    return {
      html: `<div class="wrap empty page-top">
        ${ICON.swap}
        <h3>${!o ? 'این سفارش پیدا نشد'
          : o.exchange ? 'برای این سفارش قبلاً درخواست ثبت شده'
          : 'مهلت تعویض این سفارش تمام شده'}</h3>
        <p class="t-small" style="max-width:34ch;margin-inline:auto">
          ${o && o.exchange ? 'وضعیت درخواست را در صفحه‌ی سفارش می‌بینید.'
            : 'اگر فکر می‌کنید اشتباهی شده، در واتساپ پیام بدهید — دستی بررسی می‌کنیم.'}
        </p>
        <div style="display:flex;gap:var(--s2);justify-content:center;flex-wrap:wrap;margin-block-start:var(--s5)">
          ${o ? `<a class="btn btn--sm" href="#/order/${esc(o.id)}">صفحه‌ی سفارش</a>` : ''}
          <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener"
             href="https://wa.me/${BRAND.whatsapp}">پیام در واتساپ</a>
        </div>
      </div>`,
      mount(root) { reveal(root); },
    };
  }

  const html = `
  <div class="wrap page-top" style="max-width:680px">
    <nav class="crumbs">
      <a href="#/order/${esc(o.id)}">سفارش ${esc(o.id)}</a><span>/</span><span>تعویض سایز</span>
    </nav>
    <span class="eyebrow">تعویض سایز</span>
    <h1 class="t-h1" style="margin-block:var(--s2) var(--s3)">کدام قلم را عوض کنیم؟</h1>
    <p class="t-lede">
      تعویض رایگان است و هزینه‌ی رفت و برگشت با ماست. ${win.left} روز از مهلت
      ${win.days} روزه‌ی شما مانده.
    </p>

    <form class="panel" data-form style="margin-block-start:var(--s6)" novalidate>
      <h3>قلم</h3>
      <div class="pick" data-item>
        ${o.items.map((i, idx) => `
          <label class="pickitem ${idx === 0 ? 'is-on' : ''}">
            <input type="radio" name="item" value="${idx}" ${idx === 0 ? 'checked' : ''}>
            <span class="pickitem__dot"></span>
            <span class="pickitem__t">${esc(i.title)}
              <span class="pickitem__s">${esc(i.color)} · سایز فعلی
                <bdi class="lat">${esc(i.size)}</bdi></span></span>
          </label>`).join('')}
      </div>

      <h3 style="margin-block:var(--s6) var(--s5)">سایز جدید</h3>
      <div class="sizes" data-newsize></div>
      <p class="t-fine" data-sizeerr style="min-height:18px;color:var(--thread-d)"></p>

      <h3 style="margin-block:var(--s5)">دلیل</h3>
      <div class="pick" data-reason>
        ${SHOP.exchange.reasons.map((r, i) => `
          <label class="pickitem ${i === 0 ? 'is-on' : ''}">
            <input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'checked' : ''}>
            <span class="pickitem__dot"></span>
            <span class="pickitem__t">${esc(r)}</span>
          </label>`).join('')}
      </div>

      <button class="btn btn--block btn--lg" type="submit" style="margin-block-start:var(--s6)">
        ثبت درخواست تعویض
      </button>
      <p class="t-fine" style="margin-block-start:var(--s3)">
        پس از ثبت، پیامی آماده برای واتساپ فروشگاه باز می‌شود تا درخواست
        همان لحظه به دستشان برسد.
      </p>
    </form>
  </div>`;

  return {
    html,
    mount(root) {
      const group = (sel, cb) => $$(`${sel} .pickitem`, root).forEach((it) => {
        it.addEventListener('click', () => {
          $$(`${sel} .pickitem`, root).forEach((x) => x.classList.remove('is-on'));
          it.classList.add('is-on');
          cb($('input', it).value);
        });
      });

      let itemIndex = 0, toSize = null;
      let reason = SHOP.exchange.reasons[0];

      // the new size list belongs to the chosen item, and never offers the size
      // it already is, nor one the shop has no stock of
      const paintSizes = () => {
        const item = o.items[itemIndex];
        const prod = PRODUCTS.find((x) => x.id === item.id);
        const box = $('[data-newsize]', root);
        toSize = null;
        if (!prod) { box.innerHTML = '<p class="t-fine">این محصول دیگر در کالکشن نیست.</p>'; return; }
        box.innerHTML = prod.sizes.map((sz) => {
          const out = (prod.stock?.[sz] ?? 0) === 0;
          const same = sz === item.size;
          return `<button type="button" class="size ${out || same ? 'is-out' : ''}"
            data-sz="${sz}" ${out || same ? 'disabled' : ''} aria-pressed="false"
            title="${same ? 'سایز فعلی' : out ? 'ناموجود' : ''}">${sz}</button>`;
        }).join('');
        $$('[data-sz]', box).forEach((b) => b.addEventListener('click', () => {
          $$('[data-sz]', box).forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          toSize = b.dataset.sz;
          $('[data-sizeerr]', root).textContent = '';
        }));
      };

      group('[data-item]', (v) => { itemIndex = Number(v); paintSizes(); });
      group('[data-reason]', (v) => { reason = v; });
      paintSizes();
      reveal(root);

      $('[data-form]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        if (!toSize) {
          $('[data-sizeerr]', root).textContent = 'سایز جدید را انتخاب کنید';
          return;
        }
        const rec = requestExchange(o.id, { itemIndex, toSize, reason });
        if (!rec) return toast('ثبت درخواست ممکن نشد', 'info');
        toast('درخواست تعویض ثبت شد', 'check');
        const msg = `سلام، درخواست تعویض سایز برای سفارش ${o.id}:\n`
          + `${rec.title} (لارن ${rec.ref || '—'})\n`
          + `از سایز ${rec.fromSize} به ${rec.toSize}\nدلیل: ${rec.reason}`;
        window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
        go(`/order/${o.id}`);
      });
    },
  };
}
