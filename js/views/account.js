// LAUREN — account: loyalty club, orders, wishlist, addresses, profile.

import { SHOP, BRAND, PREVIEW } from '../config.js';
import { PRODUCTS } from '../data.js';
import { state, tier, signIn, signOut, saveAddress } from '../store.js';
import {
  ICON, field, fieldError, readForm, toast, productCard,
  bindCards, reveal, settleImages,
} from '../ui.js';
import { toman, esc, faDate, validPhone, validPostal, digitsOnly, $, $$ } from '../util.js';
import { go } from '../router.js';

/* ------------------------------------------------------------- sign in --- */
function signInView() {
  return {
    html: `
    <div class="wrap" style="padding-block-start:calc(var(--top-h) + 40px);max-width:460px">
      <div style="text-align:center;margin-block-end:32px">
        <img src="assets/brand/mark-bone.png" alt="" style="width:52px;margin-inline:auto;opacity:.9">
        <h1 class="h-sec" style="margin-block:22px 10px">ورود به باشگاه لارن</h1>
        <p class="lede">با شماره‌ی موبایل وارد شوید. عضویت رایگان است و
          ${SHOP.points.signupBonus} امتیاز خوش‌آمدگویی می‌گیرید.</p>
      </div>

      <div class="panel">
        <div class="fields" data-step1>
          ${field('name', 'نام و نام خانوادگی', { placeholder: 'مثلاً علی رضایی' })}
          ${field('phone', 'شماره موبایل', { placeholder: '09xxxxxxxxx', inputmode: 'numeric', maxlength: 11, dir: 'ltr' })}
          <button class="btn btn--block btn--lg" data-send style="margin-block-start:6px">دریافت کد تایید</button>
        </div>

        <div class="fields" data-step2 hidden>
          <p class="tiny" data-sent></p>
          ${field('otp', 'کد تایید', { placeholder: '۴ رقم', inputmode: 'numeric', maxlength: 4, dir: 'ltr' })}
          <button class="btn btn--block btn--lg" data-verify>ورود</button>
          <button class="btn btn--ghost btn--block btn--sm" data-back>تغییر شماره</button>
        </div>
      </div>

      <p class="tiny" style="text-align:center;margin-block-start:18px">
        ${esc(PREVIEW.note)} کد تایید روی همین صفحه نمایش داده می‌شود.
      </p>
    </div>`,
    mount(root) {
      let code = null;
      const s1 = $('[data-step1]', root), s2 = $('[data-step2]', root);

      $('[data-send]', root).addEventListener('click', () => {
        const f = readForm(s1);
        let ok = true;
        if (!f.name) { fieldError(root, 'name', 'نام را وارد کنید'); ok = false; }
        else fieldError(root, 'name', '');
        if (!validPhone(f.phone)) { fieldError(root, 'phone', 'شماره موبایل معتبر نیست'); ok = false; }
        else fieldError(root, 'phone', '');
        if (!ok) return;

        code = String(Math.floor(1000 + Math.random() * 8999));
        s1.hidden = true; s2.hidden = false;
        $('[data-sent]', root).innerHTML =
          `کد تایید برای <span class="lat" dir="ltr">${esc(f.phone)}</span> — <b style="color:var(--brass)" class="lat">${code}</b>`;
        $('#f-otp', root).focus();
      });

      $('[data-back]', root).addEventListener('click', () => { s2.hidden = true; s1.hidden = false; });

      $('[data-verify]', root).addEventListener('click', () => {
        const f = { ...readForm(s1), ...readForm(s2) };
        if (f.otp !== code) { fieldError(root, 'otp', 'کد وارد شده درست نیست'); return; }
        const isNew = signIn({ name: f.name, phone: digitsOnly(f.phone) });
        toast(isNew ? `خوش آمدید! ${SHOP.points.signupBonus} امتیاز هدیه گرفتید` : 'خوش برگشتید', 'spark');
        go('/account');
      });
    },
  };
}

