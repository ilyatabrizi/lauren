// LAUREN — account: sign in, the credit wallet, orders, wishlist, address.

import { SHOP, BRAND, PREVIEW } from '../config.js';
import { PRODUCTS } from '../data.js';
import {
  state, tier, signIn, signOut, saveAddress, setName, orderStage, exchangeWindow,
} from '../store.js';
import {
  ICON, field, fieldError, readForm, toast, productCard,
  bindCards, reveal, settleImages, photoUrl,} from '../ui.js';
import { markSvg } from '../brand.js';
import { toman, tomanRound, esc, faDate, validPhone, validPostal, digitsOnly, $, $$ } from '../util.js';
import { go } from '../router.js';

/* ------------------------------------------------------------- sign in --- */
// Phone first, then a four-box code. No Iranian shop asks for a name before it
// will send a code, so the name is collected later — at checkout, where it is
// actually needed for the delivery.
function signInView() {
  const rate = Math.round(SHOP.tiers[0].rate * 100);
  return {
    html: `
    <div class="wrap page-top">
      <div class="auth">
        <div class="auth__mark">${markSvg({ label: 'LAUREN' })}</div>
        <h1 class="t-h1" style="text-align:center;margin-block:var(--s5) var(--s3)">
          ورود به باشگاه لارن
        </h1>
        <p class="t-lede" style="text-align:center">
          فقط با شماره‌ی موبایل. عضویت رایگان است، ${toman(SHOP.wallet.welcome)}
          اعتبار هدیه می‌گیرید و ${rate}٪ هر خرید به کیفتان برمی‌گردد.
        </p>

        <div class="panel" style="margin-block-start:var(--s6)">
          <form data-step1 novalidate>
            ${field('phone', 'شماره موبایل', {
              placeholder: '09xxxxxxxxx', inputmode: 'numeric', maxlength: 11,
              dir: 'ltr', autocomplete: 'tel',
            })}
            <button class="btn btn--block btn--lg" type="submit">نمایش کد آزمایشی</button>
          </form>

          <form data-step2 hidden novalidate>
            <p class="t-small" data-sent style="margin-block-end:var(--s4)"></p>
            <div class="otp" data-otp>
              ${[0, 1, 2, 3].map((i) => `
                <input inputmode="numeric" maxlength="1" aria-label="رقم ${i + 1}"
                       autocomplete="${i === 0 ? 'one-time-code' : 'off'}">`).join('')}
            </div>
            <p class="t-fine" data-otperr style="min-height:18px;color:var(--thread-d);margin-block-start:var(--s2)"></p>
            <button class="btn btn--block btn--lg" type="submit">ورود</button>
            <div style="display:flex;justify-content:space-between;margin-block-start:var(--s3)">
              <button class="link" type="button" data-resend disabled>کد تازه</button>
              <button class="link" type="button" data-back>تغییر شماره</button>
            </div>
          </form>
        </div>

        <p class="t-fine" style="text-align:center;margin-block-start:var(--s4)">
          ${PREVIEW.enabled ? `${esc(PREVIEW.note)} کد تایید روی همین صفحه نشان داده می‌شود.` : ''}
        </p>
      </div>
    </div>`,
    mount(root) {
      let code = null, timer = null;
      const s1 = $('[data-step1]', root), s2 = $('[data-step2]', root);
      const boxes = $$('.otp input', root);
      const resend = $('[data-resend]', root);

      const send = () => {
        code = String(Math.floor(1000 + Math.random() * 8999));
        const phone = $('[name="phone"]', root).value.trim();
        // The code is generated here and printed here — nothing is sent. Say so
        // in the same breath, the way the gateway already does (pay.js).
        $('[data-sent]', root).innerHTML =
          `کد آزمایشی برای <span class="lat">${esc(phone)}</span>: ` +
          `<b class="num" style="color:var(--thread-d)">${code}</b>` +
          ' — در نسخه‌ی واقعی این کد پیامک می‌شود.';
        boxes.forEach((b) => { b.value = ''; b.classList.remove('bad'); });
        boxes[0].focus();
        let left = 60;
        resend.disabled = true;
        clearInterval(timer);
        timer = setInterval(() => {
          left--;
          resend.textContent = left > 0 ? `کد تازه تا ${left} ثانیه` : 'کد تازه';
          if (left <= 0) { resend.disabled = false; clearInterval(timer); }
        }, 1000);
        resend.textContent = `کد تازه تا ${left} ثانیه`;
      };

      s1.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = $('[name="phone"]', root).value.trim();
        if (!validPhone(phone)) return fieldError(root, 'phone', 'شماره موبایل با ۰۹ شروع می‌شود و ۱۱ رقم است');
        fieldError(root, 'phone', '');
        s1.hidden = true; s2.hidden = false;
        send();
      });

      resend.addEventListener('click', send);
      $('[data-back]', root).addEventListener('click', () => {
        clearInterval(timer);
        s2.hidden = true; s1.hidden = false;
      });

      // one digit per box, moving forward as you type and back on delete
      boxes.forEach((box, i) => {
        box.addEventListener('focus', () => box.select());
        box.addEventListener('input', () => {
          // take the digit just typed, not the one already sitting there
          box.value = box.value.replace(/\D/g, '').slice(-1);
          box.classList.remove('bad');
          if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
          if (boxes.every((b) => b.value)) s2.requestSubmit();
        });
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
        });
        box.addEventListener('paste', (e) => {
          const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
          if (!digits) return;
          e.preventDefault();
          digits.split('').forEach((d, k) => { if (boxes[k]) boxes[k].value = d; });
          boxes[Math.min(digits.length, 3)].focus();
          if (boxes.every((b) => b.value)) s2.requestSubmit();
        });
      });

      s2.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = boxes.map((b) => b.value).join('');
        if (entered !== code) {
          boxes.forEach((b) => { b.classList.add('bad'); b.value = ''; });
          $('[data-otperr]', root).textContent = 'کد وارد شده درست نیست — دوباره وارد کنید';
          boxes[0].focus();
          return;
        }
        clearInterval(timer);
        const gifted = signIn({ phone: $('[name="phone"]', root).value.trim() });
        toast(gifted ? `خوش آمدید — ${toman(SHOP.wallet.welcome)} اعتبار هدیه گرفتید` : 'خوش برگشتید', 'spark');
        go('/account');
      });

      root.addEventListener('lauren:unmount', () => clearInterval(timer), { once: true });
    },
  };
}

