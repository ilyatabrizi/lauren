// LAUREN — checkout: contact, address, shipping, payment method.

import { SHOP, PREVIEW, BRAND } from '../config.js';
import { totals, state, saveAddress, signIn, setName, commit } from '../store.js';
import { field, fieldError, readForm, ICON, toast, settleImages } from '../ui.js';
import { toman, tomanRound, esc, validPhone, validPostal, digitsOnly, $, $$ } from '../util.js';
import { go, refresh } from '../router.js';

const PROVINCES = ['آذربایجان شرقی', 'تهران', 'اصفهان', 'خراسان رضوی', 'فارس',
  'آذربایجان غربی', 'البرز', 'گیلان', 'مازندران', 'کرمان', 'خوزستان', 'قم', 'سایر'];

export const steps = (at) => {
  const list = [['سبد', 0], ['اطلاعات', 1], ['پرداخت', 2], ['اتمام', 3]];
  return `<div class="steps">${list.map(([t, i], k) => `
    ${k ? '<i></i>' : ''}
    <b class="${i === at ? 'on' : i < at ? 'done' : ''}">${t}</b>
  `).join('')}</div>`;
};

export function summaryPanel(t, { editable = true } = {}) {
  return `
  <aside class="summary">
    <div class="panel">
      <h3>خلاصه‌ی سفارش</h3>
      <div class="minilines">
        ${t.lines.map((l) => `
          <div class="miniline">
            <img src="assets/products/${l.product.gallery[0]}.jpg" alt="" loading="lazy">
            <div>
              ${esc(l.product.title)}
              <span>${esc(l.product.colorName)} · سایز <bdi class="lat">${esc(l.size)}</bdi>${
                l.qty > 1 ? ` — <bdi class="num">${l.qty}</bdi> عدد` : ''}</span>
            </div>
            <b style="font-weight:500;white-space:nowrap">${toman(l.product.price * l.qty)}</b>
          </div>`).join('')}
      </div>

      ${editable ? `
      <div class="coupon">
        <input id="cp" placeholder="کد تخفیف" value="${esc(state.coupon || '')}" aria-label="کد تخفیف">
        <button class="btn btn--ghost btn--sm" data-coupon>ثبت</button>
      </div>` : ''}

      <div class="sums">
        <div><span>جمع کالاها</span><span>${toman(t.sub)}</span></div>
        ${t.couponOff ? `<div class="save"><span>کد تخفیف (${esc(t.couponLabel)})</span><span>−${toman(t.couponOff)}</span></div>` : ''}
        ${t.creditUsed ? `<div class="save"><span>اعتبار باشگاه</span><span>−${toman(t.creditUsed)}</span></div>` : ''}
        <div><span>ارسال</span><span>${t.shipCost ? toman(t.shipCost) : (t.freeReason ? 'رایگان' : '—')}</span></div>
        <div class="tot"><span>مبلغ قابل پرداخت</span><b>${toman(t.grand)}</b></div>
      </div>
      <p class="t-fine" style="margin-block-start:12px;display:flex;gap:8px;align-items:flex-start">
        <span style="width:15px;color:var(--thread);flex:none">${ICON.spark}</span>
        <span>${toman(t.earns)} اعتبار پس از این خرید به کیف شما اضافه می‌شود.</span>
      </p>
    </div>
  </aside>`;
}