/* ---------------------------------------------------------------- club --- */
function clubPanel() {
  const { tier: t, next, progress } = tier();
  const R = 62, C = 2 * Math.PI * R;
  const spent = state.orders.reduce((n, o) => n + o.totals.grand, 0);

  return `
  <div class="panel">
    <div class="tierwrap">
      <div class="ring">
        <svg width="138" height="138" viewBox="0 0 138 138">
          <circle class="bg" cx="69" cy="69" r="${R}"></circle>
          <circle class="fg" cx="69" cy="69" r="${R}"
                  stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - progress)}"></circle>
        </svg>
        <div class="ring__c"><b>${state.points}</b><span>امتیاز</span></div>
      </div>
      <div>
        <span class="eyebrow-fa">سطح شما</span>
        <h2 style="font-size:26px;font-weight:300;margin-block:8px 6px">${esc(t.name)}</h2>
        <p class="tiny" style="max-width:36ch">${esc(t.perk)}</p>
        <div class="tierbar">
          <div class="tierbar__track"><div class="tierbar__fill" style="width:${progress * 100}%"></div></div>
          <div class="tierbar__marks">
            ${SHOP.tiers.map((x) => `<b class="${state.lifetime >= x.min ? 'on' : ''}">${esc(x.name)}</b>`).join('')}
          </div>
        </div>
        ${next ? `<p class="tiny" style="margin-block-start:12px">
          ${next.min - state.lifetime} امتیاز تا سطح ${esc(next.name)} — ${esc(next.perk)}
        </p>` : `<p class="tiny" style="margin-block-start:12px;color:var(--brass)">بالاترین سطح باشگاه</p>`}
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="stats">
      <div class="stat"><b>${toman(state.points * SHOP.points.tomanPerPoint)}</b><span>اعتبار قابل استفاده</span></div>
      <div class="stat"><b>${state.orders.length}</b><span>سفارش ثبت‌شده</span></div>
      <div class="stat"><b>${toman(spent)}</b><span>مجموع خرید</span></div>
      <div class="stat"><b>${state.lifetime}</b><span>امتیاز مادام‌العمر</span></div>
    </div>
    <p class="tiny" style="margin-block-start:22px;padding-block-start:18px;border-block-start:1px solid var(--line)">
      هر ${toman(SHOP.points.perToman)} خرید = ۱ امتیاز · هر امتیاز = ${toman(SHOP.points.tomanPerPoint)} اعتبار.
      امتیازها هنگام تسویه‌حساب قابل استفاده‌اند.
    </p>
  </div>`;
}

/* -------------------------------------------------------------- orders --- */
function ordersPanel() {
  if (!state.orders.length) {
    return `<div class="empty" style="padding-block:60px">${ICON.box}
      <h3>هنوز سفارشی ندارید</h3>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">شروع خرید</a></div>`;
  }
  return state.orders.map((o) => `
    <div class="order">
      <div class="order__hd">
        <div>
          <div class="order__id">${esc(o.id)}</div>
          <div class="tiny">${esc(faDate(o.ts))} · ${o.items.reduce((n, i) => n + i.qty, 0)} قلم</div>
        </div>
        <div style="text-align:end">
          <span class="order__st ok">پرداخت‌شده</span>
          <div style="margin-block-start:8px;font-size:14px">${toman(o.totals.grand)}</div>
        </div>
      </div>
      <div class="order__thumbs">
        ${o.items.map((i) => `<img src="assets/products/${i.img}.jpg" alt="${esc(i.title)}" loading="lazy">`).join('')}
      </div>
      <div class="tiny" style="margin-block-start:12px;display:flex;gap:16px;flex-wrap:wrap">
        <span>+${o.earned} امتیاز</span>
        <span class="lat">${esc(o.ref)}</span>
      </div>
    </div>`).join('');
}

