// LAUREN — simulated Shaparak-style gateway.
//
// This is a design preview: nothing leaves the browser, no network request is
// made, no card is stored, no money moves. The form is pre-filled with an
// obviously fake test card and the page says so in three places, so nobody
// mistakes it for a live payment page.

import { SHOP, PREVIEW, BRAND } from '../config.js';
import { totals, state, placeOrder } from '../store.js';
import { ICON, toast } from '../ui.js';
import { toman, esc, luhn, digitsOnly, uid, $ } from '../util.js';
import { go } from '../router.js';

const pending = () => {
  try { return JSON.parse(sessionStorage.getItem('lauren.pending') || 'null'); }
  catch { return null; }
};

export default function pay() {
  const pend = pending();
  const t = totals({ shippingId: pend?.shippingId, usePoints: pend?.usePoints || 0 });

  if (!pend || !t.lines.length) {
    return { html: `<div class="wrap empty" style="padding-block-start:calc(var(--top-h) + 70px)">
      <h3>سفارشی برای پرداخت نیست</h3>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">بازگشت به فروشگاه</a>
    </div>` };
  }

  const bank = SHOP.gateways.find((g) => g.id === pend.gateway) || SHOP.gateways[0];
  const ref = uid('TRX');

  const html = `
  <div class="gate">
    <div class="gate__card">
      <div class="gate__top">
        <div class="gate__bank"><i>ش</i>
          <div>${esc(bank.label)}<div style="font-size:11px;opacity:.6">درگاه پرداخت اینترنتی شاپرک</div></div>
        </div>
        <div class="gate__timer">زمان باقی‌مانده <b data-clock class="lat">05:00</b></div>
      </div>

      <div class="gate__warn">
        ${ICON.info}
        <div><b>پیش‌نمایش طراحی.</b> این درگاه شبیه‌سازی‌شده است، به هیچ بانکی متصل نیست و
        هیچ پرداخت واقعی انجام نمی‌شود. لطفاً اطلاعات کارت بانکی واقعی وارد نکنید —
        یک کارت آزمایشی از قبل پر شده است.</div>
      </div>

      <div class="gate__body">
        <div class="gate__row"><span>پذیرنده</span><b>${esc(BRAND.name)} · ${esc(BRAND.nameFa)}</b></div>
        <div class="gate__row"><span>شماره پیگیری</span><b class="lat">${ref}</b></div>
        <div class="gate__row"><span>مبلغ قابل پرداخت</span><b>${toman(t.grand)}</b></div>
        <hr style="border:0;border-block-start:1px solid #e6e6e4;margin:2px 0">

        <div class="gate__f">
          <label for="pan">شماره کارت</label>
          <input id="pan" inputmode="numeric" maxlength="19" dir="ltr" value="${PREVIEW.testCard}">
        </div>
        <div class="gate__grid">
          <div class="gate__f">
            <label for="cvv">CVV2</label>
            <input id="cvv" inputmode="numeric" maxlength="4" dir="ltr" value="123">
          </div>
          <div class="gate__f">
            <label for="exp">تاریخ انقضا</label>
            <input id="exp" inputmode="numeric" maxlength="5" dir="ltr" placeholder="MM/YY" value="09/09">
          </div>
        </div>
        <div class="gate__f">
          <label for="otp">رمز دوم پویا</label>
          <div class="gate__otp">
            <input id="otp" inputmode="numeric" maxlength="6" dir="ltr" placeholder="۶ رقم">
            <button class="gate__cancel" data-otp style="height:48px">دریافت رمز</button>
          </div>
          <span data-otphint style="font-size:11px;color:#8a8f97"></span>
        </div>

        <div class="gate__btns">
          <button class="gate__pay" data-do>پرداخت ${toman(t.grand)}</button>
          <button class="gate__cancel" data-cancel>انصراف</button>
        </div>

        <p style="font-size:11px;color:#8a8f97;text-align:center;line-height:1.8;margin:0">
          نمونه‌ی رابط کاربری — بدون اتصال به شبکه‌ی بانکی
        </p>
      </div>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      // group the PAN as the user types
      const pan = $('#pan', root);
      pan.addEventListener('input', () => {
        const v = digitsOnly(pan.value).slice(0, 16);
        pan.value = v.replace(/(.{4})/g, '$1 ').trim();
      });
      const exp = $('#exp', root);
      exp.addEventListener('input', () => {
        const v = digitsOnly(exp.value).slice(0, 4);
        exp.value = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
      });

      // countdown, exactly like the real thing
      let left = 300;
      const clock = $('[data-clock]', root);
      const tick = setInterval(() => {
        left--;
        const m = String(Math.floor(left / 60)).padStart(2, '0');
        const s = String(left % 60).padStart(2, '0');
        clock.textContent = `${m}:${s}`;
        if (left <= 0) { clearInterval(tick); go('/checkout'); toast('زمان پرداخت تمام شد', 'info'); }
      }, 1000);
      root.addEventListener('lauren:unmount', () => clearInterval(tick), { once: true });

      let otpCode = null;
      $('[data-otp]', root).addEventListener('click', (e) => {
        otpCode = String(Math.floor(100000 + Math.random() * 899999));
        $('[data-otphint]', root).textContent =
          `کد آزمایشی: ${otpCode} — در نسخه‌ی واقعی این کد پیامک می‌شود.`;
        $('#otp', root).focus();
        e.target.textContent = 'ارسال دوباره';
      });

      $('[data-cancel]', root).addEventListener('click', () => {
        clearInterval(tick);
        go('/checkout');
      });

      $('[data-do]', root).addEventListener('click', () => {
        const card = digitsOnly(pan.value);
        if (card.length !== 16) return toast('شماره کارت باید ۱۶ رقم باشد', 'info');
        if (!luhn(card)) return toast('شماره کارت معتبر نیست — کارت آزمایشی را دست‌نخورده بگذارید', 'info');
        if (digitsOnly($('#cvv', root).value).length < 3) return toast('CVV2 را وارد کنید', 'info');
        if (digitsOnly(exp.value).length < 4) return toast('تاریخ انقضا را کامل کنید', 'info');
        const otp = digitsOnly($('#otp', root).value);
        if (otp.length < 6) return toast('رمز دوم پویا را وارد کنید — دکمه‌ی «دریافت رمز»', 'info');
        if (otpCode && otp !== otpCode) return toast('رمز دوم درست نیست', 'info');

        clearInterval(tick);
        const btn = $('[data-do]', root);
        btn.disabled = true;
        btn.textContent = 'در حال پردازش…';

        setTimeout(() => {
          const addr = state.addresses.find((x) => x.id === pend.addressId) || state.addresses[0];
          const order = placeOrder({
            address: addr, shippingId: pend.shippingId,
            gateway: bank.label, t, ref,
          });
          sessionStorage.removeItem('lauren.pending');
          go(`/thanks?id=${order.id}`, { replace: true });
        }, 1300);
      });
    },
  };
}