/* ---------------------------------------------------------------- wallet -- */
function walletPanel() {
  const { tier: t, next, toNext, progress, rate } = tier();
  const spent = state.orders.reduce((n, o) => n + o.totals.goods, 0);

  return `
  <div class="wallet">
    <div class="wallet__mark" aria-hidden="true">${markSvg({ label: '' })}</div>
    <span class="wallet__label">اعتبار قابل استفاده</span>
    <div class="wallet__amt">${toman(state.credit)}</div>
    <div class="wallet__row">
      <div class="wallet__stat">
        <b>${esc(t.name)}</b><span>سطح شما · ${Math.round(rate * 100)}٪ برگشت</span>
      </div>
      <div class="wallet__stat">
        <b>${toman(spent)}</b><span>خرید شما تا امروز</span>
      </div>
    </div>
    <div class="ladder">
      <div class="ladder__track"><div class="ladder__fill" style="width:${progress * 100}%"></div></div>
      <div class="ladder__marks">
        ${SHOP.tiers.map((x) => `
          <b class="${state.spend12 >= x.minSpend ? 'on' : ''}">${esc(x.name)} · ${Math.round(x.rate * 100)}٪</b>
        `).join('')}
      </div>
      <p style="font-size:12.5px;color:rgba(237,239,234,.6)">
        ${next
          ? `${toman(toNext)} خرید دیگر تا سطح ${esc(next.name)} — ${esc(next.perk)}`
          : 'بالاترین سطح باشگاه'}
      </p>
    </div>
  </div>

  <div class="panel" style="margin-block-start:var(--s3)">
    <h3>قانون‌های باشگاه</h3>
    <div class="trust">
      <div>${ICON.spark}<span><b>${Math.round(rate * 100)}٪ از هر خرید</b> به‌صورت اعتبار به کیف شما برمی‌گردد — روی مبلغ کالاها، بدون هزینه‌ی ارسال.</span></div>
      <div>${ICON.card}<span>در هر سفارش تا <b>نصف مبلغ کالاها</b> را می‌توانید با اعتبار بپردازید.</span></div>
      <div>${ICON.box}<span>سطح شما با <b>خرید ۱۲ ماه گذشته</b> تعیین می‌شود، نه با موجودی کیف.</span></div>
      <div>${ICON.clock}<span>اعتبار تا <b>${SHOP.wallet.expiryMonths} ماه</b> پس از دریافت معتبر است.</span></div>
    </div>
  </div>

  ${state.ledger.length ? `
  <div class="panel" style="margin-block-start:var(--s3)">
    <h3>گردش اعتبار</h3>
    <div class="ledger">
      ${state.ledger.slice(0, 12).map((r) => `
        <div class="ledger__row">
          <div>${esc(r.note)}<span>${esc(faDate(r.ts))}${r.ref ? ` · <span class="lat">${esc(r.ref)}</span>` : ''}</span></div>
          <div class="ledger__amt ${r.amount >= 0 ? 'plus' : 'minus'}">
            ${r.amount >= 0 ? '+' : '−'}${toman(Math.abs(r.amount))}
          </div>
        </div>`).join('')}
    </div>
  </div>` : ''}`;
}