export default function checkout() {
  const t0 = totals({ shippingId: SHOP.shipping[0].id });
  if (!t0.lines.length) {
    return { html: `<div class="wrap empty" style="padding-block-start:calc(var(--top-h) + 70px)">
      ${ICON.bag}<h3>سبد خرید خالی است</h3>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">دیدن کالکشن</a>
    </div>` };
  }

  const u = state.user || {};
  const a = state.addresses[0] || {};
  let shippingId = SHOP.shipping[0].id;
  let gateway = SHOP.gateways[0].id;
  let useCredit = 0;

  const html = `
  <div class="wrap page-top">
    ${steps(1)}
    <div class="flow">
      <div>
        <div class="panel">
          <h3>اطلاعات تماس</h3>
          <div class="fields fields--2">
            ${field('name', 'نام و نام خانوادگی', { value: u.name || '', placeholder: 'مثلاً علی رضایی' })}
            ${field('phone', 'شماره موبایل', { value: u.phone || '', placeholder: '09xxxxxxxxx', inputmode: 'numeric', maxlength: 11, dir: 'ltr' })}
          </div>
        </div>

        <div class="panel" data-addr>
          <h3>آدرس تحویل</h3>
          <div class="fields fields--2">
            <div class="field" data-field="province">
              <label for="f-province">استان</label>
              <select id="f-province" name="province">
                ${PROVINCES.map((p) => `<option ${p === (a.province || 'آذربایجان شرقی') ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
              <span class="err"></span>
            </div>
            ${field('city', 'شهر', { value: a.city || 'تبریز' })}
            ${field('line', 'نشانی کامل', { value: a.line || '', wide: true, type: 'textarea', placeholder: 'خیابان، کوچه، پلاک، واحد' })}
            ${field('postal', 'کد پستی', { value: a.postal || '', inputmode: 'numeric', maxlength: 10, dir: 'ltr', placeholder: '۱۰ رقم' })}
            ${field('receiver', 'تحویل‌گیرنده (اختیاری)', { value: a.receiver || '', placeholder: 'اگر شخص دیگری تحویل می‌گیرد' })}
          </div>
        </div>

        <div class="panel" data-pickup-note hidden>
          <h3>تحویل حضوری</h3>
          <div class="trust">
            <div>${ICON.pin}<span>${esc(BRAND.address)}</span></div>
            <div>${ICON.clock}<span>${esc(BRAND.hours)} — سفارش تا ۲ ساعت آماده می‌شود.</span></div>
            <div>${ICON.swap}<span>می‌توانید همان‌جا پرو کنید و اگر سایز نشد عوض کنید.</span></div>
          </div>
          <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener"
             href="${BRAND.mapUrl}" style="margin-block-start:var(--s4)">مسیریابی روی نقشه</a>
        </div>

        <div class="panel">
          <h3>روش ارسال</h3>
          <div class="pick" data-ship>
            ${SHOP.shipping.map((s, i) => `
              <label class="pickitem ${i === 0 ? 'is-on' : ''}">
                <input type="radio" name="ship" value="${s.id}" ${i === 0 ? 'checked' : ''}>
                <span class="pickitem__dot"></span>
                <span class="pickitem__t">${esc(s.label)}<span class="pickitem__s">${esc(s.note)}</span></span>
                <span class="pickitem__p">${toman(s.cost)}</span>
              </label>`).join('')}
          </div>
          <p class="t-fine" style="margin-block-start:14px">
            سفارش‌های بالای ${tomanRound(SHOP.freeShippingOver)} و اعضای نقره‌ای به بالا، ارسال رایگان دارند.
          </p>
        </div>

        ${state.credit > 0 ? `
        <div class="panel">
          <h3>کیف اعتبار</h3>
          <label class="pickitem" data-usecredit>
            <span class="pickitem__dot"></span>
            <span class="pickitem__t">استفاده از اعتبار
              <span class="pickitem__s">موجودی: ${toman(state.credit)} · تا نصف مبلغ کالاها قابل استفاده است</span></span>
            <span class="pickitem__p" data-creditmax>−${toman(t0.maxCredit)}</span>
          </label>
        </div>` : ''}

        <div class="panel">
          <h3>درگاه پرداخت</h3>
          <div class="pick" data-gate>
            ${SHOP.gateways.map((g, i) => `
              <label class="pickitem ${i === 0 ? 'is-on' : ''}">
                <input type="radio" name="gate" value="${g.id}" ${i === 0 ? 'checked' : ''}>
                <span class="pickitem__dot"></span>
                <span class="pickitem__t">${esc(g.label)}<span class="pickitem__s">${esc(g.sub)}</span></span>
                <span style="width:18px;color:var(--muted)">${ICON.card}</span>
              </label>`).join('')}
          </div>
          ${PREVIEW.enabled ? `
          <p class="t-fine" style="margin-block-start:16px;display:flex;gap:8px;align-items:flex-start;
                    padding:12px 13px;background:rgba(194,163,107,.07);border-radius:3px">
            <span style="width:15px;color:var(--thread);flex:none">${ICON.info}</span>
            <span>${esc(PREVIEW.note)} در صفحه‌ی بعد یک کارت آزمایشی از قبل پر شده است — اطلاعات کارت واقعی وارد نکنید.</span>
          </p>` : ''}
          <button class="btn btn--block btn--lg" data-pay style="margin-block-start:20px">
            رفتن به درگاه پرداخت
          </button>
        </div>
      </div>

      <div data-summary>${summaryPanel(t0)}</div>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      settleImages(root);
      // The bag can change under this view (the drawer is global), and a stale
      // summary would send a different amount to the gateway than the one on
      // screen. Re-render the whole route when it does.
      const onBag = (e) => {
        if (String(e.detail?.reason).startsWith('bag')) refresh();
      };
      window.addEventListener('lauren:state', onBag);
      root.addEventListener('lauren:unmount',
        () => window.removeEventListener('lauren:state', onBag), { once: true });
      const repaint = () => {
        const t = totals({ shippingId, useCredit, coupon: state.coupon });
        $('[data-summary]', root).innerHTML = summaryPanel(t);
        // the credit row quotes a cap derived from the coupon, so it goes
        // stale the moment a code is applied unless it repaints too
        const max = $('[data-creditmax]', root);
        if (max) max.textContent = `−${toman(t.maxCredit)}`;
        if (useCredit) useCredit = t.maxCredit;
        bindCoupon();
        settleImages(root);
      };

      function bindCoupon() {
        $('[data-coupon]', root)?.addEventListener('click', () => {
          const code = $('#cp', root).value.trim().toUpperCase();
          if (!code) { state.coupon = null; commit('coupon'); repaint(); return; }
          if (SHOP.coupons[code]) {
            state.coupon = code;
            toast(`کد تخفیف اعمال شد — ${SHOP.coupons[code].label}`, 'gift');
          } else {
            state.coupon = null;
            toast('این کد تخفیف معتبر نیست', 'info');
          }
          commit('coupon');   // otherwise a reload silently drops the discount
          repaint();
        });
      }
      bindCoupon();

      const group = (sel, onPick) => {
        $$(`${sel} .pickitem`, root).forEach((item) => {
          item.addEventListener('click', () => {
            $$(`${sel} .pickitem`, root).forEach((x) => x.classList.remove('is-on'));
            item.classList.add('is-on');
            onPick($('input', item).value);
          });
        });
      };
      const isPickup = () => !!SHOP.shipping.find((x) => x.id === shippingId)?.pickup;
      const syncPickup = () => {
        const pick = isPickup();
        $('[data-addr]', root).hidden = pick;
        $('[data-pickup-note]', root).hidden = !pick;
      };
      group('[data-ship]', (v) => { shippingId = v; syncPickup(); repaint(); });
      syncPickup();
      group('[data-gate]', (v) => { gateway = v; });

      $('[data-usecredit]', root)?.addEventListener('click', function () {
        const on = this.classList.toggle('is-on');
        useCredit = on ? totals({ shippingId, coupon: state.coupon }).maxCredit : 0;
        repaint();
      });

      $('[data-pay]', root).addEventListener('click', () => {
        if (!totals().lines.length) {
          toast('سبد خرید خالی شده است', 'info');
          return go('/shop');
        }
        const f = readForm(root);
        let ok = true;
        const req = (k, msg, test = (v) => !!v) => {
          const bad = !test(f[k]);
          fieldError(root, k, bad ? msg : '');
          if (bad) ok = false;
        };
        req('name', 'نام را وارد کنید');
        req('phone', 'شماره موبایل معتبر نیست', validPhone);
        if (!isPickup()) {
          req('line', 'نشانی را وارد کنید', (v) => v && v.length > 9);
          req('postal', 'کد پستی باید ۱۰ رقم باشد', validPostal);
        } else {
          fieldError(root, 'line', ''); fieldError(root, 'postal', '');
        }

        if (!ok) {
          toast('چند مورد را کامل کنید', 'info');
          $('.field.bad', root)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }

        signIn({ phone: digitsOnly(f.phone) });
        setName(f.name);
        const addr = isPickup()
          ? { id: 'pickup', label: 'تحویل حضوری', city: 'تبریز',
              line: BRAND.address, postal: '', phone: digitsOnly(f.phone) }
          : saveAddress({
              id: state.addresses[0]?.id,
              label: 'آدرس اصلی',
              province: f.province, city: f.city, line: f.line,
              postal: digitsOnly(f.postal), receiver: f.receiver, phone: digitsOnly(f.phone),
            });

        sessionStorage.setItem('lauren.pending', JSON.stringify({
          // stamp the identity: the gateway must refuse a basket that was
          // priced for a different customer, or for none
          phone: state.user?.phone || '',
          addressId: addr.id, shippingId, gateway, useCredit,
          quoted: totals({ shippingId, useCredit, coupon: state.coupon }).grand,
        }));
        go('/pay');
      });
    },
  };
}