/* ------------------------------------------------------------ wishlist --- */
function wishPanel() {
  const items = state.wish.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  if (!items.length) {
    return `<div class="empty" style="padding-block:60px">${ICON.heart}
      <h3>علاقه‌مندی‌ها خالی است</h3>
      <p class="tiny" style="max-width:30ch;margin-inline:auto">
        روی قلبِ هر محصول بزنید تا اینجا ذخیره شود.</p>
      <a class="btn btn--ghost btn--sm" href="#/shop" style="margin-block-start:18px">دیدن کالکشن</a></div>`;
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
    <button class="btn btn--sm" data-saveaddr style="margin-block-start:18px">ذخیره‌ی آدرس</button>
  </div>`;
}

/* ------------------------------------------------------------- profile --- */
function profilePanel() {
  const u = state.user;
  return `
  <div class="panel">
    <h3>اطلاعات حساب</h3>
    <div class="fields fields--2">
      ${field('name', 'نام و نام خانوادگی', { value: u.name })}
      ${field('phone', 'شماره موبایل', { value: u.phone, inputmode: 'numeric', maxlength: 11, dir: 'ltr' })}
      ${field('email', 'ایمیل (اختیاری)', { value: u.email || '', type: 'email', dir: 'ltr', wide: true })}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-block-start:18px">
      <button class="btn btn--sm" data-saveuser>ذخیره</button>
      <button class="btn btn--ghost btn--sm" data-signout>خروج از حساب</button>
    </div>
    <p class="tiny" style="margin-block-start:18px">عضو باشگاه از ${esc(faDate(u.joined))}</p>
  </div>

  <div class="panel">
    <h3>پشتیبانی</h3>
    <div class="trust">
      <div>${ICON.wa}<span>واتساپ —
        <a class="lat" dir="ltr" style="color:var(--brass)" href="https://wa.me/${BRAND.whatsapp}"
           target="_blank" rel="noopener">+${BRAND.whatsapp}</a></span></div>
      <div>${ICON.insta}<span>اینستاگرام —
        <a class="lat" dir="ltr" style="color:var(--brass)" href="https://instagram.com/${BRAND.instagram}"
           target="_blank" rel="noopener">@${BRAND.instagram}</a></span></div>
      <div>${ICON.pin}<span>${esc(BRAND.address)}</span></div>
    </div>
  </div>`;
}

/* ----------------------------------------------------------------- view --- */
const TABS = [
  { id: 'club',    label: 'باشگاه لارن',   icon: 'spark' },
  { id: 'orders',  label: 'سفارش‌ها',      icon: 'box' },
  { id: 'wish',    label: 'علاقه‌مندی‌ها', icon: 'heart' },
  { id: 'address', label: 'آدرس‌ها',       icon: 'pin' },
  { id: 'profile', label: 'حساب کاربری',   icon: 'user' },
];

export default function account(ctx) {
  if (!state.user) return signInView();

  const tab = ctx.query.get('tab') || 'club';
  const render = {
    club: clubPanel, orders: ordersPanel, wish: wishPanel,
    address: addressPanel, profile: profilePanel,
  }[tab] || clubPanel;

  const html = `
  <div class="wrap" style="padding-block-start:calc(var(--top-h) + 30px)">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-block-end:32px">
      <div>
        <span class="eyebrow-fa">حساب کاربری</span>
        <h1 class="h-sec" style="margin-block-start:10px">سلام ${esc(state.user.name.split(' ')[0])}</h1>
      </div>
      <div style="text-align:end">
        <div style="font-size:13px;color:var(--brass)">${esc(tier().tier.name)}</div>
        <div class="tiny">${state.points} امتیاز</div>
      </div>
    </div>

    <div class="acct">
      <nav class="acct__nav">
        ${TABS.map((t) => `
          <button class="${t.id === tab ? 'is-on' : ''}" data-tab="${t.id}">
            ${ICON[t.icon]}<span>${esc(t.label)}</span>
            ${t.id === 'wish' && state.wish.length ? `<span style="margin-inline-start:auto;font-size:11px;color:var(--bone-3)">${state.wish.length}</span>` : ''}
            ${t.id === 'orders' && state.orders.length ? `<span style="margin-inline-start:auto;font-size:11px;color:var(--bone-3)">${state.orders.length}</span>` : ''}
          </button>`).join('')}
      </nav>
      <div data-panel>${render()}</div>
    </div>
  </div>`;

  return {
    html,
    mount(root) {
      bindCards(root); reveal(root); settleImages(root);

      $$('[data-tab]', root).forEach((b) =>
        b.addEventListener('click', () => go(`/account?tab=${b.dataset.tab}`)));

      $('[data-signout]', root)?.addEventListener('click', () => {
        signOut(); toast('از حساب خارج شدید', 'logout'); go('/account');
      });

      $('[data-saveuser]', root)?.addEventListener('click', () => {
        const f = readForm(root);
        if (!validPhone(f.phone)) return fieldError(root, 'phone', 'شماره موبایل معتبر نیست');
        fieldError(root, 'phone', '');
        signIn({ name: f.name || state.user.name, phone: digitsOnly(f.phone), email: f.email });
        toast('اطلاعات ذخیره شد');
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