/* -------------------------------------------------------------- orders --- */
function ordersPanel() {
  if (!state.orders.length) {
    return `<div class="empty">${ICON.box}
      <h3>هنوز سفارشی ندارید</h3>
      <p class="t-small" style="max-width:30ch;margin-inline:auto">وقتی اولین سفارش را ثبت کنید، اینجا پیدایش می‌کنید.</p>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:var(--s5)">شروع خرید</a></div>`;
  }
  return state.orders.map((o) => {
    const prog = orderStage(o);
    const win = exchangeWindow(o);
    return `
    <a class="order" href="#/order/${esc(o.id)}">
      <div class="order__hd">
        <div>
          <div class="order__id">${esc(o.id)}</div>
          <div class="t-fine">${esc(faDate(o.ts))} · ${o.items.reduce((n, i) => n + i.qty, 0)} قلم</div>
        </div>
        <div style="text-align:end">
          <span class="order__st ${o.cancelledAt ? '' : 'ok'}">${
            o.cancelledAt ? 'لغو شد' : esc(prog.stage.label)}</span>
          <div style="margin-block-start:var(--s2);font-size:14px">${toman(o.totals.grand)}</div>
        </div>
      </div>
      <div class="order__thumbs">
        ${o.items.map((i) => `<span><img src="${photoUrl(i.img)}" alt="${esc(i.title)}" loading="lazy"></span>`).join('')}
      </div>
      <div class="order__foot t-fine">
        <span>${o.cancelledAt ? 'اعتبار برگشت داده شد'
          : `${toman(o.earned)} اعتبار گرفتید`}</span>
        <span>${o.exchange ? 'درخواست تعویض ثبت شده'
          : win.open && !o.cancelledAt ? `${win.left} روز مهلت تعویض`
          : ''}</span>
        <span class="order__more">جزئیات و فاکتور ${ICON.back}</span>
      </div>
    </a>`;
  }).join('') + (PREVIEW.enabled ? `
    <p class="t-fine" style="margin-block-start:var(--s4)">
      وضعیت‌ها در این پیش‌نمایش از زمان ثبت سفارش حساب می‌شود، نه از سامانه‌ی پست.
    </p>` : '');
}

/* ------------------------------------------------------------ wishlist --- */
function wishPanel() {
  const items = state.wish.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  if (!items.length) {
    return `<div class="empty">${ICON.heart}
      <h3>علاقه‌مندی‌ها خالی است</h3>
      <p class="t-small" style="max-width:30ch;margin-inline:auto">روی قلبِ هر محصول بزنید تا اینجا ذخیره شود.</p>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:var(--s5)">دیدن کالکشن</a></div>`;
  }
  return `<div class="grid" data-cards>${items.map((p) => productCard(p)).join('')}</div>`;
}

/* ------------------------------------------------------------- address --- */
function addressPanel() {
  const a = state.addresses[0] || {};
  return `
  <div class="panel">
    <h3>آدرس تحویل</h3>
    <div class="fields fields--2">
      ${field('city', 'شهر', { value: a.city || 'تبریز' })}
      ${field('postal', 'کد پستی', { value: a.postal || '', inputmode: 'numeric', maxlength: 10, dir: 'ltr' })}
      ${field('line', 'نشانی کامل', { value: a.line || '', wide: true, type: 'textarea' })}
    </div>
    <button class="btn btn--sm" data-saveaddr style="margin-block-start:var(--s4)">ذخیره‌ی آدرس</button>
  </div>`;
}

/* ------------------------------------------------------------- profile --- */
function profilePanel() {
  const u = state.user;
  return `
  <div class="panel">
    <h3>اطلاعات حساب</h3>
    <div class="fields fields--2">
      ${field('name', 'نام و نام خانوادگی', { value: u.name || '', placeholder: 'برای تحویل سفارش' })}
      ${field('phone', 'شماره موبایل', { value: u.phone, dir: 'ltr', readonly: true })}
    </div>
    <div style="display:flex;gap:var(--s2);flex-wrap:wrap;margin-block-start:var(--s4)">
      <button class="btn btn--sm" data-saveuser>ذخیره</button>
      <button class="btn btn--ghost btn--sm" data-signout>خروج از حساب</button>
    </div>
    <p class="t-fine" style="margin-block-start:var(--s4)">عضو باشگاه از ${esc(faDate(u.joined))}</p>
  </div>

  <div class="panel">
    <h3>پشتیبانی</h3>
    <div class="trust">
      <div>${ICON.wa}<span>واتساپ — <a class="lat" style="color:var(--thread-d)" href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">+${BRAND.whatsapp}</a></span></div>
      <div>${ICON.insta}<span>اینستاگرام — <a class="lat" style="color:var(--thread-d)" href="https://instagram.com/${BRAND.instagram}" target="_blank" rel="noopener">@${BRAND.instagram}</a></span></div>
      <div>${ICON.pin}<span>${esc(BRAND.address)}</span></div>
    </div>
  </div>`;
}

/* ----------------------------------------------------------------- view --- */
const TABS = [
  { id: 'wallet',  label: 'کیف اعتبار',    icon: 'spark' },
  { id: 'orders',  label: 'سفارش‌ها',      icon: 'box' },
  { id: 'wish',    label: 'علاقه‌مندی‌ها', icon: 'heart' },
  { id: 'address', label: 'آدرس',          icon: 'pin' },
  { id: 'profile', label: 'حساب',          icon: 'user' },
];

export default function account(ctx) {
  const tab = ctx.query.get('tab') || 'wallet';

  // A guest can build a wishlist, so a guest can read it. Only the tabs that
  // genuinely need an identity sit behind the sign-in.
  if (!state.user && tab !== 'wish') return signInView();

  if (!state.user && tab === 'wish') {
    return {
      html: `
      <div class="wrap page-top">
        <span class="eyebrow">علاقه‌مندی‌ها</span>
        <h1 class="t-h1" style="margin-block:var(--s2) var(--s6)">ذخیره‌شده‌های شما</h1>
        ${wishPanel()}
        <div class="panel" style="margin-block-start:var(--s6)">
          <h3>برای همیشه نگهشان دارید</h3>
          <p class="t-small" style="margin-block-end:var(--s4)">
            با ورود به باشگاه، علاقه‌مندی‌هایتان روی همه‌ی دستگاه‌ها می‌ماند و
            ${toman(SHOP.wallet.welcome)} اعتبار هدیه می‌گیرید.
          </p>
          <a class="btn btn--sm" href="#/account">ورود با شماره موبایل</a>
        </div>
      </div>`,
      mount(root) { bindCards(root); reveal(root); },
    };
  }

  const render = {
    wallet: walletPanel, orders: ordersPanel, wish: wishPanel,
    address: addressPanel, profile: profilePanel,
  }[tab] || walletPanel;

  const first = (state.user.name || '').trim().split(' ')[0];

  const html = `
  <div class="wrap page-top">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:var(--s5);flex-wrap:wrap;margin-block-end:var(--s6)">
      <div>
        <span class="eyebrow">حساب کاربری</span>
        <h1 class="t-h1" style="margin-block-start:var(--s2)">
          ${first ? `سلام ${esc(first)}` : 'خوش آمدید'}
        </h1>
      </div>
      <div style="text-align:end">
        <div style="font-size:13px;color:var(--muted)">${esc(tier().tier.name)}</div>
        <div style="font-size:16px;font-weight:500">${toman(state.credit)}</div>
      </div>
    </div>

    <div class="acct">
      <nav class="acct__nav">
        ${TABS.map((t) => `
          <button class="${t.id === tab ? 'is-on' : ''}" data-tab="${t.id}">
            ${ICON[t.icon]}<span>${esc(t.label)}</span>
            ${t.id === 'wish' && state.wish.length ? `<span class="n num">${state.wish.length}</span>` : ''}
            ${t.id === 'orders' && state.orders.length ? `<span class="n num">${state.orders.length}</span>` : ''}
          </button>`).join('')}
      </nav>
      <div data-panel>${render()}</div>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      bindCards(root); reveal(root); settleImages(root);

      // The tab strip scrolls sideways on a phone and starts at the inline
      // start, so the later tabs — and the selected one — sit off the rail with
      // nothing looking chosen. Bring the active one into its own scroller
      // without moving the page.
      const nav = $('.acct__nav', root);
      const on = nav && $('.is-on', nav);
      if (nav && on) {
        nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
      }

      $$('[data-tab]', root).forEach((b) =>
        b.addEventListener('click', () => go(`/account?tab=${b.dataset.tab}`)));

      $('[data-signout]', root)?.addEventListener('click', () => {
        signOut(); toast('از حساب خارج شدید', 'logout'); go('/account');
      });

      $('[data-saveuser]', root)?.addEventListener('click', () => {
        setName($('[name="name"]', root).value.trim());
        toast('ذخیره شد');
      });

      $('[data-saveaddr]', root)?.addEventListener('click', () => {
        const f = readForm(root);
        if (!validPostal(f.postal)) return fieldError(root, 'postal', 'کد پستی باید ۱۰ رقم باشد');
        fieldError(root, 'postal', '');
        saveAddress({
          id: state.addresses[0]?.id, label: 'آدرس اصلی',
          province: state.addresses[0]?.province || 'آذربایجان شرقی',
          city: f.city, line: f.line, postal: digitsOnly(f.postal),
          phone: state.user.phone,
        });
        toast('آدرس ذخیره شد', 'pin');
      });
    },
  };
}
